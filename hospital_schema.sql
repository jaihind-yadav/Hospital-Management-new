-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: hospital_db
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `slot_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `booked_by` bigint unsigned NOT NULL,
  `appointment_date` date NOT NULL,
  `status` enum('booked','cancelled','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'booked',
  `is_present` tinyint(1) DEFAULT NULL,
  `booked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appt_patient` (`patient_id`),
  KEY `idx_appt_doctor_date` (`doctor_id`,`appointment_date`),
  KEY `idx_appt_slot` (`slot_id`),
  KEY `idx_appt_booked_by` (`booked_by`),
  CONSTRAINT `fk_appt_booked_by` FOREIGN KEY (`booked_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appt_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appt_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appt_slot` FOREIGN KEY (`slot_id`) REFERENCES `doctor_slots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (2,1,3,5,1,'2026-04-07','completed',1,'2026-04-07 07:56:27','2026-04-09 11:24:15'),(3,1,6,5,1,'2026-04-07','cancelled',NULL,'2026-04-07 07:58:48','2026-04-09 11:21:51'),(5,1,8,5,4,'2026-04-20','booked',1,'2026-04-20 07:38:41','2026-04-20 09:58:14'),(6,6,8,5,4,'2026-04-20','booked',NULL,'2026-04-20 07:40:34','2026-04-20 07:40:34'),(7,7,8,5,4,'2026-04-20','booked',NULL,'2026-04-20 07:42:08','2026-04-20 07:42:08'),(8,8,8,5,8,'2026-04-20','cancelled',NULL,'2026-04-20 08:03:54','2026-04-20 08:04:06'),(9,8,9,5,8,'2026-04-21','completed',NULL,'2026-04-21 07:32:33','2026-04-21 07:34:21'),(10,9,10,5,4,'2026-04-24','completed',NULL,'2026-04-24 10:39:01','2026-04-24 10:40:14'),(11,9,10,5,9,'2026-04-24','booked',NULL,'2026-04-24 10:44:07','2026-04-24 10:44:07'),(12,9,11,5,4,'2026-04-28','booked',NULL,'2026-04-28 07:48:49','2026-04-28 07:48:49'),(13,10,11,5,10,'2026-04-28','booked',NULL,'2026-04-28 07:49:31','2026-04-28 07:49:31');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_slots`
--

DROP TABLE IF EXISTS `doctor_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_slots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_appointments` tinyint unsigned NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ds_doctor_date` (`doctor_id`,`slot_date`),
  CONSTRAINT `fk_ds_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_slots`
--

