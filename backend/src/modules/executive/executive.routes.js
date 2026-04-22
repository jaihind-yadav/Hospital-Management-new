const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("../../config/db");
const { authenticate } = require("../../middlewares/auth");
const { allowRoles } = require("../../middlewares/role");
const {
  getKolkataDate,
  getKolkataDateTime,
  normalizeKolkataDateTimeInput,
} = require("../../utils/dateTime");
const { generateOtp } = require("../../utils/otp");

const router = express.Router();
const allowedReportMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
]);

const upload = multer({
  dest: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  fileFilter: (_req, file, cb) => {
    if (!allowedReportMimeTypes.has(String(file.mimetype || "").toLowerCase())) {
      return cb(new Error("Only image files or PDF reports are allowed"));
    }
    cb(null, true);
  },
});
router.use(authenticate, allowRoles("executive"));

const normalizeTime = (value) => {
  if (!value) return "00:00:00";
  return String(value).trim().length === 5 ? `${String(value).trim()}:00` : String(value).trim();
};

const normalizeDateOnly = (value) => {
  if (!value) return "";

  const normalizedValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(normalizedValue)) {
    return normalizedValue.slice(0, 10);
  }

  return getKolkataDateTime(value).slice(0, 10);
};

const validateExecutiveBookingInput = (payload) => {
  const bookingMode = payload.booking_mode === "new" ? "new" : "existing";
  const patientId = payload.patient_id ? Number(payload.patient_id) : null;
  const doctorId = payload.doctor_id ? Number(payload.doctor_id) : null;
  const slotId = payload.slot_id ? Number(payload.slot_id) : null;
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const mobile = String(payload.mobile || "").trim();

  if (!doctorId || !slotId) {
    return { error: "Doctor and slot are required" };
  }

  if (bookingMode === "existing" && !patientId) {
    return { error: "Select an existing patient" };
  }

  if (bookingMode === "new") {
    if (!name || name.length < 2) {
      return { error: "Patient name is required" };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "A valid patient email is required" };
    }
    if (!mobile || mobile.length < 10 || mobile.length > 15) {
      return { error: "A valid patient mobile number is required" };
    }
  }

  return {
    bookingMode,
    patientId,
    doctorId,
    slotId,
    name,
    email,
    mobile,
  };
};

const getSlotBookingContext = async ({ slotId, doctorId }) => {
  const [slotRows] = await pool.query(
    `SELECT id, doctor_id, slot_date, start_time, end_time, is_active, max_appointments
     FROM doctor_slots
     WHERE id = ? AND doctor_id = ?
     LIMIT 1`,
    [slotId, doctorId]
  );

  if (!slotRows.length) {
    return { error: "Invalid slot or doctor" };
  }

  const slot = slotRows[0];
  if (!Number(slot.is_active)) {
    return { error: "Selected slot is inactive" };
  }

  const slotEndDateTime = `${normalizeDateOnly(slot.slot_date)} ${normalizeTime(slot.end_time)}`;
  const nowTime = getKolkataDateTime();

  if (slotEndDateTime < nowTime) {
    return { error: "Selected slot is already in the past" };
  }

  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS count FROM appointments WHERE slot_id = ? AND status <> 'cancelled'",
    [slotId]
  );

  if (countRows[0].count >= Number(slot.max_appointments || 0)) {
    return { error: "Selected slot is full" };
  }

  return { slot };
};

const resolveExecutiveBookingPatient = async (payload) => {
  if (payload.bookingMode === "existing") {
    const [rows] = await pool.query(
      "SELECT id, name, email, mobile, role FROM users WHERE id = ? LIMIT 1",
      [payload.patientId]
    );
    if (!rows.length || rows[0].role !== "patient") {
      return { error: "Selected patient not found" };
    }
    return { patient: rows[0] };
  }

  const [mobileRows] = await pool.query(
    "SELECT id, name, email, mobile, role FROM users WHERE mobile = ? LIMIT 1",
    [payload.mobile]
  );
  if (mobileRows.length && mobileRows[0].role !== "patient") {
    return { error: "This mobile number already belongs to a non-patient account" };
  }

  if (mobileRows.length) {
    return { patient: mobileRows[0] };
  }

  const [emailRows] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [payload.email]
  );
  if (emailRows.length) {
    return { error: "This email is already in use" };
  }

  return {
    patient: {
      id: null,
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      role: "patient",
    },
  };
};

