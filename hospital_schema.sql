-- ============================================================
--  Hospital Appointment System — MySQL Schema
--  Generated: 2026-03-18
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hospital_db;

-- ============================================================
--  1. USERS
--     Central table for all roles:
--     super_admin | admin (doctor) | executive | patient
-- ============================================================
CREATE TABLE users (
    id             BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name           VARCHAR(150)        NOT NULL,
    email          VARCHAR(255)        NOT NULL,
    mobile         VARCHAR(15)         NOT NULL,
    password_hash  VARCHAR(255)        NOT NULL,
    role           ENUM(
                       'super_admin',
                       'admin',
                       'executive',
                       'patient'
                   )                   NOT NULL,
    is_verified    TINYINT(1)          NOT NULL DEFAULT 0  COMMENT '1 = mobile OTP verified',
    is_active      TINYINT(1)          NOT NULL DEFAULT 1,
    created_at     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email  (email),
    UNIQUE KEY uq_users_mobile (mobile),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  2. PATIENT_PROFILES
--     Extended profile — only patients have this row.
-- ============================================================
CREATE TABLE patient_profiles (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED     NOT NULL,
    gender      ENUM('male','female','other') DEFAULT NULL,
    age         TINYINT UNSIGNED    DEFAULT NULL,
    height_cm   DECIMAL(5,2)        DEFAULT NULL COMMENT 'Height in centimetres',
    weight_kg   DECIMAL(5,2)        DEFAULT NULL COMMENT 'Weight in kilograms',
    updated_at  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_patient_profiles_user (user_id),
    CONSTRAINT fk_pp_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  3. DOCTOR_SLOTS
--     A doctor can create multiple slots per day.
--     max_appointments caps how many bookings a slot accepts.
-- ============================================================
CREATE TABLE doctor_slots (
    id                BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    doctor_id         BIGINT UNSIGNED   NOT NULL,
    slot_date         DATE              NOT NULL,
    start_time        TIME              NOT NULL,
    end_time          TIME              NOT NULL,
    max_appointments  TINYINT UNSIGNED  NOT NULL DEFAULT 1,
    is_active         TINYINT(1)        NOT NULL DEFAULT 1,
    created_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_ds_doctor_date (doctor_id, slot_date),
    CONSTRAINT fk_ds_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  4. APPOINTMENTS
--     Links patient ↔ slot ↔ doctor for one visit.
--     status: booked | cancelled | completed
--     is_present: set by executive on the day
-- ============================================================
CREATE TABLE appointments (
    id                BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    patient_id        BIGINT UNSIGNED   NOT NULL,
    slot_id           BIGINT UNSIGNED   NOT NULL,
    doctor_id         BIGINT UNSIGNED   NOT NULL,
    booked_by         BIGINT UNSIGNED   NOT NULL
    appointment_date  DATE              NOT NULL,
    status            ENUM(
                          'booked',
                          'cancelled',
                          'completed'
                      )                 NOT NULL DEFAULT 'booked',
    is_present        TINYINT(1)        DEFAULT NULL COMMENT 'NULL=not marked, 1=present, 0=absent',
    booked_at         TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                 ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_appt_patient      (patient_id),
    INDEX idx_appt_doctor_date  (doctor_id, appointment_date),
    INDEX idx_appt_slot         (slot_id),
    INDEX idx_appt_booked_by    (booked_by),
    CONSTRAINT fk_appt_patient
        FOREIGN KEY (patient_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_appt_slot
        FOREIGN KEY (slot_id)
        REFERENCES doctor_slots (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_appt_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  5. PRESCRIPTIONS
--     One prescription per appointment visit.
--     doctor_id and patient_id are denormalised for fast
--     history queries without always joining appointments.
-- ============================================================
CREATE TABLE prescriptions (
    id                 BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    appointment_id     BIGINT UNSIGNED  NOT NULL,
    doctor_id          BIGINT UNSIGNED  NOT NULL,
    patient_id         BIGINT UNSIGNED  NOT NULL,
    notes              TEXT             DEFAULT NULL COMMENT 'Doctor observations / diagnosis notes',
    medicines          TEXT             DEFAULT NULL COMMENT 'Medicine list (JSON or plain text)',
    prescription_date  DATETIME         NOT NULL,
    created_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_prescription_appointment (appointment_id) COMMENT 'One prescription per appointment',
    INDEX idx_rx_patient (patient_id),
    INDEX idx_rx_doctor  (doctor_id),
    CONSTRAINT fk_rx_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_rx_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_rx_patient
        FOREIGN KEY (patient_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  6. REPORTS
--     Files uploaded by executives for a patient.
--     uploaded_by references the executive's user id.
--     file_path stores the location on disk / object storage.
-- ============================================================
CREATE TABLE reports (
    id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    patient_id   BIGINT UNSIGNED   NOT NULL,
    uploaded_by  BIGINT UNSIGNED   NOT NULL COMMENT 'Executive user id',
    file_name    VARCHAR(255)      NOT NULL,
    file_path    VARCHAR(500)      NOT NULL,
    file_type    VARCHAR(50)       NOT NULL COMMENT 'e.g. pdf, jpg, png',
    report_date  DATETIME          NOT NULL,
    uploaded_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_reports_patient     (patient_id),
    INDEX idx_reports_uploaded_by (uploaded_by),
    CONSTRAINT fk_rpt_patient
        FOREIGN KEY (patient_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_rpt_uploader
        FOREIGN KEY (uploaded_by)
        REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  7. OTP_VERIFICATIONS
--     Short-lived OTPs for patient mobile verification.
--     is_used prevents replay; expires_at enforces TTL.
-- ============================================================
CREATE TABLE otp_verifications (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    mobile      VARCHAR(15)      NOT NULL,
    otp_code    VARCHAR(10)      NOT NULL,
    is_used     TINYINT(1)       NOT NULL DEFAULT 0,
    expires_at  TIMESTAMP        NOT NULL,
    created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_otp_mobile (mobile),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 8. HEALTH_REPORTS
--
--  The executive creates a health report for a patient by
--  entering one or more test rows. Each row has:
--    test_name  — e.g. "Haemoglobin", "Blood Glucose"
--    result     — the measured value e.g. "13.5"
--    unit       — e.g. "g/dL", "mg/dL"
--    range      — normal reference range e.g. "12.0-17.5"
--    level      — interpretation: normal | high | low | critical
--
--  All test rows are stored as a JSON array in the `tests`
--  column. One table, no extra rows per test.
-- ============================================================
CREATE TABLE health_reports (
    id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    patient_id   BIGINT UNSIGNED   NOT NULL
                                   COMMENT 'Patient this report belongs to',
    created_by   BIGINT UNSIGNED   NOT NULL
                                   COMMENT 'Executive who created the report',
    report_date  DATETIME          NOT NULL
                                  COMMENT 'Date and time the tests were conducted',
    title        VARCHAR(200)      NOT NULL
                                   COMMENT 'e.g. Complete Blood Count, Lipid Panel',
 
    -- Each element in the JSON array:
    -- {
    --   "test_name": "Haemoglobin",
    --   "result":    "13.5",
    --   "unit":      "g/dL",
    --   "range":     "12.0-17.5",
    --   "level":     "normal"
    -- }
    -- level values: normal | high | low | critical
    tests        JSON              NOT NULL
                                   COMMENT 'Array of test objects',
 
    notes        TEXT              DEFAULT NULL,
    created_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    PRIMARY KEY (id),
    INDEX idx_hr_patient    (patient_id),
    INDEX idx_hr_created_by (created_by),
    INDEX idx_hr_date       (report_date),
 
    CONSTRAINT fk_hr_patient
        FOREIGN KEY (patient_id)  REFERENCES users (id)
        ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT fk_hr_created_by
        FOREIGN KEY (created_by)  REFERENCES users (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
--  Sample INSERT
-- ============================================================
-- INSERT INTO health_reports (patient_id, created_by, report_date, title, tests)
-- VALUES (
--   1, 5, '2026-03-19', 'Complete Blood Count',
--   JSON_ARRAY(
--     JSON_OBJECT('test_name','Haemoglobin',  'result','13.5','unit','g/dL',    'range','12.0-17.5','level','normal'),
--     JSON_OBJECT('test_name','Blood Glucose','result','110', 'unit','mg/dL',   'range','70-100',   'level','high'),
--     JSON_OBJECT('test_name','WBC Count',    'result','4.2', 'unit','x10^3/uL','range','4.0-11.0', 'level','normal'),
--     JSON_OBJECT('test_name','Platelets',    'result','145', 'unit','x10^3/uL','range','150-400',  'level','low')
--   )
-- );


-- ============================================================
--  End of schema
-- ============================================================
