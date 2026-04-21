const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const superAdminRoutes = require("../modules/superAdmin/superAdmin.routes");
const doctorRoutes = require("../modules/doctor/doctor.routes");
const patientRoutes = require("../modules/patient/patient.routes");
const executiveRoutes = require("../modules/executive/executive.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/doctor", doctorRoutes);
router.use("/patient", patientRoutes);
router.use("/executive", executiveRoutes);

module.exports = router;
