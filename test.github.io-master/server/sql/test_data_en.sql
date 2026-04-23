-- Test Data for Cloud Prosperity System
-- Date: 2026-04-23

USE cloud_prosperity;

-- Clean up existing test data
DELETE FROM bids WHERE buyer_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE username LIKE 'test_%') OR merchant_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM products WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM users WHERE username LIKE 'test_%';

-- =============================================
-- 1. Users
-- =============================================

INSERT INTO users (username, password, email, phone, role, account_type, name, real_name, address, business_scope, company_phone, company_address, is_active, created_at, updated_at) VALUES
('test_merchant1', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant1@example.com', '13800138001', 'user', 'merchant', 'Green Field Farm', 'Zhang Jianguo', 'Liangyuan District, Shangqiu, Henan', 'Vegetable planting, Poultry farming', '0370-1234567', '88 Lvye Road, Liangyuan District, Shangqiu', 1, NOW(), NOW()),
('test_merchant2', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant2@example.com', '13800138002', 'user', 'merchant', 'Jinsui Agricultural Cooperative', 'Li Xiuying', 'Suiyang District, Shangqiu, Henan', 'Grain crops, Cash crops', '0370-2345678', '168 Jinsui Avenue, Suiyang District, Shangqiu', 1, NOW(), NOW()),
('test_merchant3', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant3@example.com', '13800138003', 'user', 'merchant', 'Mountain Fruit Orchard', 'Wang Zhiqiang', 'Minquan County, Shangqiu, Henan', 'Fruit planting and picking', '0370-3456789', '56 Guoyuan Road, Shuishan Town, Minquan County', 1, NOW(), NOW());

INSERT INTO users (username, password, email, phone, role, account_type, name, real_name, address, is_active, created_at, updated_at) VALUES
('test_buyer1', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer1@example.com', '13900139001', 'user', 'buyer', 'Zhang San', 'Zhang San', '123 Huayuan Road, Jinshui District, Zhengzhou', 1, NOW(), NOW()),
('test_buyer2', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer2@example.com', '13900139002', 'user', 'buyer', 'Li Si', 'Li Si', '456 Zhongshan Road, Longting District, Kaifeng', 1, NOW(), NOW()),
('test_buyer3', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer3@example.com', '13900139003', 'user', 'buyer', 'Wang Wu', 'Wang Wu', '789 Zhongzhou Middle Road, Xigong District, Luoyang', 1, NOW(), NOW());

SELECT 'Users created' AS status;

-- =============================================
-- 2. Products
-- =============================================

INSERT INTO products (name, description, price, stock, origin, image, status, category, user_id, view_count, sales_count, shipping_time, created_at, updated_at) VALUES

-- Merchant 1 products
('Fresh Organic Tomatoes', 'Home farm grown, no pesticide residue, naturally ripened, delicious taste. From Green Field Farm standard greenhouse, full organic cultivation management.', 3.50, 500, 'Green Field Farm, Liangyuan District, Shangqiu', '/images/tomato.jpg', '在售', 'Vegetables', (SELECT id FROM users WHERE username='test_merchant1'), 328, 156, '24小时内发货', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('Free-range Eggs', 'From free-range chickens, orange-red yolk, thick protein. Chickens roam naturally in the orchard, eating insects and grass.', 15.00, 200, 'Green Field Farm, Liangyuan District, Shangqiu', '/images/eggs.jpg', '在售', 'Poultry Eggs', (SELECT id FROM users WHERE username='test_merchant1'), 256, 89, '24小时内发货', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('Fresh Cucumbers', 'Crisp and refreshing, great for cold salads or cooking. Grown using drip irrigation water-saving technology, excellent quality.', 2.00, 800, 'Green Field Farm, Liangyuan District, Shangqiu', '/images/cucumber.jpg', '在售', 'Vegetables', (SELECT id FROM users WHERE username='test_merchant1'), 189, 234, '24小时内发货', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
('Organic Bok Choy', 'Tender green leaves, rich in vitamins. No chemical fertilizers, sweet taste.', 2.50, 300, 'Green Field Farm, Liangyuan District, Shangqiu', '/images/bokchoy.jpg', '在售', 'Vegetables', (SELECT id FROM users WHERE username='test_merchant1'), 145, 67, '3天内发货', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

-- Merchant 2 products
('Premium Wheat Flour', 'Refined from quality wheat at Jinsui Cooperative, glutinous and smooth, suitable for making steamed buns, noodles, dumplings.', 3.00, 1000, 'Jinsui Cooperative, Suiyang District, Shangqiu', '/images/flour.jpg', '在售', 'Grains', (SELECT id FROM users WHERE username='test_merchant2'), 412, 567, '24小时内发货', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
('Corn Grits', 'Fresh corn ground, golden and delicate, porridge is sweet and delicious. Rich in dietary fiber.', 4.00, 600, 'Jinsui Cooperative, Suiyang District, Shangqiu', '/images/corn.jpg', '在售', 'Grains', (SELECT id FROM users WHERE username='test_merchant2'), 298, 345, '24小时内发货', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
('Peanut Oil', 'Physical pressed first-grade peanut oil, golden and transparent, rich fragrance.', 25.00, 150, 'Jinsui Cooperative, Suiyang District, Shangqiu', '/images/peanutoil.jpg', '在售', 'Grains', (SELECT id FROM users WHERE username='test_merchant2'), 567, 234, '3天内发货', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
('Sweet Potato Noodles', 'Handmade, crystal clear, boil-resistant and non-muddy. Great for stews and cold dishes.', 12.00, 400, 'Jinsui Cooperative, Suiyang District, Shangqiu', '/images/noodles.jpg', '在售', 'Grains', (SELECT id FROM users WHERE username='test_merchant2'), 234, 178, '3天内发货', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),

-- Merchant 3 products
('Fresh Fuji Apples', 'Mountain orchard grown, large and red, sweet and juicy. Natural lighting, top quality.', 5.00, 800, 'Mountain Fruit Orchard, Minquan County, Shangqiu', '/images/apple.jpg', '在售', 'Fruits', (SELECT id FROM users WHERE username='test_merchant3'), 678, 456, '24小时内发货', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('Strawberries', 'Greenhouse strawberries, sweet and delicious, large and plump. On-site picking, fresh guarantee.', 20.00, 100, 'Mountain Fruit Orchard, Minquan County, Shangqiu', '/images/strawberry.jpg', '在售', 'Fruits', (SELECT id FROM users WHERE username='test_merchant3'), 890, 123, '预售', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('Grapes', 'Sunshine Rose grapes, sweet and seedless, thin skin and thick flesh. Premium variety, welcome to order.', 15.00, 300, 'Mountain Fruit Orchard, Minquan County, Shangqiu', '/images/grape.jpg', '在售', 'Fruits', (SELECT id FROM users WHERE username='test_merchant3'), 456, 234, '15天内发货', DATE_SUB(NOW(), INTERVAL 9 DAY), NOW()),
('Fresh Peaches', 'Spring Snow peaches, early-maturing variety, tender flesh, juicy and sweet.', 6.00, 500, 'Mountain Fruit Orchard, Minquan County, Shangqiu', '/images/peach.jpg', '在售', 'Fruits', (SELECT id FROM users WHERE username='test_merchant3'), 345, 189, '3天内发货', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW());

SELECT 'Products created' AS status;

-- =============================================
-- 3. Orders
-- =============================================

SET @merchant1_id = (SELECT id FROM users WHERE username='test_merchant1');
SET @merchant2_id = (SELECT id FROM users WHERE username='test_merchant2');
SET @merchant3_id = (SELECT id FROM users WHERE username='test_merchant3');
SET @buyer1_id = (SELECT id FROM users WHERE username='test_buyer1');
SET @buyer2_id = (SELECT id FROM users WHERE username='test_buyer2');
SET @buyer3_id = (SELECT id FROM users WHERE username='test_buyer3');

SET @product1_id = (SELECT id FROM products WHERE name='Fresh Organic Tomatoes');
SET @product2_id = (SELECT id FROM products WHERE name='Free-range Eggs');
SET @product3_id = (SELECT id FROM products WHERE name='Premium Wheat Flour');
SET @product4_id = (SELECT id FROM products WHERE name='Fresh Fuji Apples');
SET @product5_id = (SELECT id FROM products WHERE name='Strawberries');

-- Order 1: Completed order
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, shipped_at, completed_at, logistics_company, tracking_number, auto_confirmed, created_at) VALUES
('ORD20260420001', @buyer1_id, @merchant1_id, @product1_id, 10, 35.00, '已完成', '已支付', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), 'SF Express', 'SF1234567890', 0, DATE_SUB(NOW(), INTERVAL 15 DAY));

-- Order 2: Pending receipt
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, shipped_at, auto_confirm_scheduled_at, logistics_company, tracking_number, created_at) VALUES
('ORD20260421001', @buyer1_id, @merchant2_id, @product3_id, 20, 60.00, '待收货', '已支付', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY), 'ZTO Express', 'ZT9876543210', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Order 3: Pending shipment
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, created_at) VALUES
('ORD20260422001', @buyer2_id, @merchant1_id, @product2_id, 5, 75.00, '待发货', '已支付', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Order 4: Return in progress
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, shipped_at, return_status, return_type, return_reason, return_quantity, return_requested_at, logistics_company, tracking_number, created_at) VALUES
('ORD20260419001', @buyer3_id, @merchant3_id, @product4_id, 8, 40.00, '退单中', '已支付', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), '申请中', '退货退款', 'Some apples were bruised upon receipt, requesting return', 3, DATE_SUB(NOW(), INTERVAL 1 DAY), 'YTO Express', 'YT5555666677', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Order 5: Paid (new order)
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, created_at) VALUES
('ORD20260423001', @buyer2_id, @merchant3_id, @product5_id, 3, 45.00, '已支付', '已支付', NOW(), NOW());

-- Order 6: Pre-order (strawberries)
INSERT INTO orders (order_no, buyer_id, merchant_id, product_id, quantity, total_price, status, payment_status, paid_at, created_at) VALUES
('ORD20260423002', @buyer1_id, @merchant3_id, @product5_id, 2, 40.00, '已支付', '已支付', NOW(), NOW());

SELECT 'Orders created' AS status;

-- =============================================
-- 4. Projects
-- =============================================

INSERT INTO projects (name, description, area, expected_yield, price, location, contact_person, contact_info, status, user_id, created_at) VALUES
('Organic Vegetable Base Cooperation', 'Seeking partners to jointly develop 50 mu organic vegetable planting base. We provide land and facilities, hoping experienced agricultural enterprises or individuals to join, profit sharing.', 50, 100000, 50000.00, 'Liangyuan District, Shangqiu', 'Mr. Zhang', '13800138001', '招募中', @merchant1_id, DATE_SUB(NOW(), INTERVAL 20 DAY)),
('Grain Storage Cooperation Project', 'Jinsui Cooperative new granary, seeking grain storage partners, providing storage facilities and sales channels, revenue shared proportionally.', 200, 500000, 100000.00, 'Suiyang District, Shangqiu', 'Mr. Li', '13800138002', '招募中', @merchant2_id, DATE_SUB(NOW(), INTERVAL 15 DAY)),
('Fruit Picking Garden Development', 'Mountain Orchard plans to develop 20 mu picking garden, planting cherries, blueberries and other high-end fruits, seeking investment partners.', 20, 30000, 30000.00, 'Minquan County, Shangqiu', 'Mr. Wang', '13800138003', '招募中', @merchant3_id, DATE_SUB(NOW(), INTERVAL 10 DAY));

SELECT 'Projects created' AS status;

-- =============================================
-- 5. Bids
-- =============================================

SET @project1_id = (SELECT id FROM projects WHERE name LIKE '%Organic Vegetable%');
SET @project2_id = (SELECT id FROM projects WHERE name LIKE '%Grain Storage%');
SET @project3_id = (SELECT id FROM projects WHERE name LIKE '%Fruit Picking%');

INSERT INTO bids (project_id, buyer_id, amount, contact, phone, status, created_at) VALUES
(@project1_id, @buyer1_id, 30000.00, 'Zhang San', '13900139001', '待处理', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@project1_id, @buyer2_id, 40000.00, 'Li Si', '13900139002', '待处理', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@project2_id, @buyer1_id, 80000.00, 'Zhang San', '13900139001', '已接受', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@project2_id, @buyer3_id, 60000.00, 'Wang Wu', '13900139003', '已拒绝', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(@project3_id, @buyer2_id, 25000.00, 'Li Si', '13900139002', '待处理', DATE_SUB(NOW(), INTERVAL 2 DAY));

SELECT 'Bids created' AS status;

-- =============================================
-- 6. Messages
-- =============================================

INSERT INTO messages (sender_id, sender_type, sender_name, receiver_id, receiver_type, receiver_name, title, content, type, related_id, related_type, created_at) VALUES
(NULL, 'system', 'System', @buyer1_id, 'specific_user', 'Zhang San', 'Order Confirmed Receipt', 'Your order (Order No: ORD20260420001) has been confirmed receipt!', 'order', (SELECT id FROM orders WHERE order_no='ORD20260420001'), 'Order', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(NULL, 'system', 'System', @merchant1_id, 'specific_merchant', 'Green Field Farm', 'Order Completed', 'Order (Order No: ORD20260420001) has been confirmed receipt by buyer!', 'order', (SELECT id FROM orders WHERE order_no='ORD20260420001'), 'Order', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(NULL, 'system', 'System', @buyer1_id, 'specific_user', 'Zhang San', 'Order Shipped', 'Your order (Order No: ORD20260421001) has been shipped! Logistics: ZTO Express, Tracking: ZT9876543210', 'order', (SELECT id FROM orders WHERE order_no='ORD20260421001'), 'Order', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(NULL, 'system', 'System', @buyer3_id, 'specific_user', 'Wang Wu', 'Return Request Submitted', 'Your return request has been submitted, awaiting merchant review.', 'order', (SELECT id FROM orders WHERE order_no='ORD20260419001'), 'Order', DATE_SUB(NOW(), INTERVAL 1 DAY));

SELECT 'Messages created' AS status;

-- =============================================
-- 7. Update inventory and sales
-- =============================================

UPDATE products SET stock = 490, sales_count = 166 WHERE name = 'Fresh Organic Tomatoes';
UPDATE products SET stock = 195, sales_count = 95 WHERE name = 'Free-range Eggs';
UPDATE products SET stock = 980, sales_count = 587 WHERE name = 'Premium Wheat Flour';
UPDATE products SET stock = 792, sales_count = 468 WHERE name = 'Fresh Fuji Apples';

SELECT '========================================' AS '';
SELECT 'Test data created successfully!' AS status;
SELECT '========================================' AS '';