LOCK TABLES `doctor_slots` WRITE;
/*!40000 ALTER TABLE `doctor_slots` DISABLE KEYS */;
INSERT INTO `doctor_slots` VALUES (3,5,'2026-04-07','14:00:00','18:00:00',10,1,'2026-04-07 07:48:22'),(6,5,'2026-04-07','18:00:00','20:00:00',9,1,'2026-04-07 07:58:10'),(8,5,'2026-04-20','12:00:00','15:00:00',19,1,'2026-04-20 06:05:27'),(9,5,'2026-04-21','13:00:00','16:00:00',12,1,'2026-04-21 07:32:07'),(10,5,'2026-04-24','17:01:00','18:06:00',23,1,'2026-04-24 10:36:32'),(11,5,'2026-04-28','13:16:00','16:16:00',10,1,'2026-04-28 07:46:35');
/*!40000 ALTER TABLE `doctor_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_reports`
--

DROP TABLE IF EXISTS `health_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `report_date` datetime NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tests` json NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_hr_patient` (`patient_id`),
  KEY `fk_hr_created_by` (`created_by`),
  CONSTRAINT `fk_hr_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_hr_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_reports`
--

LOCK TABLES `health_reports` WRITE;
/*!40000 ALTER TABLE `health_reports` DISABLE KEYS */;
INSERT INTO `health_reports` VALUES (1,1,4,'2026-04-09 00:00:00','fdgdgdfg','[{\"unit\": \"453\", \"level\": \"high\", \"range\": \"435\", \"result\": \"45\", \"test_name\": \"dfgdfg\"}, {\"unit\": \"ert\", \"level\": \"low\", \"range\": \"ert\", \"result\": \"ert\", \"test_name\": \"tretert\"}]',NULL,'2026-04-09 10:45:39'),(2,1,4,'2026-04-20 11:46:47','dfdsfsdfsdf','[{\"unit\": \"asdasd\", \"level\": \"normal\", \"range\": \"asdasd\", \"result\": \"asdasd\", \"test_name\": \"234234dasa\"}]','fsdfsdfsdfsdf','2026-04-20 06:16:47'),(3,1,4,'2026-04-19 11:47:55','dfgdfgdfgdfgdfg','[{\"unit\": \"gdfg\", \"level\": \"low\", \"range\": \"dfgdfg\", \"result\": \"dfgdfgdfgdf\", \"test_name\": \"dfgdfg\"}]','dfgdfgdfg','2026-04-20 06:17:55'),(4,1,4,'2026-04-14 10:51:00','dgdfghdfgdfg','[{\"unit\": \"dfgdfg\", \"level\": \"high\", \"range\": \"dfgdfg\", \"result\": \"dfgdfg\", \"test_name\": \"dfgdfg\"}, {\"unit\": \"dfg\", \"level\": \"low\", \"range\": \"dfgd\", \"result\": \"dfgdfg\", \"test_name\": \"fdgdfg\"}, {\"unit\": \"dfgdf\", \"level\": \"low\", \"range\": \"dgdf\", \"result\": \"dfgdfg\", \"test_name\": \"dfgdfgf\"}, {\"unit\": \"dfg\", \"level\": \"critical\", \"range\": \"dfg\", \"result\": \"dfgdfg\", \"test_name\": \"fdgdg\"}]','ffgh fgh fghfgh fghfghfg','2026-04-20 06:23:07'),(5,8,4,'2026-04-21 12:34:00','blood report','[{\"unit\": \"343\", \"level\": \"high\", \"range\": \"34\", \"result\": \"3453\", \"test_name\": \"test123\"}, {\"unit\": \"wer\", \"level\": \"low\", \"range\": \"wer54\", \"result\": \"fdg\", \"test_name\": \"test2\"}, {\"unit\": \"234\", \"level\": \"critical\", \"range\": \"345\", \"result\": \"234\", \"test_name\": \"test 3\"}]','report note','2026-04-21 07:30:32'),(6,8,4,'2026-04-21 13:12:00','gfhfghfgh','[{\"unit\": \"fgh\", \"level\": \"low\", \"range\": \"fgh\", \"result\": \"fgh\", \"test_name\": \"fgh\"}, {\"unit\": \"fgh\", \"level\": \"high\", \"range\": \"fghf\", \"result\": \"fghfgh\", \"test_name\": \"fghfgh\"}]','fghfgh','2026-04-21 08:15:59'),(7,1,4,'2026-04-21 13:46:00','ghjghjghj','[{\"unit\": \"ghjgj\", \"level\": \"high\", \"range\": \"ghj\", \"result\": \"ghjghj\", \"test_name\": \"gjghj\"}]',NULL,'2026-04-21 08:16:41'),(8,9,4,'2026-04-23 16:11:00','ghjghjghjghjgh','[{\"unit\": \"675\", \"level\": \"low\", \"range\": \"567\", \"result\": \"567\", \"test_name\": \"fghfgh\"}, {\"unit\": \"56\", \"level\": \"low\", \"range\": \"56\", \"result\": \"657\", \"test_name\": \"tyuyt\"}]','hgfhfgh','2026-04-24 10:43:02'),(9,1,4,'2026-04-28 13:17:00','fghfghfghfgh','[{\"unit\": \"645\", \"level\": \"low\", \"range\": \"5464\", \"result\": \"yrty\", \"test_name\": \"fghfgh\"}, {\"unit\": \"46\", \"level\": \"critical\", \"range\": \"45\", \"result\": \"h456\", \"test_name\": \"fhgghfg\"}]','fghfghgfh','2026-04-28 07:48:02');
/*!40000 ALTER TABLE `health_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_mobile` (`mobile`),
  KEY `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
INSERT INTO `otp_verifications` VALUES (1,'8381997570','487864',1,'2026-04-06 08:30:02','2026-04-06 08:25:02'),(2,'89078078078','451365',1,'2026-04-07 03:39:52','2026-04-07 03:34:51'),(3,'8381997570','405916',1,'2026-04-20 07:31:08','2026-04-20 07:26:08'),(4,'8381997570','648658',1,'2026-04-20 07:43:28','2026-04-20 07:38:28'),(5,'7878788780','884457',1,'2026-04-20 07:45:15','2026-04-20 07:40:15'),(6,'7474747474','125393',1,'2026-04-20 07:46:56','2026-04-20 07:41:56'),(7,'7878788345','991485',0,'2026-04-20 08:04:41','2026-04-20 07:59:41'),(8,'7878788780','824575',1,'2026-04-20 08:05:05','2026-04-20 08:00:05'),(9,'3423423423','985206',0,'2026-04-20 08:05:54','2026-04-20 08:00:54'),(10,'2343423423','136668',1,'2026-04-20 08:06:54','2026-04-20 08:01:54'),(11,'8381997570','123775',0,'2026-04-20 11:02:11','2026-04-20 10:57:11'),(12,'6575675677','113258',1,'2026-04-24 10:43:37','2026-04-24 10:38:37'),(13,'6575675677','331018',1,'2026-04-24 10:44:39','2026-04-24 10:39:39'),(14,'3453453455','686670',1,'2026-04-25 04:45:52','2026-04-25 04:40:52'),(15,'6575675677','682563',1,'2026-04-28 07:53:40','2026-04-28 07:48:40'),(16,'3453453455','465567',1,'2026-04-28 07:54:16','2026-04-28 07:49:16');
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_profiles`
--

DROP TABLE IF EXISTS `patient_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_profiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` tinyint unsigned DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_patient_profiles_user` (`user_id`),
  CONSTRAINT `fk_pp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_profiles`
--

LOCK TABLES `patient_profiles` WRITE;
/*!40000 ALTER TABLE `patient_profiles` DISABLE KEYS */;
INSERT INTO `patient_profiles` VALUES (1,6,'male',23,234.00,234.00,'2026-04-20 08:00:32'),(2,7,NULL,NULL,NULL,NULL,'2026-04-20 07:42:08'),(3,8,NULL,NULL,NULL,NULL,'2026-04-20 08:02:48'),(4,9,'male',255,567.00,567.00,'2026-04-24 10:42:15'),(6,10,NULL,NULL,NULL,NULL,'2026-04-25 04:41:12');
/*!40000 ALTER TABLE `patient_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `appointment_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `medicines` text COLLATE utf8mb4_unicode_ci,
  `prescription_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_prescription_appointment` (`appointment_id`),
  KEY `fk_rx_doctor` (`doctor_id`),
  KEY `fk_rx_patient` (`patient_id`),
  CONSTRAINT `fk_rx_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rx_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rx_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
INSERT INTO `prescriptions` VALUES (1,3,5,1,'dgfdgdfg\ndfgdfg\ndfgdfg\ndfgdfg\ndfg','dfgdfgdf\ndfgdfg\ndfgdfg\ndfgfdg','2026-04-07 00:00:00','2026-04-07 08:01:06'),(2,2,5,1,'tfyhfghfghfghfgh','fghfghfghfghfghfgh','2026-04-07 00:00:00','2026-04-09 11:24:15'),(3,9,5,8,'dfgdjfghjkdfg  dkjfgkjdfg  dflkgjlkdfjglkdfjg ndfjkglkdfjgl\ndflghkdfjgfbd dkjfghkfjdg oejogfoijfogijdf  dlfgjldfgjdflkgj\ndfkghkdfjghkfdjgh dfgoidfjgodfg dfglkdfgj dfgkldfjgfdlkjg','djfdgbfbd        569456    345\nsfgfghdjkf       4358345   345\ndfgdhfgkj        0395345   345\ndfgkjdfghk      k4359345   35','2026-04-21 13:04:21','2026-04-21 07:34:21'),(4,10,5,9,'m,.km.,nm,nm,jhkhjkhj','hjkhjkhjk hjkhjkhjkh','2026-04-28 13:15:38','2026-04-24 10:40:14');
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` datetime NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rpt_patient` (`patient_id`),
  KEY `fk_rpt_uploader` (`uploaded_by`),
  CONSTRAINT `fk_rpt_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rpt_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (2,1,4,'Screenshot 2025-10-27 132647.png','D:\\js\\MERN\\Hospital Management new\\backend\\uploads\\d824d17750a31129481d8725d5c502c7','png','2026-04-21 11:31:00','2026-04-21 06:03:00'),(3,1,4,'React with Laravel.pdf','D:\\js\\MERN\\Hospital Management new\\backend\\uploads\\080f9b0403a3a53407772e118e287a99','pdf','2026-04-21 11:47:00','2026-04-21 06:18:38'),(4,8,4,'git-cheat-sheet-education.pdf','D:\\js\\MERN\\Hospital Management new\\backend\\uploads\\eaf525fd6413992e2a5b3b8facd90f3e','pdf','2026-04-21 12:34:00','2026-04-21 07:06:20'),(5,9,4,'AMS DFD.pdf','D:\\js\\MERN\\Hospital Management new\\backend\\uploads\\7cda3efe21213d89a663619832ac1c23','pdf','2026-04-24 16:11:00','2026-04-24 10:43:35');
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin','executive','patient') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_mobile` (`mobile`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'JAIHIND YADAV','yadavjaihind795@gmail.com','8381997570','$2b$10$H1/sPzNZWF8YtwbDxSLRV./fmns1oqOK0xyaYRQB4NNA9IkX0dmEG','patient',1,1,'2026-04-06 08:25:26','2026-04-06 08:25:26'),(2,'JAIHIND YADAV','yadavjaihind1795@gmail.com','8381997579','$2b$10$H1/sPzNZWF8YtwbDxSLRV./fmns1oqOK0xyaYRQB4NNA9IkX0dmEG','super_admin',1,1,'2026-04-06 08:25:26','2026-04-06 08:25:26'),(4,'JAIHIND YADAVfgdfgg','yadavjaihind7dfgdfg95@gmail.com','5435345435','$2b$10$IDKohsySd0Q7DNaVCTwgkew3WSeT47shnVZS86mIczsnjeaFwAZX6','executive',1,1,'2026-04-06 09:43:09','2026-04-06 11:29:24'),(5,'JAIHIND YADAV','yadavjaihind795dfgdfg@gmail.com','34534534534','$2b$10$QEqz/cqpNBfFe7O6dtSLGuhPrN2vSOVW0tGfXv3vDwHhcMiaiSLw6','admin',1,1,'2026-04-07 04:07:44','2026-04-07 04:07:44'),(6,'raj','raj@test123432.com','7878788780','$2b$10$FI2ZrjicP4M92pcGZZRzMurM5AHIm7eWfHoU80n3Sj2mQ63yqmTYK','patient',1,1,'2026-04-20 07:40:34','2026-04-20 07:40:34'),(7,'fgdfgghhfgh','test123@test.com','7474747474','$2b$10$nnG0kW8TTB0v5nq71n2pKu1b94O7R/pGY5BHfFHyfFHcbsW/K81wC','patient',1,1,'2026-04-20 07:42:08','2026-04-20 07:42:08'),(8,'test 123','rest125453@test.com','2343423423','$2b$10$g/REijj8N71TUpwcHan9cOOSoa1vpIwf/kf/ZK8pKVmoOwy/ZoQYS','patient',1,1,'2026-04-20 08:02:48','2026-04-20 08:02:48'),(9,'ghjghjghjg','yadavjaihghjghjghjghjind795@gmail.com','6575675677','$2b$10$UmScBXas94U4BUrZmcbIieZBWtIA4cl745uxvty9T.6vWSDX9uRoC','patient',1,1,'2026-04-24 10:39:01','2026-04-24 10:39:01'),(10,'dgdfgdf','yadavjaihdgdfgdfgind795@gmail.com','3453453455','$2b$10$vvIS.vBcutZI1DCSslLT.uzCljlek47S8wB5/fY/JUy2Fpkrt4.66','patient',1,1,'2026-04-25 04:41:12','2026-04-25 04:41:12');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-28 13:38:56
