-- Migration for publish approval feature
-- 1. Create product_publish_requests table
CREATE TABLE IF NOT EXISTS `product_publish_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `merchant_id` INT NOT NULL,
  `merchant_name` VARCHAR(100) NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `product_data` JSON NOT NULL,
  `rejection_reason` ENUM('A', 'B', 'C', 'D') NULL,
  `rejection_detail` TEXT NULL,
  `review_comment` TEXT NULL,
  `reviewer_id` INT NULL,
  `reviewer_name` VARCHAR(100) NULL,
  `reviewed_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  INDEX `idx_merchant_id` (`merchant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Table product_publish_requests created' AS status;