const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../../config/db");
const { authenticate } = require("../../middlewares/auth");
const { allowRoles } = require("../../middlewares/role");
const { getKolkataDate, getKolkataDateTime } = require("../../utils/dateTime");

const router = express.Router();
router.use(authenticate, allowRoles("patient"));

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
      `SELECT u.id, u.name, u.email, u.mobile, p.gender, p.age, p.height_cm, p.weight_kg
       FROM users u
       LEFT JOIN patient_profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (error) {
    next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const { name, gender, age, height_cm, weight_kg } = req.body;
    await pool.query("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id]);
    await pool.query(
      `UPDATE patient_profiles 
       SET gender = ?, age = ?, height_cm = ?, weight_kg = ?
       WHERE user_id = ?`,
      [gender, age, height_cm, weight_kg, req.user.id]
    );
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
      `SELECT * FROM doctor_slots
       WHERE doctor_id = ? AND is_active = 1 AND slot_date >= ?
       ORDER BY slot_date, start_time`,
      [req.params.id, today]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/appointments", async (req, res, next) => {
  try {
    const { slot_id, doctor_id, appointment_date } = req.body;
    const [slotRows] = await pool.query(
      "SELECT max_appointments FROM doctor_slots WHERE id = ? AND doctor_id = ?",
      [slot_id, doctor_id]
    );
    if (!slotRows.length) {
      return res.status(400).json({ message: "Invalid slot or doctor" });
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM appointments WHERE slot_id = ? AND status <> 'cancelled'",
      [slot_id]
    );
    if (countRows[0].count >= slotRows[0].max_appointments) {
      return res.status(400).json({ message: "Slot is full" });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, slot_id, doctor_id, booked_by, appointment_date)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, slot_id, doctor_id, req.user.id, appointment_date]
    );
    res.status(201).json({ id: result.insertId, message: "Appointment booked" });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         a.*,
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
       JOIN users d ON d.id = a.doctor_id
       JOIN doctor_slots ds ON ds.id = a.slot_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.delete("/appointments/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, status, is_present
       FROM appointments
       WHERE id = ? AND patient_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = rows[0];
    if (appointment.status === "completed") {
      return res.status(409).json({ message: "Completed appointments cannot be cancelled" });
    }

    if (appointment.status === "cancelled") {
      return res.status(409).json({ message: "This appointment is already cancelled" });
    }

    if (Number(appointment.is_present) === 1) {
      return res.status(409).json({ message: "Present-marked appointments cannot be cancelled" });
    }

    await pool.query(
      "UPDATE appointments SET status = 'cancelled' WHERE id = ? AND patient_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Appointment cancelled" });
  } catch (error) {
    next(error);
  }
});

router.patch("/appointments/:id/reopen", async (req, res, next) => {
  try {
    const [ownedRows] = await pool.query(
      "SELECT id FROM appointments WHERE id = ? AND patient_id = ? LIMIT 1",
      [req.params.id, req.user.id]
    );

    if (!ownedRows.length) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const reopenCheck = await canReopenAppointment(req.params.id);
    if (!reopenCheck.ok) {
      return res.status(reopenCheck.status).json({ message: reopenCheck.message });
    }

    await pool.query(
      "UPDATE appointments SET status = 'booked', is_present = NULL WHERE id = ? AND patient_id = ?",
      [req.params.id, req.user.id]
    );

    res.json({ message: "Appointment reopened" });
  } catch (error) {
    next(error);
  }
});

router.get("/prescriptions", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.*, d.name AS doctor_name
       FROM prescriptions pr
       JOIN users d ON d.id = pr.doctor_id
       WHERE pr.patient_id = ?
       ORDER BY pr.prescription_date DESC, pr.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req, res, next) => {
  try {
    const [fileReports] = await pool.query(
      `SELECT id, file_name AS title, file_path, file_type, report_date, 'file' AS kind
       FROM reports
       WHERE patient_id = ?
       ORDER BY report_date DESC, id DESC`,
      [req.user.id]
    );
    const [healthReports] = await pool.query(
      `SELECT id, title, report_date, notes, tests, 'health' AS kind
       FROM health_reports
       WHERE patient_id = ?
       ORDER BY report_date DESC, id DESC`,
      [req.user.id]
    );
    res.json({
      files: fileReports,
      health_reports: healthReports,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
