USE cloud_prosperity;

DELETE FROM bids WHERE buyer_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE username LIKE 'test_%') OR merchant_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM products WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test_%');
DELETE FROM users WHERE username LIKE 'test_%';

INSERT INTO users (username, password, email, phone, role, account_type, name, real_name, address, business_scope, company_phone, company_address, is_active, created_at, updated_at) VALUES
('test_merchant1', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant1@example.com', '13800138001', 'user', 'merchant', 'lvye farm', 'zhang jianguo', 'henan shangqiu', 'vegetable', '0370-1234567', 'henan shangqiu', 1, NOW(), NOW()),
('test_merchant2', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant2@example.com', '13800138002', 'user', 'merchant', 'jinsui cooperative', 'li xiuying', 'henan shangqiu', 'grain', '0370-2345678', 'henan shangqiu', 1, NOW(), NOW()),
('test_merchant3', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'merchant3@example.com', '13800138003', 'user', 'merchant', 'mountain orchard', 'wang zhiqiang', 'henan shangqiu', 'fruit', '0370-3456789', 'henan shangqiu', 1, NOW(), NOW());

INSERT INTO users (username, password, email, phone, role, account_type, name, real_name, address, is_active, created_at, updated_at) VALUES
('test_buyer1', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer1@example.com', '13900139001', 'user', 'buyer', 'zhang san', 'zhang san', 'henan zhengzhou', 1, NOW(), NOW()),
('test_buyer2', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer2@example.com', '13900139002', 'user', 'buyer', 'li si', 'li si', 'henan kaifeng', 1, NOW(), NOW()),
('test_buyer3', '$2a$10$X5M7K8X5Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9', 'buyer3@example.com', '13900139003', 'user', 'buyer', 'wang wu', 'wang wu', 'henan luoyang', 1, NOW(), NOW());
