export const isEmail = (value) => /\S+@\S+\.\S+/.test(String(value || "").trim());

export const isMobile = (value) => /^\d{10,15}$/.test(String(value || "").trim());

export const isPositiveNumber = (value) => Number(value) > 0;

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!isEmail(email)) errors.email = "Enter a valid email address.";
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
};

export const validatePatientOtpLoginStepOne = ({ mobile }) => {
  const errors = {};
  if (!isMobile(mobile)) errors.mobile = "Mobile number must be 10 to 15 digits.";
  return errors;
};

export const validatePatientOtpLoginStepTwo = ({ mobile, otpCode }) => {
  const errors = validatePatientOtpLoginStepOne({ mobile });
  if (!/^\d{6}$/.test(String(otpCode || "").trim())) {
    errors.otpCode = "OTP must be exactly 6 digits.";
  }
  return errors;
};

export const validatePatientRegistrationStepOne = ({ mobile }) => {
  const errors = {};
  if (!isMobile(mobile)) errors.mobile = "Mobile number must be 10 to 15 digits.";
  return errors;
};

export const validatePatientRegistrationStepTwo = ({ otpCode }) => {
  const errors = {};
  if (!/^\d{6}$/.test(String(otpCode || "").trim())) {
    errors.otpCode = "OTP must be exactly 6 digits.";
  }
  return errors;
};

export const validatePatientRegistrationStepThree = ({ name, email, password, mobile }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (!isEmail(email)) errors.email = "Enter a valid email address.";
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (!isMobile(mobile)) errors.mobile = "Mobile verification is required.";
  return errors;
};

export const validateProfile = ({ name, email, mobile }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (email !== undefined && !isEmail(email)) errors.email = "Enter a valid email address.";
  if (mobile !== undefined && !isMobile(mobile)) {
    errors.mobile = "Mobile number must be 10 to 15 digits.";
  }
  return errors;
};

export const validatePatientProfile = ({ name, gender, age, height_cm, weight_kg }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (gender && !["male", "female", "other"].includes(String(gender).toLowerCase())) {
    errors.gender = "Use male, female, or other.";
  }
  if (age !== "" && age !== undefined && age !== null && Number(age) < 0) {
    errors.age = "Age cannot be negative.";
  }
  if (height_cm !== "" && height_cm !== undefined && height_cm !== null && Number(height_cm) <= 0) {
    errors.height_cm = "Height must be greater than 0.";
  }
  if (weight_kg !== "" && weight_kg !== undefined && weight_kg !== null && Number(weight_kg) <= 0) {
    errors.weight_kg = "Weight must be greater than 0.";
  }
  return errors;
};

export const validateDoctorSlot = ({ slot_date, start_time, end_time, max_appointments }) => {
  const errors = {};
  if (!slot_date) errors.slot_date = "Select a slot date.";
  if (!start_time) errors.start_time = "Select a start time.";
  if (!end_time) errors.end_time = "Select an end time.";
  if (start_time && end_time && start_time >= end_time) {
    errors.end_time = "End time must be after start time.";
  }
  if (!isPositiveNumber(max_appointments)) {
    errors.max_appointments = "Max appointments must be greater than 0.";
  }
  return errors;
};

export const validateBooking = ({ doctorId, slotId, appointment_date }) => {
  const errors = {};
  if (!doctorId) errors.doctorId = "Select a doctor.";
  if (!slotId) errors.slotId = "Select a slot.";
  if (!appointment_date) errors.appointment_date = "Appointment date is required.";
  return errors;
};

export const validateSuperAdminUser = ({ name, email, mobile, password, role }, isEditing = false) => {
  const errors = validateProfile({ name, email, mobile });
  if (!isEditing && (!password || password.length < 6)) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (!["admin", "executive"].includes(role)) {
    errors.role = "Role must be doctor or executive.";
  }
  return errors;
};

export const validateReportUpload = ({ patientId, file }) => {
  const errors = {};
  if (!isPositiveNumber(patientId)) errors.patientId = "Enter a valid patient ID.";
  if (!file) errors.file = "Please choose a report file.";
  if (file) {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(String(file.type || "").toLowerCase())) {
      errors.file = "Only image files or PDF reports are allowed.";
    }
  }
  return errors;
};

export const validatePasswordChange = ({ current_password, new_password, confirm_password }) => {
  const errors = {};
  if (!current_password) errors.current_password = "Current password is required.";
  if (!new_password || new_password.length < 6) {
    errors.new_password = "New password must be at least 6 characters.";
  }
  if (confirm_password !== undefined && new_password !== confirm_password) {
    errors.confirm_password = "Passwords do not match.";
  }
  return errors;
};
