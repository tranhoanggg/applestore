CREATE DATABASE  IF NOT EXISTS `applestore` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `applestore`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: applestore
-- ------------------------------------------------------
-- Server version	8.0.42

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
-- Table structure for table `bill`
--

DROP TABLE IF EXISTS `bill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(45) NOT NULL,
  `product_id` int DEFAULT NULL,
  `product_type` varchar(45) DEFAULT NULL,
  `color` varchar(45) DEFAULT NULL,
  `capacity` varchar(45) DEFAULT NULL,
  `ram` varchar(45) DEFAULT NULL,
  `rom` varchar(45) DEFAULT NULL,
  `address_detail` varchar(255) DEFAULT NULL,
  `commune` varchar(255) DEFAULT NULL,
  `district` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `bank` varchar(255) DEFAULT NULL,
  `payment_status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill`
--

LOCK TABLES `bill` WRITE;
/*!40000 ALTER TABLE `bill` DISABLE KEYS */;
INSERT INTO `bill` VALUES (1,1,'Trần Hoàng','0359930095',1,'Iphone','Xanh Đậm','256 GB',NULL,NULL,'Số nhà 35','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Thanh toán tại quầy','','Đang chờ thanh toán'),(2,1,'Trần Hoàng','0359930095',26,'Iphone','Đen Không Gian','512 GB',NULL,NULL,'Số nhà 41','Thanh Ba','Việt Trì','Phú Thọ','2025-12-14','Chuyển khoản','ViettinBank','Thành công'),(3,2,'Ngô Đức Anh Tuấn','0352153263',3,'Ipad','Bạc','256 GB',NULL,NULL,'Số nhà 36','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Thanh toán tại quầy','','Đang chờ thanh toán'),(4,2,'Ngô Đức Anh Tuấn','0352153263',20,'Ipad','Xanh Dương','1 TB',NULL,NULL,'Số nhà 18','Ngọc Trục','Nam Từ Liêm','Hà Nội','2025-12-14','Chuyển khoản','Agribank','Thành công'),(5,2,'Ngô Đức Anh Tuấn','0352153263',28,'Mac','Bạc',NULL,'16 GB','1 TB','Số nhà 68','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Thanh toán tại quầy','','Đã huỷ'),(6,2,'Ngô Đức Anh Tuấn','0352153263',18,'Mac','Đêm Xanh Thẳm',NULL,'16 Gb','256 GB','Số nhà 69','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Chuyển khoản','MbBank','Thành công'),(7,1,'Trần Hoàng','0359930095',5,'Watch','Xám không gian',NULL,NULL,NULL,'Số nhà 69','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Thanh toán tại quầy','','Đang chờ thanh toán'),(8,1,'Trần Hoàng','0359930095',8,'Watch','Đen',NULL,NULL,NULL,'Số nhà 102','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Chuyển khoản','Momo','Thành công'),(9,1,'Trần Hoàng','0359930095',35,'Iphone','Xanh Lam Khói','512 GB',NULL,NULL,'Số nhà 35','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Chuyển khoản','VietcomBank','Thành công'),(10,1,'Trần Hoàng','0359930095',1,'Ipad','Đen','256 GB',NULL,NULL,'Số nhà 36','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-14','Thanh toán tại quầy','','Đang chờ thanh toán'),(11,1,'Trần Hoàng','0359930095',16,'Mac','Đêm Xanh Thẳm',NULL,'24 GB','512 GB','Số nhà 18','Đoan Hạ','Thanh Thuỷ','Phú Thọ','2025-12-14','Chuyển khoản','Agribank','Thành công'),(12,1,'Trần Hoàng','0359930095',NULL,'','','','','','','','','','2025-12-16','Thanh toán tại quầy','','Đang chờ thanh toán'),(13,1,'Trần Hoàng','0359930095',NULL,'','','','','','Số nhà 36','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-16','Chuyển khoản','ViettinBank','Thành công'),(14,1,'Trần Hoàng','0359930095',33,'Iphone','Vàng Nhạt','1 TB',NULL,NULL,'','','','','2025-12-16','Thanh toán tại quầy','','Đang chờ thanh toán'),(15,2,'Ngô Đức Anh Tuấn','0352153263',1,'Iphone','Xanh Đậm','256 GB',NULL,NULL,'','','','','2025-12-16','Thanh toán tại quầy','','Đã huỷ'),(16,2,'Ngô Đức Anh Tuấn','0352153263',26,'Mac','Bạc',NULL,'24 GB','1 TB','Số nhà 69','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-16','Chuyển khoản','VietcomBank','Thành công'),(17,2,'Ngô Đức Anh Tuấn','0352153263',NULL,'','','','','','','','','','2025-12-16','Thanh toán tại quầy','','Đã huỷ'),(18,2,'Ngô Đức Anh Tuấn','0352153263',NULL,'','','','','','Số nhà 36','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-16','Chuyển khoản','ViettinBank','Thành công'),(19,2,'Ngô Đức Anh Tuấn','0352153263',NULL,'','','','','','Số nhà 18','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-16','Chuyển khoản','Momo','Thành công'),(20,2,'Ngô Đức Anh Tuấn','0352153263',NULL,'','','','','','Số nhà 36','Trung Văn','Nam Từ Liêm','Hà Nội','2025-12-16','Chuyển khoản','Momo','Thành công');
/*!40000 ALTER TABLE `bill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill_detail`
--

DROP TABLE IF EXISTS `bill_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `type` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_detail`
--

LOCK TABLES `bill_detail` WRITE;
/*!40000 ALTER TABLE `bill_detail` DISABLE KEYS */;
INSERT INTO `bill_detail` VALUES (1,12,1,1,'Iphone'),(2,12,22,1,'Iphone'),(3,12,5,1,'Ipad'),(4,12,1,1,'Mac'),(5,12,1,1,'Watch'),(6,13,21,1,'Iphone'),(7,13,8,1,'Ipad'),(8,13,13,1,'Mac'),(9,13,5,1,'Watch'),(10,17,1,1,'Iphone'),(11,17,25,1,'Mac'),(12,17,1,1,'Watch'),(13,18,5,1,'Ipad'),(14,18,8,1,'Watch'),(15,19,16,1,'Iphone'),(16,20,5,1,'Ipad');
/*!40000 ALTER TABLE `bill_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `type` varchar(45) NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (26,2,1,'Ipad',1),(27,2,16,'Iphone',2),(28,2,5,'Ipad',1),(29,2,25,'Mac',1),(30,2,1,'Mac',2),(31,2,1,'Watch',1),(32,2,10,'Watch',1),(33,2,8,'Watch',1);
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_account`
--

DROP TABLE IF EXISTS `client_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `birthday` date NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` text NOT NULL,
  `password` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_account`
