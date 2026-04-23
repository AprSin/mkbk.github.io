-- =============================================
-- 云上共富系统 测试数据
-- 生成时间: 2026-04-23
-- =============================================

USE cloud_prosperity;

-- =============================================
-- 1. 用户数据
-- =============================================

-- 清理现有测试数据
DELETE FROM bids WHERE buyer_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE username LIKE 'test_%') OR merchant_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM products WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM user_update_requests WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM product_update_requests WHERE product_id IN (SELECT id FROM products WHERE name LIKE '测试%');
DELETE FROM users WHERE username LIKE 'test_%';

-- 添加测试商户 (商家)
INSERT INTO users (username, password, email, phone, role, account_type, name, real_name, address, business_scope, company_phone, company_address, is_active, created_at, updated_at) VALUES
('test_merchant1', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant1@example.com', '13800138001', 'user', 'merchant', '绿野农场', '张建国', '河南省商丘市梁园区', '蔬菜种植、家禽养殖', '0370-1234567', '河南省商丘市梁园区绿野路88号', 1, NOW(), NOW()),
('test_merchant2', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant2@example.com', '13800138002', 'user', 'merchant', '金穗农业合作社', '李秀英', '河南省商丘市睢阳区', '粮食作物、经济作物', '0370-2345678', '河南省商丘市睢阳区金穗大道168号', 1, NOW(), NOW()),
('test_merchant3', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant3@example.com', '13800138003', 'user', 'merchant', '山水果园', '王志强', '河南省商丘市民权县', '水果种植采摘', '0370-3456789', '河南省商丘市民权县山水镇果园路56号', 1, NOW(), NOW());

-- 添加测试买家
INSERT INTO users (username, password, email, phone, role, account_type, name, real_name, address, is_active, created_at, updated_at) VALUES
('test_buyer1', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer1@example.com', '13900139001', 'user', 'buyer', '张三', '张三', '河南省郑州市金水区花园路123号', 1, NOW(), NOW()),
('test_buyer2', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer2@example.com', '13900139002', 'user', 'buyer', '李四', '李四', '河南省开封市龙亭区中山路456号', 1, NOW(), NOW()),
('test_buyer3', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer3@example.com', '13900139003', 'user', 'buyer', '王五', '王五', '河南省洛阳市西工区中州中路789号', 1, NOW(), NOW());

SELECT '用户数据创建完成' AS status;

-- =============================================
-- 2. 农产品数据
-- =============================================

INSERT INTO products (name, description, price, stock, origin, image, status, category, user_id, view_count, sales_count, shipping_time, created_at, updated_at) VALUES

-- 商户1的产品
('新鲜有机西红柿', '自家农场种植，无农药残留，自然成熟，口感鲜美。产自绿野农场标准化大棚，全程有机种植管理。', 3.50, 500, '商丘市梁园区绿野农场', '/images/tomato.jpg', '在售', '蔬菜', (SELECT id FROM users WHERE username='test_merchant1'), 328, 156, '24小时内发货', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('土鸡蛋', '散养土鸡所产，蛋黄橙红饱满，蛋白粘稠。鸡群在果园自然放养，以虫子、青草为食。', 15.00, 200, '商丘市梁园区绿野农场', '/images/eggs.jpg', '在售', '禽蛋', (SELECT id FROM users WHERE username='test_merchant1'), 256, 89, '24小时内发货', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('新鲜黄瓜', '清脆爽口，凉拌热炒皆宜。采用滴灌节水技术种植，品质优良。', 2.00, 800, '商丘市梁园区绿野农场', '/images/cucumber.jpg', '在售', '蔬菜', (SELECT id FROM users WHERE username='test_merchant1'), 189, 234, '24小时内发货', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
('有机小白菜', '叶片嫩绿，富含维生素。无化学肥料，口感清甜。', 2.50, 300, '商丘市梁园区绿野农场', '/images/bokchoy.jpg', '在售', '蔬菜', (SELECT id FROM users WHERE username='test_merchant1'), 145, 67, '3天内发货', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

-- 商户2的产品
('优质小麦面粉', '金穗合作社优质小麦精制而成，筋道爽滑，适合做馒头、面条、饺子等。', 3.00, 1000, '商丘市睢阳区金穗合作社', '/images/flour.jpg', '在售', '粮食', (SELECT id FROM users WHERE username='test_merchant2'), 412, 567, '24小时内发货', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
('玉米糁', '新鲜玉米磨制，金黄细腻，煮粥香甜可口。富含膳食纤维。', 4.00, 600, '商丘市睢阳区金穗合作社', '/images/corn.jpg', '在售', '粮食', (SELECT id FROM users WHERE username='test_merchant2'), 298, 345, '24小时内发货', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
('花生油', '物理压榨一级花生油，金黄透亮，香味浓郁。', 25.00, 150, '商丘市睢阳区金穗合作社', '/images/peanutoil.jpg', '在售', '粮食', (SELECT id FROM users WHERE username='test_merchant2'), 567, 234, '3天内发货', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
('红薯粉条', '纯手工制作，晶莹剔透，耐煮不糊。炖菜、凉拌佳品。', 12.00, 400, '商丘市睢阳区金穗合作社', '/images/noodles.jpg', '在售', '粮食', (SELECT id FROM users WHERE username='test_merchant2'), 234, 178, '3天内发货', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),

-- 商户3的产品
('新鲜红富士苹果', '山地果园种植，个大色红，甘甜多汁。自然采光，品质上乘。', 5.00, 800, '商丘市民权县山水果园', '/images/apple.jpg', '在售', '水果', (SELECT id FROM users WHERE username='test_merchant3'), 678, 456, '24小时内发货', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('草莓', '大棚草莓，香甜可口，个大饱满。现场采摘，新鲜保证。', 20.00, 100, '商丘市民权县山水果园', '/images/strawberry.jpg', '在售', '水果', (SELECT id FROM users WHERE username='test_merchant3'), 890, 123, '预售', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('葡萄', '阳光玫瑰葡萄，甘甜无籽，皮薄肉厚。优质品种，欢迎选购。', 15.00, 300, '商丘市民权县山水果园', '/images/grape.jpg', '在售', '水果', (SELECT id FROM users WHERE username='test_merchant3'), 456, 234, '15天内发货', DATE_SUB(NOW(), INTERVAL 9 DAY), NOW()),
('鲜桃', '春雪桃，早熟品种，果肉细腻，汁多味甜。', 6.00, 500, '商丘市民权县山水果园', '/images/peach.jpg', '在售', '水果', (SELECT id FROM users WHERE username='test_merchant3'), 345, 189, '3天内发货', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW());

SELECT '农产品数据创建完成' AS status;

-- =============================================
-- 3. 订单数据
-- =============================================

SET @merchant1_id = (SELECT id FROM users WHERE username='test_merchant1');
SET @merchant2_id = (SELECT id FROM users WHERE username='test_merchant2');
SET @merchant3_id = (SELECT id FROM users WHERE username='test_merchant3');
SET @buyer1_id = (SELECT id FROM users WHERE username='test_buyer1');
SET @buyer2_id = (SELECT id FROM users WHERE username='test_buyer2');
SET @buyer3_id = (SELECT id FROM users WHERE username='test_buyer3');

SET @product1_id = (SELECT id FROM products WHERE name='新鲜有机西红柿');
SET @product2_id = (SELECT id FROM products WHERE name='土鸡蛋');
SET @product3_id = (SELECT id FROM products WHERE name='优质小麦面粉');
SET @product4_id = (SELECT id FROM products WHERE name='新鲜红富士苹果');
SET @product5_id = (SELECT id FROM products WHERE name='草莓');

-- 订单1: 已完成订单
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, shipped_at, completed_at, logistics_company, tracking_number, auto_confirmed, created_at) VALUES
('ORD20260420001', @buyer1_id, @merchant1_id, @product1_id, 10, 35.00, '已完成', '已支付', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), '顺丰快递', 'SF1234567890', 0, DATE_SUB(NOW(), INTERVAL 15 DAY));

-- 订单2: 待收货订单
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, shipped_at, auto_confirm_scheduled_at, logistics_company, tracking_number, created_at) VALUES
('ORD20260421001', @buyer1_id, @merchant2_id, @product3_id, 20, 60.00, '待收货', '已支付', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY), '中通快递', 'ZT9876543210', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- 订单3: 待发货订单
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, created_at) VALUES
('ORD20260422001', @buyer2_id, @merchant1_id, @product2_id, 5, 75.00, '待发货', '已支付', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 订单4: 退单中订单
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, shipped_at, return_status, return_type, return_reason, return_quantity, return_requested_at, logistics_company, tracking_number, created_at) VALUES
('ORD20260419001', @buyer3_id, @merchant3_id, @product4_id, 8, 40.00, '退单中', '已支付', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), '申请中', '退货退款', '收到时发现部分苹果有碰伤，要求退换', 3, DATE_SUB(NOW(), INTERVAL 1 DAY), '圆通速递', 'YT5555666677', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- 订单5: 已支付订单
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, created_at) VALUES
('ORD20260423001', @buyer2_id, @merchant3_id, @product5_id, 3, 45.00, '已支付', '已支付', NOW(), NOW());

-- 订单6: 预售订单
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, created_at) VALUES
('ORD20260423002', @buyer1_id, @merchant3_id, @product5_id, 2, 40.00, '已支付', '已支付', NOW(), NOW());

SELECT '订单数据创建完成' AS status;

-- =============================================
-- 4. 项目数据
-- =============================================

INSERT INTO projects (name, description, area, expected_yield, price, location, contact_person, contact_info, status, user_id, created_at) VALUES
('有机蔬菜种植基地合作', '寻求合作伙伴共同开发50亩有机蔬菜种植基地，我方提供土地和设施，希望有经验的农业企业或个人加入，共同投资分红。', 50, 100000, 50000.00, '商丘市梁园区', '张经理', '13800138001', '招募中', @merchant1_id, DATE_SUB(NOW(), INTERVAL 20 DAY)),
('粮食收储合作项目', '金穗合作社新建粮仓，寻求粮食收储合作伙伴，提供仓储设施和销售渠道，收益按比例分成。', 200, 500000, 100000.00, '商丘市睢阳区', '李经理', '13800138002', '招募中', @merchant2_id, DATE_SUB(NOW(), INTERVAL 15 DAY)),
('水果采摘园开发', '山水果园计划开发20亩采摘园，种植樱桃、蓝莓等高端水果，寻求投资合作伙伴。', 20, 30000, 30000.00, '商丘市民权县', '王经理', '13800138003', '招募中', @merchant3_id, DATE_SUB(NOW(), INTERVAL 10 DAY));

SELECT '项目数据创建完成' AS status;

-- =============================================
-- 5. 投标数据
-- =============================================

SET @project1_id = (SELECT id FROM projects WHERE name LIKE '%有机蔬菜%');
SET @project2_id = (SELECT id FROM projects WHERE name LIKE '%粮食收储%');
SET @project3_id = (SELECT id FROM projects WHERE name LIKE '%水果采摘%');

INSERT INTO bids (project_id, buyer_id, amount, contact, phone, status, created_at) VALUES
(@project1_id, @buyer1_id, 30000.00, '张三', '13900139001', '待处理', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@project1_id, @buyer2_id, 40000.00, '李四', '13900139002', '待处理', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@project2_id, @buyer1_id, 80000.00, '张三', '13900139001', '已接受', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@project2_id, @buyer3_id, 60000.00, '王五', '13900139003', '已拒绝', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(@project3_id, @buyer2_id, 25000.00, '李四', '13900139002', '待处理', DATE_SUB(NOW(), INTERVAL 2 DAY));

SELECT '投标数据创建完成' AS status;

-- =============================================
-- 6. 消息数据
-- =============================================

INSERT INTO messages (sender_id, sender_type, sender_name, receiver_id, receiver_type, receiver_name, title, content, type, related_id, related_type, created_at) VALUES
(NULL, 'system', '系统', @buyer1_id, 'specific_user', '张三', '订单已确认收货', '您的订单（订单号：ORD20260420001）已确认收货！', 'order', (SELECT id FROM orders WHERE order_no='ORD20260420001'), 'Order', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(NULL, 'system', '系统', @merchant1_id, 'specific_merchant', '绿野农场', '订单已完成', '订单（订单号：ORD20260420001）已由买家确认收货！', 'order', (SELECT id FROM orders WHERE order_no='ORD20260420001'), 'Order', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(NULL, 'system', '系统', @buyer1_id, 'specific_user', '张三', '订单已发货', '您的订单（订单号：ORD20260421001）已发货！物流公司：中通快递，运单号：ZT9876543210', 'order', (SELECT id FROM orders WHERE order_no='ORD20260421001'), 'Order', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(NULL, 'system', '系统', @buyer3_id, 'specific_user', '王五', '退货申请已提交', '您的退货申请已提交，等待商家审核。', 'order', (SELECT id FROM orders WHERE order_no='ORD20260419001'), 'Order', DATE_SUB(NOW(), INTERVAL 1 DAY));

SELECT '消息数据创建完成' AS status;

-- =============================================
-- 7. 更新库存和销量
-- =============================================

UPDATE products SET stock = 490, sales_count = 166 WHERE name = '新鲜有机西红柿';
UPDATE products SET stock = 195, sales_count = 95 WHERE name = '土鸡蛋';
UPDATE products SET stock = 980, sales_count = 587 WHERE name = '优质小麦面粉';
UPDATE products SET stock = 792, sales_count = 468 WHERE name = '新鲜红富士苹果';

SELECT '========================================' AS '';
SELECT '测试数据创建完成！' AS status;
SELECT '========================================' AS '';
