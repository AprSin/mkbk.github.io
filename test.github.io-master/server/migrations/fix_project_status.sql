-- Fix projects status enum to add 待审核
ALTER TABLE `projects` MODIFY COLUMN `status` ENUM('待审核','交易中','已完成','已取消') DEFAULT '待审核';
