const express = require("express");
const {
  sendOtp,
  verifyOtp,
  registerPatient,
  login,
  loginWithOtp,
  logout,
} = require("./auth.controller");

const router = express.Router();

router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/register/patient", registerPatient);
router.post("/login", login);
router.post("/login/patient-otp", loginWithOtp);
router.post("/logout", logout);

module.exports = router;
