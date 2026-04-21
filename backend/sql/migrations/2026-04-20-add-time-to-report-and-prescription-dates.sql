ALTER TABLE prescriptions
  MODIFY COLUMN prescription_date DATETIME NOT NULL;

ALTER TABLE reports
  MODIFY COLUMN report_date DATETIME NOT NULL;

ALTER TABLE health_reports
  MODIFY COLUMN report_date DATETIME NOT NULL;