const createExecutiveBookingPatient = async ({ name, email, mobile }) => {
  const tempPasswordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  const [result] = await pool.query(
    `INSERT INTO users (name, email, mobile, password_hash, role, is_verified)
     VALUES (?, ?, ?, ?, 'patient', 1)`,
    [name, email, mobile, tempPasswordHash]
  );

  await pool.query("INSERT INTO patient_profiles (user_id) VALUES (?)", [result.insertId]);

  return {
    id: result.insertId,
    name,
    email,
    mobile,
    role: "patient",
  };
};

const canReopenAppointment = async (appointmentId) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.status, a.slot_id, ds.slot_date, ds.start_time, ds.end_time, ds.is_active, ds.max_appointments
     FROM appointments a
     JOIN doctor_slots ds ON ds.id = a.slot_id
     WHERE a.id = ?
     LIMIT 1`,
    [appointmentId]
  );

  if (!rows.length) {
    return { ok: false, status: 404, message: "Appointment not found" };
  }

  const appointment = rows[0];
  if (appointment.status !== "cancelled") {
    return { ok: false, status: 409, message: "Only cancelled appointments can be reopened" };
  }

  if (!Number(appointment.is_active)) {
    return { ok: false, status: 409, message: "This slot is no longer active" };
  }

  const slotEndDateTime = `${normalizeDateOnly(appointment.slot_date)} ${normalizeTime(appointment.end_time)}`;
  const nowTime = getKolkataDateTime();

  if (slotEndDateTime < nowTime) {
    return { ok: false, status: 409, message: "Past slots cannot be reopened" };
  }

  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS count FROM appointments WHERE slot_id = ? AND status <> 'cancelled' AND id <> ?",
    [appointment.slot_id, appointment.id]
  );

  if (countRows[0].count >= Number(appointment.max_appointments || 0)) {
    return { ok: false, status: 409, message: "This slot is already full" };
  }

  return { ok: true, appointment };
};

router.get("/profile", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, mobile, role FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (error) {
    next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const { name, email, mobile } = req.body;
    await pool.query("UPDATE users SET name = ?, email = ?, mobile = ? WHERE id = ?", [
      name,
      email,
      mobile,
      req.user.id,
    ]);
    res.json({ message: "Profile updated" });
  } catch (error) {
    next(error);
  }
});

router.patch("/profile/password", async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 6) {
      return res.status(400).json({ message: "Current password and a valid new password are required" });
    }

    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );
    const user = rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      req.user.id,
    ]);
    res.json({ message: "Password updated" });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments", async (req, res, next) => {
  try {
    const selectedDate = req.query.date || getKolkataDate();
    const selectedDoctorId = req.query.doctor_id ? Number(req.query.doctor_id) : null;
    const params = [selectedDate];
    let doctorFilterQuery = "";

    if (selectedDoctorId) {
      doctorFilterQuery = " AND a.doctor_id = ? ";
      params.push(selectedDoctorId);
    }

    const [rows] = await pool.query(
      `SELECT
         a.*,
         p.name AS patient_name,
         d.name AS doctor_name,
         ds.slot_date,
         ds.start_time,
         ds.end_time,
         (
           SELECT COUNT(*)
           FROM appointments a2
           WHERE a2.slot_id = a.slot_id AND a2.id <= a.id
         ) AS slot_patient_number
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       JOIN users d ON d.id = a.doctor_id
       JOIN doctor_slots ds ON ds.id = a.slot_id
       WHERE DATE(a.appointment_date) = ?
       ${doctorFilterQuery}
       ORDER BY a.appointment_date DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.patch("/appointments/:id/attendance", async (req, res, next) => {
  try {
    const { is_present } = req.body;
    const [rows] = await pool.query(
      `SELECT id, status
       FROM appointments
       WHERE id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = rows[0];
    if (appointment.status === "completed") {
      return res.status(409).json({ message: "Completed appointments cannot be marked for attendance" });
    }

    if (appointment.status === "cancelled") {
      return res.status(409).json({ message: "Cancelled appointments cannot be marked for attendance" });
    }

    await pool.query("UPDATE appointments SET is_present = ? WHERE id = ?", [
      is_present,
      req.params.id,
    ]);
    res.json({ message: "Attendance marked" });
  } catch (error) {
    next(error);
  }
});

router.patch("/appointments/:id/reopen", async (req, res, next) => {
  try {
    const reopenCheck = await canReopenAppointment(req.params.id);
    if (!reopenCheck.ok) {
      return res.status(reopenCheck.status).json({ message: reopenCheck.message });
    }

    await pool.query(
      "UPDATE appointments SET status = 'booked', is_present = NULL WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Appointment reopened" });
  } catch (error) {
    next(error);
  }
});

router.get("/doctors", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, mobile FROM users WHERE role = 'admin' AND is_active = 1 ORDER BY name"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/doctors/:id/slots", async (req, res, next) => {
  try {
    const today = getKolkataDate();
    const [rows] = await pool.query(
      `SELECT *
       FROM doctor_slots
       WHERE doctor_id = ? AND is_active = 1 AND slot_date >= ?
       ORDER BY slot_date, start_time`,
      [req.params.id, today]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/patients", async (req, res, next) => {
  try {
    const searchText = String(req.query.q || "").trim();
    const params = [];
    let query = `
      SELECT u.id, u.name, u.email, u.mobile
      FROM users u
      WHERE u.role = 'patient'
    `;

    if (searchText) {
      query += `
        AND (
          u.name LIKE ?
          OR u.email LIKE ?
          OR u.mobile LIKE ?
          OR CAST(u.id AS CHAR) LIKE ?
        )
      `;
      const likeValue = `%${searchText}%`;
      params.push(likeValue, likeValue, likeValue, likeValue);
    }

    query += " ORDER BY u.name ASC, u.id ASC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/booking/send-otp", async (req, res, next) => {
  try {
    const payload = validateExecutiveBookingInput(req.body);
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const slotContext = await getSlotBookingContext({
      slotId: payload.slotId,
      doctorId: payload.doctorId,
    });
    if (slotContext.error) {
      return res.status(400).json({ message: slotContext.error });
    }

    const patientContext = await resolveExecutiveBookingPatient(payload);
    if (patientContext.error) {
      return res.status(400).json({ message: patientContext.error });
    }

    const otpCode = generateOtp();
    const expiresAt = getKolkataDateTime(new Date(Date.now() + 5 * 60 * 1000));

    await pool.query(
      "INSERT INTO otp_verifications (mobile, otp_code, expires_at) VALUES (?, ?, ?)",
      [patientContext.patient.mobile, otpCode, expiresAt]
    );

    res.status(201).json({
      message: "OTP sent successfully",
      otp_code: otpCode,
      expires_at: expiresAt,
      patient: patientContext.patient,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/booking/confirm", async (req, res, next) => {
  try {
    const payload = validateExecutiveBookingInput(req.body);
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const otpCode = String(req.body.otp_code || "").trim();
    if (!otpCode || otpCode.length !== 6) {
      return res.status(400).json({ message: "A valid OTP code is required" });
    }

    const slotContext = await getSlotBookingContext({
      slotId: payload.slotId,
      doctorId: payload.doctorId,
    });
    if (slotContext.error) {
      return res.status(400).json({ message: slotContext.error });
    }

    const patientContext = await resolveExecutiveBookingPatient(payload);
    if (patientContext.error) {
      return res.status(400).json({ message: patientContext.error });
    }

    const currentDateTime = getKolkataDateTime();
    const [otpRows] = await pool.query(
      `SELECT id
       FROM otp_verifications
       WHERE mobile = ? AND otp_code = ? AND is_used = 0 AND expires_at > ?
       ORDER BY id DESC
       LIMIT 1`,
      [patientContext.patient.mobile, otpCode, currentDateTime]
    );

    if (!otpRows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await pool.query("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", [
      otpRows[0].id,
    ]);

    let patient = patientContext.patient;
    if (!patient.id) {
      patient = await createExecutiveBookingPatient(patientContext.patient);
    }

    const appointmentDate = `${normalizeDateOnly(slotContext.slot.slot_date)} ${normalizeTime(
      slotContext.slot.start_time
    )}`;

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, slot_id, doctor_id, booked_by, appointment_date)
       VALUES (?, ?, ?, ?, ?)`,
      [patient.id, payload.slotId, payload.doctorId, req.user.id, appointmentDate]
    );

    res.status(201).json({
      id: result.insertId,
      message: "Appointment booked successfully",
      patient,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/patients/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile, p.gender, p.age, p.height_cm, p.weight_kg
       FROM users u
       LEFT JOIN patient_profiles p ON p.user_id = u.id
       WHERE u.id = ? AND u.role = 'patient'`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Patient not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/patients/:id/profile", async (req, res, next) => {
  try {
    const { name, email, mobile, gender, age, height_cm, weight_kg } = req.body;
    await pool.query(
      `UPDATE users
       SET name = ?, email = ?, mobile = ?
       WHERE id = ? AND role = 'patient'`,
      [name, email, mobile, req.params.id]
    );
    await pool.query(
      `INSERT INTO patient_profiles (user_id, gender, age, height_cm, weight_kg)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         gender = VALUES(gender),
         age = VALUES(age),
         height_cm = VALUES(height_cm),
         weight_kg = VALUES(weight_kg)`,
      [req.params.id, gender || null, age || null, height_cm || null, weight_kg || null]
    );
    res.json({ message: "Patient profile updated" });
  } catch (error) {
    next(error);
  }
});

router.post("/patients/:id/reports", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File is required" });
    const fileType = path.extname(req.file.originalname).replace(".", "").toLowerCase();
    const reportDate = normalizeKolkataDateTimeInput(req.body.report_date);
    const [result] = await pool.query(
      `INSERT INTO reports (patient_id, uploaded_by, file_name, file_path, file_type, report_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        req.user.id,
        req.file.originalname,
        req.file.path,
        fileType,
        reportDate,
      ]
    );
    res.status(201).json({ id: result.insertId, message: "Report uploaded" });
  } catch (error) {
    next(error);
  }
});

router.get("/patients/:id/reports", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM reports WHERE patient_id = ? ORDER BY report_date DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/patients/:id/health-reports", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM health_reports WHERE patient_id = ? ORDER BY report_date DESC, id DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/patients/:id/prescriptions", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.*, d.name AS doctor_name
       FROM prescriptions pr
       JOIN users d ON d.id = pr.doctor_id
       WHERE pr.patient_id = ?
       ORDER BY pr.prescription_date DESC, pr.id DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/patients/:id/health-reports", async (req, res, next) => {
  try {
    const { title, report_date, notes, tests } = req.body;
    if (!title || !Array.isArray(tests) || !tests.length) {
      return res.status(400).json({ message: "Title and at least one test row are required" });
    }

    const normalizedTests = tests.map((test) => ({
      test_name: test.test_name || "",
      result: test.result || "",
      unit: test.unit || "",
      range: test.range || "",
      level: test.level || "normal",
    }));

    const [result] = await pool.query(
      `INSERT INTO health_reports (patient_id, created_by, report_date, title, tests, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        req.user.id,
        normalizeKolkataDateTimeInput(report_date),
        title,
        JSON.stringify(normalizedTests),
        notes || null,
      ]
    );
    res.status(201).json({ id: result.insertId, message: "Health report created" });
  } catch (error) {
    next(error);
  }
});

router.delete("/reports/:id", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM reports WHERE id = ?", [req.params.id]);
    res.json({ message: "Report deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