--

LOCK TABLES `client_account` WRITE;
/*!40000 ALTER TABLE `client_account` DISABLE KEYS */;
INSERT INTO `client_account` VALUES (1,'Trần Hoàng','2004-06-29','tranhoang292004@gmail.com','0359930095','123'),(2,'Ngô Đức Anh Tuấn','2004-10-12','tuanngo@gmail.com','0352153263','123');
/*!40000 ALTER TABLE `client_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ipad`
--

DROP TABLE IF EXISTS `ipad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ipad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `capacity` varchar(45) NOT NULL,
  `color` varchar(45) NOT NULL,
  `code` varchar(45) NOT NULL,
  `price` int NOT NULL,
  `tag` varchar(45) DEFAULT NULL,
  `quantity` int NOT NULL,
  `image` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ipad`
--

LOCK TABLES `ipad` WRITE;
/*!40000 ALTER TABLE `ipad` DISABLE KEYS */;
INSERT INTO `ipad` VALUES (1,'iPad Pro 11 inch','256 GB','Đen','#000000',29990000,'new',99,'black'),(2,'iPad Pro 11 inch','512 GB','Đen','#000000',35590000,'new',100,'black'),(3,'iPad Pro 11 inch','256 GB','Bạc','#ffffff',29990000,'new',100,'silver'),(4,'iPad Pro 11 inch','512 GB','Bạc','#ffffff',35590000,'new',100,'silver'),(5,'iPad Pro 13 inch','256 GB','Đen','#000000',39990000,'new',97,'black'),(6,'iPad Pro 13 inch','512 GB','Đen','#000000',45590000,'new',100,'black'),(7,'iPad Pro 13 inch','256 GB','Bạc','#ffffff',39990000,'new',100,'silver'),(8,'iPad Pro 13 inch','512 GB','Bạc','#ffffff',45590000,'new',99,'silver'),(9,'iPad Air 11 inch','128 GB','Xám Không Gian','#4E4E52',16190000,'',100,'spacegray'),(10,'iPad Air 11 inch','256 GB','Xám Không Gian','#4E4E52',18990000,'',100,'spacegray'),(11,'iPad Air 11 inch','512 GB','Xám Không Gian','#4E4E52',24790000,'',100,'spacegray'),(12,'iPad Air 11 inch','1 TB','Xám Không Gian','#4E4E52',29990000,'',100,'spacegray'),(13,'iPad Air 11 inch','128 GB','Tím','#A36FD6',16190000,'',100,'purple'),(14,'iPad Air 11 inch','256 GB','Tím','#A36FD6',18990000,'',100,'purple'),(15,'iPad Air 11 inch','512 GB','Tím','#A36FD6',24790000,'',100,'purple'),(16,'iPad Air 11 inch','1 TB','Tím','#A36FD6',29990000,'',100,'purple'),(17,'iPad Air 11 inch','128 GB','Xanh Dương','#5F92E5',16190000,'',100,'blue'),(18,'iPad Air 11 inch','256 GB','Xanh Dương','#5F92E5',18990000,'',100,'blue'),(19,'iPad Air 11 inch','512 GB','Xanh Dương','#5F92E5',24790000,'',100,'blue'),(20,'iPad Air 11 inch','1 TB','Xanh Dương','#5F92E5',29990000,'',100,'blue'),(21,'iPad Air 11 inch','128 GB','Ánh Sao','#F5F5F5',16190000,'',100,'starlight'),(22,'iPad Air 11 inch','256 GB','Ánh Sao','#F5F5F5',18990000,'',100,'starlight'),(23,'iPad Air 11 inch','512 GB','Ánh Sao','#F5F5F5',24790000,'',100,'starlight'),(24,'iPad Air 11 inch','1 TB','Ánh Sao','#F5F5F5',29990000,'',100,'starlight'),(25,'iPad Air 13 inch','128 GB','Xám Không Gian','#4E4E52',21490000,'',100,'spacegray'),(26,'iPad Air 13 inch','256 GB','Xám Không Gian','#4E4E52',23990000,'',100,'spacegray'),(27,'iPad Air 13 inch','512 GB','Xám Không Gian','#4E4E52',29990000,'',100,'spacegray'),(28,'iPad Air 13 inch','1 TB','Xám Không Gian','#4E4E52',35990000,'',100,'spacegray'),(29,'iPad Air 13 inch','128 GB','Tím','#A36FD6',21490000,'',100,'purple'),(30,'iPad Air 13 inch','256 GB','Tím','#A36FD6',23990000,'',100,'purple'),(31,'iPad Air 13 inch','512 GB','Tím','#A36FD6',29990000,'',100,'purple'),(32,'iPad Air 13 inch','1 TB','Tím','#A36FD6',35990000,'',100,'purple'),(33,'iPad Air 13 inch','128 GB','Xanh Dương','#5F92E5',21490000,'',100,'blue'),(34,'iPad Air 13 inch','256 GB','Xanh Dương','#5F92E5',23990000,'',100,'blue'),(35,'iPad Air 13 inch','512 GB','Xanh Dương','#5F92E5',29990000,'',100,'blue'),(36,'iPad Air 13 inch','1 TB','Xanh Dương','#5F92E5',35990000,'',100,'blue'),(37,'iPad Air 13 inch','128 GB','Ánh Sao','#F5F5F5',21490000,'',100,'starlight'),(38,'iPad Air 13 inch','256 GB','Ánh Sao','#F5F5F5',23990000,'',100,'starlight'),(39,'iPad Air 13 inch','512 GB','Ánh Sao','#F5F5F5',29990000,'',100,'starlight'),(40,'iPad Air 13 inch','1 TB','Ánh Sao','#F5F5F5',35990000,'',100,'starlight'),(41,'iPad A16','128 GB','Bạc','#E3E4E6',9490000,'',100,'silver'),(42,'iPad A16','256 GB','Bạc','#E3E4E6',23990000,'',100,'silver'),(43,'iPad A16','512 GB','Bạc','#E3E4E6',29990000,'',100,'silver'),(44,'iPad A16','128 GB','Xanh Dương','#6AA8F0',9490000,'',100,'blue'),(45,'iPad A16','256 GB','Xanh Dương','#6AA8F0',12290000,'',100,'blue'),(46,'iPad A16','512 GB','Xanh Dương','#6AA8F0',17990000,'',100,'blue'),(47,'iPad A16','128 GB','Hồng','#F4B7C5',9490000,'',100,'pink'),(48,'iPad A16','256 GB','Hồng','#F4B7C5',12290000,'',100,'pink'),(49,'iPad A16','512 GB','Hồng','#F4B7C5',17990000,'',100,'pink'),(50,'iPad A16','128 GB','Vàng','#F8D97C',9490000,'',100,'yellow'),(51,'iPad A16','256 GB','Vàng','#F8D97C',12290000,'',100,'yellow'),(52,'iPad A16','512 GB','Vàng','#F8D97C',17990000,'',100,'yellow'),(53,'iPad Mini','128 GB','Xám Không Gian','#4A4A4D',13590000,'',100,'spacegray'),(54,'iPad Mini','256 GB','Xám Không Gian','#4A4A4D',16290000,'',100,'spacegray'),(55,'iPad Mini','512 GB','Xám Không Gian','#4A4A4D',20990000,'',100,'spacegray'),(56,'iPad Mini','128 GB','Ánh Sao','#F4F4F5',13590000,'',100,'starlight'),(57,'iPad Mini','256 GB','Ánh Sao','#F4F4F5',16290000,'',100,'starlight'),(58,'iPad Mini','512 GB','Ánh Sao','#F4F4F5',20990000,'',100,'starlight'),(59,'iPad Mini','128 GB','Xanh Dương','#5F9CEC',13590000,'',100,'blue'),(60,'iPad Mini','256 GB','Xanh Dương','#5F9CEC',16290000,'',100,'blue'),(61,'iPad Mini','512 GB','Xanh Dương','#5F9CEC',20990000,'',100,'blue'),(62,'iPad Mini','128 GB','Tím','#A37DDC',13590000,'',100,'purple'),(63,'iPad Mini','256 GB','Tím','#A37DDC',16290000,'',100,'purple'),(64,'iPad Mini','512 GB','Tím','#A37DDC',20990000,'',100,'purple');
/*!40000 ALTER TABLE `ipad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iphone`
--

DROP TABLE IF EXISTS `iphone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iphone` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `capacity` varchar(45) NOT NULL,
  `color` varchar(255) NOT NULL,
  `code` varchar(45) NOT NULL,
  `price` int NOT NULL,
  `tag` varchar(45) DEFAULT NULL,
  `quantity` int NOT NULL,
  `image` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iphone`
--

LOCK TABLES `iphone` WRITE;
/*!40000 ALTER TABLE `iphone` DISABLE KEYS */;
INSERT INTO `iphone` VALUES (1,'iPhone 17 Pro Max','256 GB','Xanh Đậm','#191970',37999000,'new',98,'blue'),(2,'iPhone 17 Pro Max','512 GB','Xanh Đậm','#191970',44499000,'new',100,'blue'),(3,'iPhone 17 Pro Max','1 TB','Xanh Đậm','#191970',50990000,'new',100,'blue'),(4,'iPhone 17 Pro Max','2 TB','Xanh Đậm','#191970',63990000,'new',100,'blue'),(5,'iPhone 17 Pro Max','256 GB','Cam Vũ Trụ','#FF6600',37999000,'new',100,'orange'),(6,'iPhone 17 Pro Max','512 GB','Cam Vũ Trụ','#FF6600',44499000,'new',100,'orange'),(7,'iPhone 17 Pro Max','1 TB','Cam Vũ Trụ','#FF6600',50990000,'new',100,'orange'),(8,'iPhone 17 Pro Max','2 TB','Cam Vũ Trụ','#FF6600',63990000,'new',100,'orange'),(9,'iPhone 17 Pro Max','256 GB','Bạc','#C0C0C0',37999000,'new',100,'silver'),(10,'iPhone 17 Pro Max','512 GB','Bạc','#C0C0C0',44499000,'new',100,'silver'),(11,'iPhone 17 Pro Max','1 TB','Bạc','#C0C0C0',50990000,'new',100,'silver'),(12,'iPhone 17 Pro Max','2 TB','Bạc','#C0C0C0',63990000,'new',100,'silver'),(13,'iPhone 17 Pro ','256 GB','Xanh Đậm','#191970',34999000,'new',100,'blue'),(14,'iPhone 17 Pro ','512 GB','Xanh Đậm','#191970',41490000,'new',100,'blue'),(15,'iPhone 17 Pro ','1 TB','Xanh Đậm','#191970',47990000,'new',100,'blue'),(16,'iPhone 17 Pro','256 GB','Cam Vũ Trụ','#FF6600',34999000,'new',99,'orange'),(17,'iPhone 17 Pro','512 GB','Cam Vũ Trụ','#FF6600',41490000,'new',100,'orange'),(18,'iPhone 17 Pro','1 TB','Cam Vũ Trụ','#FF6600',47990000,'new',100,'orange'),(19,'iPhone 17 Pro','256 GB','Bạc','#C0C0C0',34999000,'new',100,'silver'),(20,'iPhone 17 Pro','512 GB','Bạc','#C0C0C0',41490000,'new',100,'silver'),(21,'iPhone 17 Pro','1 TB','Bạc','#C0C0C0',47990000,'new',99,'silver'),(22,'iPhone 17 Air','256 GB','Xanh Da Trời','#87CEEB',30890000,'new',99,'skyblue'),(23,'iPhone 17 Air','512 GB','Xanh Da Trời','#87CEEB',35990000,'new',100,'skyblue'),(24,'iPhone 17 Air','1 TB','Xanh Da Trời','#87CEEB',41490000,'new',100,'skyblue'),(25,'iPhone 17 Air','256 GB','Đen Không Gian','#1B1B1B',30890000,'new',100,'spaceblack'),(26,'iPhone 17 Air','512 GB','Đen Không Gian','#1B1B1B',35990000,'new',100,'spaceblack'),(27,'iPhone 17 Air','1 TB','Đen Không Gian','#1B1B1B',41490000,'new',100,'spaceblack'),(28,'iPhone 17 Air','256 GB','Trắng Mây','#F5F5F5',30890000,'new',100,'cloudwhite'),(29,'iPhone 17 Air','512 GB','Trắng Mây','#F5F5F5',35990000,'new',100,'cloudwhite'),(30,'iPhone 17 Air','1 TB','Trắng Mây','#F5F5F5',41490000,'new',100,'cloudwhite'),(31,'iPhone 17 Air','256 GB','Vàng Nhạt','#FAFAD2',30890000,'new',100,'lightgold'),(32,'iPhone 17 Air','512 GB','Vàng Nhạt','#FAFAD2',35990000,'new',100,'lightgold'),(33,'iPhone 17 Air','1 TB','Vàng Nhạt','#FAFAD2',41490000,'new',99,'lightgold'),(34,'iPhone 17','256 GB','Xanh Lam Khói','#9FB8D3',24990000,'new',100,'mistblue'),(35,'iPhone 17','512 GB','Xanh Lam Khói','#9FB8D3',31490000,'new',99,'mistblue'),(36,'iPhone 17','256 GB','Đen','#000000',24990000,'new',100,'black'),(37,'iPhone 17','512 GB','Đen','#000000',31490000,'new',100,'black'),(38,'iPhone 17','256 GB','Trắng','#FFFFFF',24990000,'new',100,'white'),(39,'iPhone 17','512 GB','Trắng','#FFFFFF',31490000,'new',100,'white'),(40,'iPhone 17','256 GB','Xanh Lá Xô Thơm','#B2AC88',24990000,'new',100,'sage'),(41,'iPhone 17','512 GB','Xanh Lá Xô Thơm','#B2AC88',31490000,'new',100,'sage'),(42,'iPhone 17','256 GB','Tím Oải Hương','#E6E6FA',24990000,'new',100,'lavender'),(43,'iPhone 17','512 GB','Tím Oải Hương','#E6E6FA',31490000,'new',100,'lavender');
/*!40000 ALTER TABLE `iphone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iphone_outstanding_detail`
--

DROP TABLE IF EXISTS `iphone_outstanding_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iphone_outstanding_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `content` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iphone_outstanding_detail`
--

LOCK TABLES `iphone_outstanding_detail` WRITE;
/*!40000 ALTER TABLE `iphone_outstanding_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `iphone_outstanding_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mac`
--

DROP TABLE IF EXISTS `mac`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mac` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `ram` varchar(45) NOT NULL,
  `rom` varchar(45) NOT NULL,
  `color` varchar(45) NOT NULL,
  `code` varchar(45) NOT NULL,
  `price` int NOT NULL,
  `tag` varchar(45) DEFAULT NULL,
  `quantity` int NOT NULL,
  `image` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mac`
--

LOCK TABLES `mac` WRITE;
/*!40000 ALTER TABLE `mac` DISABLE KEYS */;
INSERT INTO `mac` VALUES (1,'Macbook Air 13\'\'','24 GB','512 GB','Xanh Da Trời','#B8D8EB',34690000,NULL,99,'blue'),(2,'Macbook Air 13\'\'','16 Gb','512 GB','Xanh Da Trời','#B8D8EB',30490000,NULL,100,'blue'),(3,'Macbook Air 13\'\'','16 Gb','256 GB','Xanh Da Trời','#B8D8EB',24990000,NULL,100,'blue'),(4,'Macbook Air 13\'\'','24 GB','512 GB','Đêm Xanh Thẳm','#2E2F33',34690000,NULL,100,'midnight'),(5,'Macbook Air 13\'\'','16 Gb','512 GB','Đêm Xanh Thẳm','#2E2F33',30490000,NULL,100,'midnight'),(6,'Macbook Air 13\'\'','16 Gb','256 GB','Đêm Xanh Thẳm','#2E2F33',24990000,NULL,100,'midnight'),(7,'Macbook Air 13\'\'','24 GB','512 GB','Bạc','#E4E6E9',34690000,NULL,100,'silver'),(8,'Macbook Air 13\'\'','16 Gb','512 GB','Bạc','#E4E6E9',30490000,NULL,100,'silver'),(9,'Macbook Air 13\'\'','16 Gb','256 GB','Bạc','#E4E6E9',24990000,NULL,100,'silver'),(10,'Macbook Air 13\'\'','24 GB','512 GB','Ánh Sao','#ECE9E5',34690000,NULL,100,'starlight'),(11,'Macbook Air 13\'\'','16 Gb','512 GB','Ánh Sao','#ECE9E5',30490000,NULL,100,'starlight'),(12,'Macbook Air 13\'\'','16 Gb','256 GB','Ánh Sao','#ECE9E5',24990000,NULL,100,'starlight'),(13,'Macbook Air 15\'\'','24 GB','512 GB','Xanh Da Trời','#B8D8EB',39490000,NULL,99,'blue'),(14,'Macbook Air 15\'\'','16 Gb','512 GB','Xanh Da Trời','#B8D8EB',30490000,NULL,100,'blue'),(15,'Macbook Air 15\'\'','16 Gb','256 GB','Xanh Da Trời','#B8D8EB',24990000,NULL,100,'blue'),(16,'Macbook Air 15\'\'','24 GB','512 GB','Đêm Xanh Thẳm','#2E2F33',39490000,NULL,99,'midnight'),(17,'Macbook Air 15\'\'','16 Gb','512 GB','Đêm Xanh Thẳm','#2E2F33',33990000,NULL,100,'midnight'),(18,'Macbook Air 15\'\'','16 Gb','256 GB','Đêm Xanh Thẳm','#2E2F33',29990000,NULL,100,'midnight'),(19,'Macbook Air 15\'\'','24 GB','512 GB','Bạc','#E4E6E9',39490000,NULL,100,'silver'),(20,'Macbook Air 15\'\'','16 Gb','512 GB','Bạc','#E4E6E9',33990000,NULL,100,'silver'),(21,'Macbook Air 15\'\'','16 Gb','256 GB','Bạc','#E4E6E9',29990000,NULL,100,'silver'),(22,'Macbook Air 15\'\'','24 GB','512 GB','Ánh Sao','#ECE9E5',39490000,NULL,100,'starlight'),(23,'Macbook Air 15\'\'','16 Gb','512 GB','Ánh Sao','#ECE9E5',33990000,NULL,100,'starlight'),(24,'Macbook Air 15\'\'','16 Gb','256 GB','Ánh Sao','#ECE9E5',29990000,NULL,100,'starlight'),(25,'Macbook Pro','24 GB','1 TB','Đen','#ffffff',51790000,NULL,100,'black'),(26,'Macbook Pro','24 GB','1 TB','Bạc','#E4E6E9',51790000,NULL,99,'silver'),(27,'Macbook Pro','16 GB','1 TB','Đen','#ffffff',46890000,NULL,100,'black'),(28,'Macbook Pro','16 GB','1 TB','Bạc','#E4E6E9',46890000,NULL,101,'silver'),(29,'Macbook Pro','16 GB','512 GB','Đen','#ffffff',41990000,NULL,100,'black'),(30,'Macbook Pro','16 GB','512 GB','Bạc','#E4E6E9',41990000,NULL,100,'silver');
/*!40000 ALTER TABLE `mac` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `watch`
--

DROP TABLE IF EXISTS `watch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `watch` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `color` varchar(45) NOT NULL,
  `code` varchar(45) NOT NULL,
  `price` int NOT NULL,
  `tag` varchar(45) DEFAULT NULL,
  `quantity` varchar(45) NOT NULL,
  `image` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `watch`
--

LOCK TABLES `watch` WRITE;
/*!40000 ALTER TABLE `watch` DISABLE KEYS */;
INSERT INTO `watch` VALUES (1,'Apple Watch Series 11','Vàng','#C9B385',23590000,NULL,'99','gold'),(2,'Apple Watch Series 11','Xám Đá Phiến','#414244',23590000,NULL,'100','slate'),(3,'Apple Watch Series 11','Tự Nhiên','#EAE9E7',23590000,NULL,'100','natural'),(4,'Apple Watch Series 11','Đen bóng','#111111',23590000,NULL,'100','jetblack'),(5,'Apple Watch Series 11','Xám không gian','#2E2F33',23590000,NULL,'99','spacegray'),(6,'Apple Watch Series 11','Bạc','#E4E6E9',23590000,NULL,'100','silver'),(7,'Apple Watch Series 11','Vàng hồng','#D9C3B8',23590000,NULL,'100','rosegold'),(8,'Apple Watch SE 3','Đen','#000000',7190000,NULL,'99','black'),(9,'Apple Watch SE 3','Ánh Sao','#F5F5F5',7190000,NULL,'100','starlight'),(10,'Apple Watch Ultra 3','Đen','#000000',23590000,NULL,'100','black'),(11,'Apple Watch Ultra 3','Tự Nhiên','#EAE9E7',23590000,NULL,'100','natural');
/*!40000 ALTER TABLE `watch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'applestore'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-17 11:14:45
