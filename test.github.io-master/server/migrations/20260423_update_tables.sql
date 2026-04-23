-- Migration for publish approval feature - update existing tables
-- 1. Modify products table status enum to add pending status
ALTER TABLE `products` MODIFY COLUMN `status` ENUM('pending', 'approved', 'rejected', '待审核', '在售', '已售罄', '下架') DEFAULT 'pending';

-- 2. Modify projects table status enum to add pending status
ALTER TABLE `projects` MODIFY COLUMN `status` ENUM('pending', 'approved', 'rejected', '待审核', '交易中', '已完成', '已取消') DEFAULT 'pending';

-- 3. Add rejection fields to project_applications table
ALTER TABLE `project_applications` ADD COLUMN `rejection_reason` ENUM('A', 'B', 'C', 'D') NULL AFTER `review_comment`;
ALTER TABLE `project_applications` ADD COLUMN `rejection_detail` TEXT NULL AFTER `rejection_reason`;

SELECT 'Existing tables updated' AS status;