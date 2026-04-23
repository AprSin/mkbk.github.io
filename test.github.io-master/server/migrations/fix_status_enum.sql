-- 修复 projects 表的 status 字段
ALTER TABLE `projects` MODIFY COLUMN `status` ENUM('待审核', '交易中', '已完成', '已取消') DEFAULT '待审核';

-- 修复 products 表的 status 字段
ALTER TABLE `products` MODIFY COLUMN `status` ENUM('待审核', '在售', '已售罄', '下架') DEFAULT '待审核';
