# ************************************************************
# Sequel Pro SQL dump
# Version 4096
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: senguo.cc (MySQL 5.5.43-0ubuntu0.14.04.1)
# Database: senguocc
# Generation Time: 2015-05-14 13:18:29 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table __alembictest__
# ------------------------------------------------------------

DROP TABLE IF EXISTS `__alembictest__`;

CREATE TABLE `__alembictest__` (
  `id` int(11) NOT NULL DEFAULT '0',
  `text` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table __fruit_favour__
# ------------------------------------------------------------

DROP TABLE IF EXISTS `__fruit_favour__`;

CREATE TABLE `__fruit_favour__` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `f_m_id` int(11) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `create_date` date DEFAULT NULL,
  PRIMARY KEY (`customer_id`,`f_m_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table __shop_sign_in__
# ------------------------------------------------------------

DROP TABLE IF EXISTS `__shop_sign_in__`;

CREATE TABLE `__shop_sign_in__` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `keep_days` int(11) DEFAULT NULL,
  `last_date` date DEFAULT NULL,
  PRIMARY KEY (`customer_id`,`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table __verify_code__
# ------------------------------------------------------------

DROP TABLE IF EXISTS `__verify_code__`;

CREATE TABLE `__verify_code__` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wx_id` varchar(100) DEFAULT NULL,
  `code` int(11) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `count` int(11) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wx_id` (`wx_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table access_token
# ------------------------------------------------------------

DROP TABLE IF EXISTS `access_token`;

CREATE TABLE `access_token` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `create_timestamp` float DEFAULT NULL,
  `access_token` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table account_info
# ------------------------------------------------------------

DROP TABLE IF EXISTS `account_info`;

CREATE TABLE `account_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `create_date_timestamp` int(11) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `email` varchar(64) DEFAULT NULL,
  `password` varchar(128) DEFAULT NULL,
  `wx_unionid` varchar(64) DEFAULT NULL,
  `sex` int(11) DEFAULT NULL,
  `nickname` varchar(64) CHARACTER SET utf8mb4 DEFAULT NULL,
  `realname` varchar(128) CHARACTER SET utf8mb4 DEFAULT NULL,
  `headimgurl` varchar(1024) DEFAULT NULL,
  `birthday` int(11) DEFAULT NULL,
  `wx_openid` varchar(64) DEFAULT NULL,
  `wx_username` varchar(64) CHARACTER SET utf8mb4 DEFAULT NULL,
  `wx_country` varchar(32) DEFAULT NULL,
  `wx_province` varchar(32) DEFAULT NULL,
  `wx_city` varchar(32) DEFAULT NULL,
  `headimgurl_small` varchar(1024) DEFAULT NULL,
  `is_new` int(11) DEFAULT '0',
  `subscribe` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `wx_unionid` (`wx_unionid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table address
# ------------------------------------------------------------

DROP TABLE IF EXISTS `address`;

CREATE TABLE `address` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `receiver` varchar(64) NOT NULL,
  `address_text` varchar(1024) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `address_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table address1
# ------------------------------------------------------------

DROP TABLE IF EXISTS `address1`;

CREATE TABLE `address1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `config_id` (`config_id`),
  CONSTRAINT `address1_ibfk_1` FOREIGN KEY (`config_id`) REFERENCES `config` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table address2
# ------------------------------------------------------------

DROP TABLE IF EXISTS `address2`;

CREATE TABLE `address2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `address1_id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `address1_id` (`address1_id`),
  CONSTRAINT `address2_ibfk_1` FOREIGN KEY (`address1_id`) REFERENCES `address1` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table alembic_version
# ------------------------------------------------------------

DROP TABLE IF EXISTS `alembic_version`;

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table apply_cash
# ------------------------------------------------------------

DROP TABLE IF EXISTS `apply_cash`;

CREATE TABLE `apply_cash` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `shop_code` varchar(64) DEFAULT NULL,
  `shop_auth` int(11) DEFAULT NULL,
  `applicant_name` varchar(32) DEFAULT NULL,
  `shop_balance` float DEFAULT NULL,
  `alipay_account` varchar(64) DEFAULT NULL,
  `value` float DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `has_done` int(11) DEFAULT NULL,
  `account_name` varchar(32) DEFAULT NULL,
  `decline_reason` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `apply_cash_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table available_balance_history
# ------------------------------------------------------------

DROP TABLE IF EXISTS `available_balance_history`;

CREATE TABLE `available_balance_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `balance_record` varchar(64) DEFAULT NULL,
  `balance_value` float DEFAULT NULL,
  `available_balance` float DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `available_balance_history_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table balancehistory
# ------------------------------------------------------------

DROP TABLE IF EXISTS `balancehistory`;

CREATE TABLE `balancehistory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `name` varchar(32) CHARACTER SET utf8mb4 DEFAULT NULL,
  `shop_id` int(11) NOT NULL,
  `balance_record` varchar(32) CHARACTER SET utf8mb4 DEFAULT NULL,
  `balance_type` int(11) DEFAULT NULL,
  `balance_value` float DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `shop_totalPrice` float DEFAULT '0',
  `customer_totalPrice` float DEFAULT '0',
  `is_cancel` int(11) DEFAULT '0',
  `transaction_id` varchar(64) DEFAULT NULL,
  `superAdmin_id` int(11) DEFAULT '0',
  `available_balance` float DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `balancehistory_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer_shop_follow` (`customer_id`),
  CONSTRAINT `balancehistory_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `customer_shop_follow` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cart
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cart`;

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `fruits` varchar(1000) CHARACTER SET utf8mb4 DEFAULT NULL,
  `mgoods` varchar(1000) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (`id`,`shop_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`id`) REFERENCES `customer` (`id`),
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table charge_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `charge_type`;

CREATE TABLE `charge_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fruit_id` int(11) NOT NULL,
  `price` float DEFAULT NULL,
  `unit` tinyint(4) DEFAULT NULL,
  `num` float DEFAULT NULL,
  `unit_num` float DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fruit_id` (`fruit_id`),
  CONSTRAINT `charge_type_ibfk_1` FOREIGN KEY (`fruit_id`) REFERENCES `fruit` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table comment
# ------------------------------------------------------------

DROP TABLE IF EXISTS `comment`;

CREATE TABLE `comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `info_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `text` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `info_id` (`info_id`),
  CONSTRAINT `comment_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`),
  CONSTRAINT `comment_ibfk_2` FOREIGN KEY (`info_id`) REFERENCES `info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table commentapply
# ------------------------------------------------------------

DROP TABLE IF EXISTS `commentapply`;

CREATE TABLE `commentapply` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `delete_reason` varchar(200) CHARACTER SET utf8mb4 DEFAULT NULL,
  `order_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `create_date` date DEFAULT NULL,
  `has_done` int(11) DEFAULT NULL,
  `decline_reason` varchar(200) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `commentapply_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  CONSTRAINT `commentapply_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `config`;

CREATE TABLE `config` (
  `id` int(11) NOT NULL,
  `receipt_msg` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `receipt_img` varchar(1000) DEFAULT NULL,
  `min_charge_on_time` smallint(6) DEFAULT NULL,
  `freight_on_time` smallint(6) DEFAULT NULL,
  `min_charge_now` smallint(6) DEFAULT NULL,
  `freight_now` smallint(6) DEFAULT NULL,
  `stop_range` smallint(6) DEFAULT NULL,
  `start_time_now` time DEFAULT NULL,
  `end_time_now` time DEFAULT NULL,
  `ontime_on` tinyint(1) DEFAULT NULL,
  `now_on` tinyint(1) DEFAULT NULL,
  `hire_on` tinyint(1) DEFAULT NULL,
  `hire_text` varchar(1000) CHARACTER SET utf8mb4 DEFAULT NULL,
  `intime_period` int(11) DEFAULT '30',
  `receipt_img_active` int(11) DEFAULT '1',
  `cash_on_active` int(11) DEFAULT '1',
  `online_on_active` int(11) DEFAULT '1',
  `balance_on_active` int(11) DEFAULT '1',
  `text_message_active` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  CONSTRAINT `config_ibfk_1` FOREIGN KEY (`id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table counter
# ------------------------------------------------------------

DROP TABLE IF EXISTS `counter`;

CREATE TABLE `counter` (
  `type` int(11) NOT NULL AUTO_INCREMENT,
  `count` int(11) NOT NULL,
  `init_date` date NOT NULL,
  PRIMARY KEY (`type`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table customer
# ------------------------------------------------------------

DROP TABLE IF EXISTS `customer`;

CREATE TABLE `customer` (
  `id` int(11) NOT NULL,
  `balance` float DEFAULT NULL,
  `credits` float DEFAULT NULL,
  `shop_new` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `customer_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account_info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table customer_shop_follow
# ------------------------------------------------------------

DROP TABLE IF EXISTS `customer_shop_follow`;

CREATE TABLE `customer_shop_follow` (
  `customer_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `create_time` datetime DEFAULT NULL,
  `shop_point` float DEFAULT '0',
  `bing_add_point` int(11) DEFAULT '0',
  `shop_new` int(11) DEFAULT NULL,
  `shop_balance` float DEFAULT '0',
  `commodity_quality` int(11) DEFAULT '0',
  `send_speed` int(11) DEFAULT '0',
  `shop_service` int(11) DEFAULT '0',
  PRIMARY KEY (`customer_id`,`shop_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `customer_shop_follow_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  CONSTRAINT `customer_shop_follow_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table feedback
# ------------------------------------------------------------

DROP TABLE IF EXISTS `feedback`;

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `create_date_timestamp` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `text` varchar(500) CHARACTER SET utf8mb4 DEFAULT NULL,
  `processed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table fruit
# ------------------------------------------------------------

DROP TABLE IF EXISTS `fruit`;

CREATE TABLE `fruit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `fruit_type_id` int(11) NOT NULL,
  `name` varchar(20) CHARACTER SET utf8mb4 DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `current_saled` int(11) DEFAULT NULL,
  `saled` int(11) DEFAULT NULL,
  `storage` float DEFAULT NULL,
  `unit` tinyint(4) DEFAULT NULL,
  `tag` tinyint(4) DEFAULT NULL,
  `img_url` varchar(500) DEFAULT NULL,
  `intro` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `priority` smallint(6) DEFAULT NULL,
  `favour` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  KEY `fruit_type_id` (`fruit_type_id`),
  CONSTRAINT `fruit_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  CONSTRAINT `fruit_ibfk_2` FOREIGN KEY (`fruit_type_id`) REFERENCES `fruit_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table fruit_img
# ------------------------------------------------------------

DROP TABLE IF EXISTS `fruit_img`;

CREATE TABLE `fruit_img` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `info_id` int(11) NOT NULL,
  `img_url` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `info_id` (`info_id`),
  CONSTRAINT `fruit_img_ibfk_1` FOREIGN KEY (`info_id`) REFERENCES `info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table fruit_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `fruit_type`;

CREATE TABLE `fruit_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(128) DEFAULT NULL,
  `name` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table hire_form
# ------------------------------------------------------------

DROP TABLE IF EXISTS `hire_form`;

CREATE TABLE `hire_form` (
  `staff_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `work` tinyint(4) DEFAULT NULL,
  `intro` varchar(500) CHARACTER SET utf8mb4 DEFAULT NULL,
  `advantage` varchar(500) CHARACTER SET utf8mb4 DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`staff_id`,`shop_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `hire_form_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `shop_staff` (`id`),
  CONSTRAINT `hire_form_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table hire_link
# ------------------------------------------------------------

DROP TABLE IF EXISTS `hire_link`;

CREATE TABLE `hire_link` (
  `staff_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `work` tinyint(4) DEFAULT NULL,
  `money` float DEFAULT NULL,
  `address1` varchar(100) DEFAULT NULL,
  `address2` varchar(200) DEFAULT NULL,
  `remark` varchar(500) CHARACTER SET utf8mb4 DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `default_staff` int(11) DEFAULT '0',
  PRIMARY KEY (`staff_id`,`shop_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `hire_link_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `shop_staff` (`id`),
  CONSTRAINT `hire_link_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table info
# ------------------------------------------------------------

DROP TABLE IF EXISTS `info`;

CREATE TABLE `info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `text` varchar(568) CHARACTER SET utf8mb4 DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `info_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table info_collect
# ------------------------------------------------------------

DROP TABLE IF EXISTS `info_collect`;

CREATE TABLE `info_collect` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `info_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `info_id` (`info_id`),
  CONSTRAINT `info_collect_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`),
  CONSTRAINT `info_collect_ibfk_2` FOREIGN KEY (`info_id`) REFERENCES `info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table info_fruit_link
# ------------------------------------------------------------

DROP TABLE IF EXISTS `info_fruit_link`;

CREATE TABLE `info_fruit_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `info_id` int(11) NOT NULL,
  `fruit_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fruit_id` (`fruit_id`),
  KEY `info_id` (`info_id`),
  CONSTRAINT `info_fruit_link_ibfk_1` FOREIGN KEY (`fruit_id`) REFERENCES `fruit_type` (`id`),
  CONSTRAINT `info_fruit_link_ibfk_2` FOREIGN KEY (`info_id`) REFERENCES `info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table m_charge_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `m_charge_type`;

CREATE TABLE `m_charge_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mgoods_id` int(11) NOT NULL,
  `price` float DEFAULT NULL,
  `unit` tinyint(4) DEFAULT NULL,
  `num` float DEFAULT NULL,
  `unit_num` float DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mgoods_id` (`mgoods_id`),
  CONSTRAINT `m_charge_type_ibfk_1` FOREIGN KEY (`mgoods_id`) REFERENCES `m_goods` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table m_goods
# ------------------------------------------------------------

DROP TABLE IF EXISTS `m_goods`;

CREATE TABLE `m_goods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` int(11) NOT NULL,
  `name` varchar(20) CHARACTER SET utf8mb4 DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `current_saled` int(11) DEFAULT NULL,
  `saled` int(11) DEFAULT NULL,
  `storage` float DEFAULT NULL,
  `unit` tinyint(4) DEFAULT NULL,
  `tag` tinyint(4) DEFAULT NULL,
  `img_url` varchar(500) DEFAULT NULL,
  `intro` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `priority` smallint(6) DEFAULT NULL,
  `favour` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `m_goods_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table menu
# ------------------------------------------------------------

DROP TABLE IF EXISTS `menu`;

CREATE TABLE `menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `name` varchar(20) CHARACTER SET utf8mb4 DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table notice
# ------------------------------------------------------------

DROP TABLE IF EXISTS `notice`;

CREATE TABLE `notice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_id` int(11) NOT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `summary` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `detail` varchar(500) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `config_id` (`config_id`),
  CONSTRAINT `notice_ibfk_1` FOREIGN KEY (`config_id`) REFERENCES `config` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table order
# ------------------------------------------------------------

DROP TABLE IF EXISTS `order`;

CREATE TABLE `order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `num` varchar(15) NOT NULL DEFAULT '0',
  `phone` varchar(30) NOT NULL,
  `receiver` varchar(64) NOT NULL,
  `address_text` varchar(1024) NOT NULL,
  `message` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `type` tinyint(4) DEFAULT NULL,
  `freight` smallint(6) DEFAULT NULL,
  `tip` smallint(6) DEFAULT NULL,
  `remark` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `totalPrice` float DEFAULT NULL,
  `money_paid` tinyint(1) DEFAULT NULL,
  `isprint` tinyint(1) DEFAULT '0',
  `pay_type` tinyint(4) DEFAULT NULL,
  `today` tinyint(4) DEFAULT NULL,
  `JH_id` int(11) DEFAULT NULL,
  `SH1_id` int(11) DEFAULT NULL,
  `SH2_id` int(11) DEFAULT NULL,
  `staff_remark` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  `comment` varchar(300) CHARACTER SET utf8mb4 DEFAULT NULL,
  `comment_create_date` datetime DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `fruits` varchar(1000) CHARACTER SET utf8mb4 DEFAULT NULL,
  `mgoods` varchar(1000) CHARACTER SET utf8mb4 DEFAULT NULL,
  `comment_reply` varchar(300) CHARACTER SET utf8mb4 DEFAULT NULL,
  `arrival_day` varchar(32) DEFAULT NULL,
  `arrival_time` varchar(16) DEFAULT NULL,
  `intime_period` int(11) DEFAULT '30',
  `send_time` varchar(45) DEFAULT NULL,
  `del_reason` varchar(300) CHARACTER SET utf8mb4 DEFAULT NULL,
  `comment_imgUrl` varchar(400) DEFAULT NULL,
  `commodity_quality` int(11) DEFAULT NULL,
  `send_speed` int(11) DEFAULT NULL,
  `shop_service` int(11) DEFAULT NULL,
  `online_type` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `order_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  CONSTRAINT `order_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table period
# ------------------------------------------------------------

DROP TABLE IF EXISTS `period`;

CREATE TABLE `period` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_id` int(11) NOT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `name` varchar(20) CHARACTER SET utf8mb4 DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `config_id` (`config_id`),
  CONSTRAINT `period_ibfk_1` FOREIGN KEY (`config_id`) REFERENCES `config` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table pointhistory
# ------------------------------------------------------------

DROP TABLE IF EXISTS `pointhistory`;

CREATE TABLE `pointhistory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `point_type` int(11) DEFAULT NULL,
  `each_point` float DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`,`customer_id`,`shop_id`),
  KEY `customer_id` (`customer_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `pointhistory_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer_shop_follow` (`customer_id`),
  CONSTRAINT `pointhistory_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `customer_shop_follow` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table points
# ------------------------------------------------------------

DROP TABLE IF EXISTS `points`;

CREATE TABLE `points` (
  `id` int(11) NOT NULL,
  `signIn_count` float DEFAULT NULL,
  `totalPrice` float DEFAULT NULL,
  `follow_count` float DEFAULT NULL,
  `favour_count` float DEFAULT NULL,
  `comment_count` float DEFAULT NULL,
  `totalCount` float DEFAULT NULL,
  `balance_count` float DEFAULT NULL,
  `phone_count` float DEFAULT NULL,
  `address_count` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `points_ibfk_1` FOREIGN KEY (`id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop`;

CREATE TABLE `shop` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_name` varchar(128) CHARACTER SET utf8mb4 NOT NULL DEFAULT '',
  `shop_code` varchar(128) NOT NULL,
  `create_date_timestamp` int(11) NOT NULL,
  `shop_status` int(11) DEFAULT NULL,
  `admin_id` int(11) NOT NULL,
  `shop_trademark_url` varchar(2048) DEFAULT NULL,
  `shop_service_area` int(11) DEFAULT NULL,
  `shop_province` int(11) DEFAULT NULL,
  `shop_city` int(11) DEFAULT NULL,
  `shop_address_detail` varchar(1024) NOT NULL,
  `shop_sales_range` varchar(128) DEFAULT NULL,
  `have_offline_entity` tinyint(1) DEFAULT NULL,
  `shop_intro` varchar(568) CHARACTER SET utf8mb4 DEFAULT NULL,
  `total_users` int(11) DEFAULT NULL,
  `daily_sales` int(11) DEFAULT NULL,
  `single_stock_size` int(11) DEFAULT NULL,
  `shop_url` varchar(2048) DEFAULT NULL,
  `shop_start_timestamp` int(11) DEFAULT NULL,
  `team_size` int(11) DEFAULT NULL,
  `have_wx_mp` tinyint(1) DEFAULT NULL,
  `wxapi_token` varchar(128) DEFAULT NULL,
  `wx_accountname` varchar(128) DEFAULT NULL,
  `wx_nickname` varchar(128) CHARACTER SET utf8mb4 DEFAULT NULL,
  `wx_qr_code` varchar(1024) DEFAULT NULL,
  `deliver_area` varchar(100) DEFAULT NULL,
  `new_follower_sum` int(11) DEFAULT NULL,
  `new_order_sum` int(11) DEFAULT NULL,
  `shop_phone` varchar(32) DEFAULT NULL,
  `status` int(11) DEFAULT '1',
  `shop_balance` float DEFAULT '0',
  `available_balance` float DEFAULT '0',
  `shop_auth` int(11) DEFAULT '0',
  `auth_change` int(11) DEFAULT '0',
  `alipay_account` varchar(128) DEFAULT NULL,
  `alipay_account_name` varchar(32) DEFAULT NULL,
  `shop_blockage` float DEFAULT '0',
  `is_balance` int(11) DEFAULT '0',
  `old_msg` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `shop_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop_admin
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop_admin`;

CREATE TABLE `shop_admin` (
  `id` int(11) NOT NULL,
  `role` int(11) NOT NULL,
  `privileges` int(11) DEFAULT NULL,
  `expire_time` int(11) DEFAULT NULL,
  `briefintro` varchar(300) DEFAULT NULL,
  `system_market_url` varchar(256) DEFAULT NULL,
  `system_password` varchar(128) DEFAULT NULL,
  `system_username` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `shop_admin_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account_info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop_auth
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop_auth`;

CREATE TABLE `shop_auth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_type` int(11) DEFAULT NULL,
  `company_name` varchar(128) DEFAULT NULL,
  `business_licence` varchar(2048) DEFAULT NULL,
  `realname` varchar(16) DEFAULT NULL,
  `card_id` varchar(32) DEFAULT NULL,
  `handle_img` varchar(2048) DEFAULT NULL,
  `front_img` varchar(2048) DEFAULT NULL,
  `behind_img` varchar(2048) DEFAULT NULL,
  `has_done` int(11) DEFAULT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `decline_reason` varchar(200) CHARACTER SET utf8mb4 DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `shop_auth_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop_demandfruit_link
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop_demandfruit_link`;

CREATE TABLE `shop_demandfruit_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `fruit_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  KEY `fruit_id` (`fruit_id`),
  CONSTRAINT `shop_demandfruit_link_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shop_demandfruit_link_ibfk_2` FOREIGN KEY (`fruit_id`) REFERENCES `fruit_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop_favor_comment
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop_favor_comment`;

CREATE TABLE `shop_favor_comment` (
  `shop_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  PRIMARY KEY (`shop_id`,`order_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `shop_favor_comment_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  CONSTRAINT `shop_favor_comment_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop_onsalefruit_link
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop_onsalefruit_link`;

CREATE TABLE `shop_onsalefruit_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `fruit_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  KEY `fruit_id` (`fruit_id`),
  CONSTRAINT `shop_onsalefruit_link_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shop_onsalefruit_link_ibfk_2` FOREIGN KEY (`fruit_id`) REFERENCES `fruit_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop_staff
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop_staff`;

CREATE TABLE `shop_staff` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `shop_staff_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account_info` (`id`),
  CONSTRAINT `shop_staff_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shop_temp
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shop_temp`;

CREATE TABLE `shop_temp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `shop_name` varchar(128) CHARACTER SET utf8mb4 NOT NULL DEFAULT '',
  `create_date_timestamp` int(11) NOT NULL,
  `shop_status` int(11) DEFAULT NULL,
  `declined_reason` varchar(256) CHARACTER SET utf8mb4 DEFAULT NULL,
  `shop_trademark_url` varchar(2048) DEFAULT NULL,
  `shop_service_area` int(11) DEFAULT NULL,
  `shop_province` int(11) DEFAULT NULL,
  `shop_city` int(11) DEFAULT NULL,
  `shop_address_detail` varchar(1024) NOT NULL,
  `have_offline_entity` tinyint(1) DEFAULT NULL,
  `shop_intro` varchar(568) CHARACTER SET utf8mb4 DEFAULT NULL,
  `shop_phone` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `shop_temp_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table shops_collect
# ------------------------------------------------------------

DROP TABLE IF EXISTS `shops_collect`;

CREATE TABLE `shops_collect` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `shops_collect_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`),
  CONSTRAINT `shops_collect_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table super_admin
# ------------------------------------------------------------

DROP TABLE IF EXISTS `super_admin`;

CREATE TABLE `super_admin` (
  `id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `super_admin_ibfk_1` FOREIGN KEY (`id`) REFERENCES `account_info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table sys_charge_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `sys_charge_type`;

CREATE TABLE `sys_charge_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `good_name` varchar(32) NOT NULL,
  `month` int(11) NOT NULL,
  `price` float NOT NULL,
  `description` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table sys_notice
# ------------------------------------------------------------

DROP TABLE IF EXISTS `sys_notice`;

CREATE TABLE `sys_notice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL DEFAULT '',
  `detail` varchar(1000) NOT NULL DEFAULT '',
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table system_order
# ------------------------------------------------------------

DROP TABLE IF EXISTS `system_order`;

CREATE TABLE `system_order` (
  `order_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_status` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `create_date_timestamp` int(11) NOT NULL,
  `charge_id` int(11) NOT NULL,
  `charge_good_name` varchar(32) NOT NULL,
  `charge_month` int(11) NOT NULL,
  `charge_price` float NOT NULL,
  `charge_description` varchar(32) NOT NULL,
  `have_read` tinyint(1) DEFAULT NULL,
  `ali_trade_no` varchar(33) DEFAULT NULL,
  `have_more_data` tinyint(1) NOT NULL,
  `buyer_email` varchar(101) DEFAULT NULL,
  `buyer_id` varchar(17) DEFAULT NULL,
  `gmt_create` varchar(32) DEFAULT NULL,
  `gmt_payment` varchar(32) DEFAULT NULL,
  `gmt_close` varchar(32) DEFAULT NULL,
  `quantity` varchar(8) DEFAULT NULL,
  `trade_status` varchar(32) DEFAULT NULL,
  `notify_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `system_order_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `shop_admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
