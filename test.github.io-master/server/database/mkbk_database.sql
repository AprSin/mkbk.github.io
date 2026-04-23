-- ========================================================
-- 农村产权交易平台数据库初始化脚本
-- 数据库名称: mkbk
-- 创建日期: 2026-04-18
-- 适用: MySQL 8.0+
-- ========================================================

-- 使用已创建的数据库
USE `cloud_prosperity`;

-- ========================================================
-- 1. 用户表 (users)
-- ========================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) NULL COMMENT '手机号',
  `password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `role` ENUM('admin', 'user', 'guest') NOT NULL DEFAULT 'user' COMMENT '角色',
  `account_type` ENUM('merchant', 'buyer', 'admin') NOT NULL DEFAULT 'buyer' COMMENT '账户类型',
  `name` VARCHAR(100) NULL COMMENT '真实姓名',
  `address` VARCHAR(255) NULL COMMENT '地址',
  `business_license` VARCHAR(100) NULL COMMENT '营业执照编号',
  `business_scope` TEXT NULL COMMENT '经营范围',
  `company_phone` VARCHAR(20) NULL COMMENT '企业联系电话',
  `company_address` VARCHAR(255) NULL COMMENT '企业地址',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `last_login_at` DATETIME NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) NULL COMMENT '最后登录IP',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_account_type` (`account_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================================
-- 2. 农产品表 (products)
-- ========================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '产品ID',
  `name` VARCHAR(200) NOT NULL COMMENT '产品名称',
  `description` TEXT NULL COMMENT '产品描述',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '价格',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
  `origin` VARCHAR(100) NULL COMMENT '产地',
  `image` VARCHAR(500) NULL COMMENT '产品图片URL',
  `status` ENUM('在售', '已售罄', '下架') NOT NULL DEFAULT '在售' COMMENT '状态',
  `category` VARCHAR(50) NULL COMMENT '分类',
  `user_id` INT UNSIGNED NOT NULL COMMENT '商家ID',
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览次数',
  `sales_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '销售数量',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_status` (`status`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_price` (`price`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_product_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='农产品表';

-- ========================================================
-- 3. 项目表 (projects) - 宅基地、厂房等
-- ========================================================
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `name` VARCHAR(200) NOT NULL COMMENT '项目名称',
  `description` TEXT NULL COMMENT '项目描述',
  `price` DECIMAL(15, 2) NOT NULL COMMENT '价格',
  `location` VARCHAR(255) NULL COMMENT '位置',
  `area` VARCHAR(100) NULL COMMENT '面积',
  `type` VARCHAR(50) NULL COMMENT '项目类型：宅基地、厂房等',
  `status` ENUM('交易中', '已完成', '已取消') NOT NULL DEFAULT '交易中' COMMENT '状态',
  `bid_end_date` DATETIME NULL COMMENT '投标截止日期',
  `contact_person` VARCHAR(100) NULL COMMENT '联系人',
  `contact_info` VARCHAR(100) NULL COMMENT '联系方式',
  `user_id` INT UNSIGNED NOT NULL COMMENT '发布者ID',
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览次数',
  `bid_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '投标人数',
  `attachments` JSON NULL COMMENT '附件列表 [{name, url, size, type}]',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_status` (`status`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_price` (`price`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_project_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- ========================================================
-- 4. 订单表 (orders)
-- ========================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `buyer_id` INT UNSIGNED NOT NULL COMMENT '买家ID',
  `merchant_id` INT UNSIGNED NULL COMMENT '商家ID',
  `product_id` INT UNSIGNED NULL COMMENT '产品ID',
  `quantity` INT NOT NULL COMMENT '购买数量',
  `total_price` DECIMAL(10, 2) NOT NULL COMMENT '总价',
  `status` ENUM('已支付', '待发货', '待收货', '已完成', '已取消', '退单中', '已退单') NOT NULL DEFAULT '已支付' COMMENT '订单状态',
  `payment_status` ENUM('未支付', '已支付', '已退款') NOT NULL DEFAULT '已支付' COMMENT '支付状态',
  `logistics_company` VARCHAR(100) NULL COMMENT '物流公司',
  `tracking_number` VARCHAR(100) NULL COMMENT '物流单号',
  `remark` TEXT NULL COMMENT '备注',
  `return_reason` TEXT NULL COMMENT '退单原因',
  `return_quantity` INT NULL COMMENT '退单数量',
  `return_status` ENUM('无', '申请中', '已批准', '已拒绝') NOT NULL DEFAULT '无' COMMENT '退单状态',
  `paid_at` DATETIME NULL COMMENT '支付时间',
  `shipped_at` DATETIME NULL COMMENT '发货时间',
  `completed_at` DATETIME NULL COMMENT '完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_buyer_id` (`buyer_id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_order_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_order_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ========================================================
-- 5. 购物车表 (carts)
-- ========================================================
CREATE TABLE IF NOT EXISTS `carts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '购物车ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `product_id` INT UNSIGNED NOT NULL COMMENT '产品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- ========================================================
-- 6. 投标表 (bids)
-- ========================================================
CREATE TABLE IF NOT EXISTS `bids` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '投标ID',
  `project_id` INT UNSIGNED NOT NULL COMMENT '项目ID',
  `buyer_id` INT UNSIGNED NOT NULL COMMENT '投标人ID',
  `amount` DECIMAL(15, 2) NOT NULL COMMENT '投标金额',
  `contact` VARCHAR(100) NOT NULL COMMENT '联系人',
  `phone` VARCHAR(20) NOT NULL COMMENT '联系电话',
  `status` ENUM('待处理', '已接受', '已拒绝', '已撤回') NOT NULL DEFAULT '待处理' COMMENT '投标状态',
  `reject_reason` TEXT NULL COMMENT '拒绝原因',
  `bid_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '投标日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_buyer_id` (`buyer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_bid_date` (`bid_date`),
  CONSTRAINT `fk_bid_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bid_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投标表';

-- ========================================================
-- 7. 消息表 (messages)
-- ========================================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `sender_id` INT UNSIGNED NULL COMMENT '发送者ID，NULL表示系统消息',
  `sender_type` ENUM('admin', 'system', 'user') NOT NULL DEFAULT 'admin' COMMENT '发送者类型',
  `sender_name` VARCHAR(100) NULL COMMENT '发送者名称',
  `receiver_id` INT UNSIGNED NULL COMMENT '接收者ID，NULL表示全体',
  `receiver_type` ENUM('all_users', 'all_merchants', 'specific_user', 'specific_merchant', 'admin') NOT NULL DEFAULT 'specific_user' COMMENT '接收者类型',
  `receiver_name` VARCHAR(100) NULL COMMENT '接收者名称',
  `title` VARCHAR(200) NOT NULL COMMENT '消息标题',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `type` ENUM('system', 'order', 'product', 'account', 'return', 'bid', 'custom') NOT NULL DEFAULT 'custom' COMMENT '消息类型',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
  `related_id` INT UNSIGNED NULL COMMENT '关联ID（如订单ID、产品ID等）',
  `related_type` VARCHAR(50) NULL COMMENT '关联类型',
  `expires_at` DATETIME NULL COMMENT '过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ========================================================
-- 8. 数据日志表 (data_logs)
-- ========================================================
CREATE TABLE IF NOT EXISTS `data_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '操作用户ID',
  `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW') NOT NULL COMMENT '操作类型',
  `entity_type` VARCHAR(50) NOT NULL COMMENT '实体类型：Product, Project, Order, Bid, User等',
  `entity_id` INT UNSIGNED NOT NULL COMMENT '实体ID',
  `changes` JSON NULL COMMENT '变更内容 {field: [oldValue, newValue]}',
  `old_data` JSON NULL COMMENT '变更前数据快照',
  `new_data` JSON NULL COMMENT '变更后数据快照',
  `ip_address` VARCHAR(45) NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) NULL COMMENT '用户代理',
  `request_id` VARCHAR(100) NULL COMMENT '请求ID用于追踪',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_datalog_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据日志表';

-- ========================================================
-- 初始化数据
-- ========================================================

-- 创建默认管理员账户 (密码: admin123)
-- 注意：生产环境请使用安全的密码哈希
INSERT INTO `users` (`username`, `email`, `password`, `role`, `account_type`, `name`, `is_active`) VALUES
('admin', 'admin@mkbk.com', '$2b$10$YourHashedPasswordHere', 'admin', 'admin', '系统管理员', 1);

-- ========================================================
-- 完成
-- ========================================================
SELECT '数据库 mkbk 创建成功！' AS message;
