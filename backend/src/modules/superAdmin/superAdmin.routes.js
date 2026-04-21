const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../../config/db");
const { authenticate } = require("../../middlewares/auth");
const { allowRoles } = require("../../middlewares/role");

const router = express.Router();

router.use(authenticate, allowRoles("super_admin"));

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

router.get("/users", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, mobile, role, is_active, created_at FROM users WHERE role IN ('admin', 'executive') ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const { name, email, mobile, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, mobile, password_hash, role, is_verified)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [name, email, mobile, passwordHash, role]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, mobile, role, is_active FROM users WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id", async (req, res, next) => {
  try {
    const { name, email, mobile, role } = req.body;
    await pool.query(
      "UPDATE users SET name = ?, email = ?, mobile = ?, role = ? WHERE id = ?",
      [name, email, mobile, role, req.params.id]
    );
    res.json({ message: "User updated" });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id/toggle", async (req, res, next) => {
  try {
    await pool.query("UPDATE users SET is_active = 1 - is_active WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ message: "User status toggled" });
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
