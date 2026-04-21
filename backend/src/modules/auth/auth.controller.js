const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { pool } = require("../../config/db");
const { signToken } = require("../../utils/jwt");
const { generateOtp } = require("../../utils/otp");
const { getKolkataDateTime } = require("../../utils/dateTime");

const otpSendSchema = z.object({
  mobile: z.string().min(10).max(15),
});

const otpVerifySchema = z.object({
  mobile: z.string().min(10).max(15),
  otp_code: z.string().length(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10).max(15),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const mobileOtpLoginSchema = z.object({
  mobile: z.string().min(10).max(15),
  otp_code: z.string().length(6),
});

const getVerifiedOtpRecord = async (mobile, otpCode) => {
  const currentDateTime = getKolkataDateTime();
  const [rows] = await pool.query(
    `SELECT id
     FROM otp_verifications
     WHERE mobile = ? AND otp_code = ? AND is_used = 0 AND expires_at > ?
     ORDER BY id DESC LIMIT 1`,
    [mobile, otpCode, currentDateTime]
  );
  return rows[0] || null;
};

const getLatestConsumedOrVerifiedOtp = async (mobile) => {
  const currentDateTime = getKolkataDateTime();
  const [rows] = await pool.query(
    `SELECT id
     FROM otp_verifications
     WHERE mobile = ? AND is_used = 1 AND expires_at > ?
     ORDER BY id DESC LIMIT 1`,
    [mobile, currentDateTime]
  );
  return rows[0] || null;
};

const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = otpSendSchema.parse(req.body);
    const otpCode = generateOtp();
    const expiresAt = getKolkataDateTime(new Date(Date.now() + 5 * 60 * 1000));

    await pool.query(
      "INSERT INTO otp_verifications (mobile, otp_code, expires_at) VALUES (?, ?, ?)",
      [mobile, otpCode, expiresAt]
    );

    return res.status(201).json({
      message: "OTP sent successfully",
      otp_code: otpCode,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp_code: otpCode } = otpVerifySchema.parse(req.body);

    const currentDateTime = getKolkataDateTime();
    const [rows] = await pool.query(
      `SELECT id FROM otp_verifications 
       WHERE mobile = ? AND otp_code = ? AND is_used = 0 AND expires_at > ?
       ORDER BY id DESC LIMIT 1`,
      [mobile, otpCode, currentDateTime]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await pool.query("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", [
      rows[0].id,
    ]);

    return res.json({ message: "OTP verified successfully" });
  } catch (error) {
    return next(error);
  }
};

const registerPatient = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    const verifiedOtp = await getLatestConsumedOrVerifiedOtp(payload.mobile);

    if (!verifiedOtp) {
      return res.status(400).json({
        message: "Mobile not verified. Please complete OTP verification first.",
      });
    }

    const [mobileRows] = await pool.query(
      "SELECT id, role FROM users WHERE mobile = ? LIMIT 1",
      [payload.mobile]
    );
    const existingPatient = mobileRows[0] || null;

    if (existingPatient && existingPatient.role !== "patient") {
      return res.status(400).json({
        message: "This mobile number is already linked to a non-patient account.",
      });
    }

    const [emailRows] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [payload.email]
    );
    if (emailRows.length && (!existingPatient || emailRows[0].id !== existingPatient.id)) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    if (existingPatient) {
      await pool.query(
        `UPDATE users
         SET name = ?, email = ?, password_hash = ?, is_verified = 1
         WHERE id = ?`,
        [payload.name, payload.email, passwordHash, existingPatient.id]
      );

      await pool.query(
        `INSERT INTO patient_profiles (user_id)
         VALUES (?)
         ON DUPLICATE KEY UPDATE user_id = user_id`,
        [existingPatient.id]
      );

      return res.json({
        message: "Patient registration completed successfully",
        user_id: existingPatient.id,
      });
    }

    const [result] = await pool.query(
      `INSERT INTO users (name, email, mobile, password_hash, role, is_verified)
       VALUES (?, ?, ?, ?, 'patient', 1)`,
      [payload.name, payload.email, payload.mobile, passwordHash]
    );

    await pool.query(
      `INSERT INTO patient_profiles (user_id)
       VALUES (?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [result.insertId]
    );

    return res.status(201).json({
      message: "Patient registered successfully",
      user_id: result.insertId,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [rows] = await pool.query(
      "SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const loginWithOtp = async (req, res, next) => {
  try {
    const { mobile, otp_code: otpCode } = mobileOtpLoginSchema.parse(req.body);

    const verifiedOtp = await getVerifiedOtpRecord(mobile, otpCode);
    if (!verifiedOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const [rows] = await pool.query(
      `SELECT id, name, email, mobile, role, is_active
       FROM users
       WHERE mobile = ? AND role = 'patient'
       LIMIT 1`,
      [mobile]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Patient account not found. Please complete registration first.",
      });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    await pool.query("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", [
      verifiedOtp.id,
    ]);
    await pool.query("UPDATE users SET is_verified = 1 WHERE id = ?", [user.id]);

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res) =>
  res.json({
    message: "Logout successful on client side. Remove stored JWT token.",
  });

module.exports = {
  sendOtp,
  verifyOtp,
  registerPatient,
  login,
  loginWithOtp,
  logout,
};
