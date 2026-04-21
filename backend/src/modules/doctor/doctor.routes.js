const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../../config/db");
const { authenticate } = require("../../middlewares/auth");
const { allowRoles } = require("../../middlewares/role");
const { getKolkataDate, getKolkataDateTime } = require("../../utils/dateTime");

const router = express.Router();
router.use(authenticate, allowRoles("admin"));

const normalizeTime = (value) => {
  if (!value) return "";
  return String(value).trim().length === 5 ? `${String(value).trim()}:00` : String(value).trim();
};

const validateSlotPayload = ({ slot_date, start_time, end_time, max_appointments }) => {
  if (!slot_date || !start_time || !end_time) {
    return "Slot date, start time, and end time are required";
  }

  const normalizedStart = normalizeTime(start_time);
  const normalizedEnd = normalizeTime(end_time);

  if (normalizedStart >= normalizedEnd) {
    return "End time must be greater than start time";
  }

  if (Number(max_appointments) < 1) {
    return "Maximum appointments must be at least 1";
  }

  return null;
};

const findConflictingSlot = async ({
  doctorId,
  slotDate,
  startTime,
  endTime,
  excludeSlotId = null,
}) => {
  const params = [doctorId, slotDate, normalizeTime(endTime), normalizeTime(startTime)];
  let query = `
    SELECT id, slot_date, start_time, end_time
    FROM doctor_slots
    WHERE doctor_id = ?
      AND slot_date = ?
      AND start_time < ?
      AND end_time > ?
    LIMIT 1
  `;

  if (excludeSlotId) {
    query = `
      ${query.replace("LIMIT 1", "")}
      AND id <> ?
      LIMIT 1
    `;
    params.push(excludeSlotId);
  }

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
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

router.get("/slots", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM doctor_slots WHERE doctor_id = ? ORDER BY slot_date DESC, start_time DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/slots", async (req, res, next) => {
  try {
    const { slot_date, start_time, end_time, max_appointments = 1 } = req.body;
    const validationMessage = validateSlotPayload({
      slot_date,
      start_time,
      end_time,
      max_appointments,
    });

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const conflictingSlot = await findConflictingSlot({
      doctorId: req.user.id,
      slotDate: slot_date,
      startTime: start_time,
      endTime: end_time,
    });

    if (conflictingSlot) {
      return res.status(409).json({
        message: "This slot overlaps an existing slot for the selected doctor and date",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO doctor_slots (doctor_id, slot_date, start_time, end_time, max_appointments)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        slot_date,
        normalizeTime(start_time),
        normalizeTime(end_time),
        max_appointments,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.put("/slots/:id", async (req, res, next) => {
  try {
    const { slot_date, start_time, end_time, max_appointments, is_active } = req.body;
    const validationMessage = validateSlotPayload({
      slot_date,
      start_time,
      end_time,
      max_appointments,
    });

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const conflictingSlot = await findConflictingSlot({
      doctorId: req.user.id,
      slotDate: slot_date,
      startTime: start_time,
      endTime: end_time,
      excludeSlotId: req.params.id,
    });

    if (conflictingSlot) {
      return res.status(409).json({
        message: "This slot overlaps an existing slot for the selected doctor and date",
      });
    }

    await pool.query(
      `UPDATE doctor_slots SET slot_date=?, start_time=?, end_time=?, max_appointments=?, is_active=?
       WHERE id=? AND doctor_id=?`,
      [
        slot_date,
        normalizeTime(start_time),
        normalizeTime(end_time),
        max_appointments,
        is_active,
        req.params.id,
        req.user.id,
      ]
    );
    res.json({ message: "Slot updated" });
  } catch (error) {
    next(error);
  }
});

router.delete("/slots/:id", async (req, res, next) => {
  try {
    const [bookingRows] = await pool.query(
      `SELECT id
       FROM appointments
       WHERE slot_id = ? AND doctor_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (bookingRows.length) {
      return res.status(409).json({
        message: "This slot cannot be deleted because a patient has already booked it",
      });
    }

    await pool.query("DELETE FROM doctor_slots WHERE id = ? AND doctor_id = ?", [
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: "Slot deleted" });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments", async (req, res, next) => {
  try {
    const selectedDate = req.query.date || getKolkataDate();
    const [rows] = await pool.query(
      `SELECT
         a.*,
         u.name AS patient_name,
         ds.slot_date,
         ds.start_time,
         ds.end_time,
         (
           SELECT COUNT(*)
           FROM appointments a2
           WHERE a2.slot_id = a.slot_id AND a2.id <= a.id
         ) AS slot_patient_number
       FROM appointments a
       JOIN users u ON u.id = a.patient_id
       JOIN doctor_slots ds ON ds.id = a.slot_id
       WHERE a.doctor_id = ? AND DATE(a.appointment_date) = ?
       ORDER BY a.appointment_date DESC`,
      [req.user.id, selectedDate]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/:id/patient", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile, p.gender, p.age, p.height_cm, p.weight_kg
       FROM appointments a
       JOIN users u ON u.id = a.patient_id
       LEFT JOIN patient_profiles p ON p.user_id = u.id
       WHERE a.id = ? AND a.doctor_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Appointment not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/:id/prescriptions", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.*, d.name AS doctor_name
       FROM appointments a
       JOIN prescriptions pr ON pr.patient_id = a.patient_id
       JOIN users d ON d.id = pr.doctor_id
       WHERE a.id = ? AND a.doctor_id = ?
       ORDER BY pr.prescription_date DESC, pr.id DESC`,
      [req.params.id, req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/:id/reports", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*
       FROM appointments a
       JOIN reports r ON r.patient_id = a.patient_id
       WHERE a.id = ? AND a.doctor_id = ?
       ORDER BY r.report_date DESC, r.id DESC`,
      [req.params.id, req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/:id/health-reports", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT hr.*
       FROM appointments a
       JOIN health_reports hr ON hr.patient_id = a.patient_id
       WHERE a.id = ? AND a.doctor_id = ?
       ORDER BY hr.report_date DESC, hr.id DESC`,
      [req.params.id, req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/:id/prescription", async (req, res, next) => {
  try {
    const { notes, medicines } = req.body;
    const [appointments] = await pool.query(
      `SELECT id, patient_id, appointment_date
       FROM appointments
       WHERE id = ? AND doctor_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (!appointments.length) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = appointments[0];
    const [existing] = await pool.query(
      "SELECT id FROM prescriptions WHERE appointment_id = ? LIMIT 1",
      [appointment.id]
    );

    if (existing.length) {
      await pool.query(
        `UPDATE prescriptions
         SET notes = ?, medicines = ?, prescription_date = ?
         WHERE appointment_id = ?`,
        [notes || null, medicines || null, getKolkataDateTime(), appointment.id]
      );
      return res.json({ message: "Prescription updated" });
    }

    await pool.query(
      `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, notes, medicines, prescription_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        appointment.id,
        req.user.id,
        appointment.patient_id,
        notes || null,
        medicines || null,
        getKolkataDateTime(),
      ]
    );

    await pool.query("UPDATE appointments SET status = 'completed' WHERE id = ?", [
      appointment.id,
    ]);

    res.status(201).json({ message: "Prescription created" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
