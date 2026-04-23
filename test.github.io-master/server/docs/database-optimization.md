# 数据库性能优化文档

## 一、索引优化

### 1.1 现有索引

| 表名 | 索引字段 | 类型 | 说明 |
|------|---------|------|------|
| users | username | UNIQUE | 用户名唯一索引 |
| users | email | UNIQUE | 邮箱唯一索引 |
| users | role | INDEX | 角色查询 |
| users | account_type | INDEX | 账户类型查询 |
| users | is_active | INDEX | 活跃状态查询 |
| products | name | INDEX | 商品名称搜索 |
| products | status | INDEX | 商品状态筛选 |
| products | user_id | INDEX | 商户商品查询 |
| products | category | INDEX | 分类筛选 |
| products | price | INDEX | 价格筛选 |
| products | created_at | INDEX | 时间排序 |
| orders | order_no | INDEX | 订单号查询 |
| orders | buyer_id | INDEX | 买家订单查询 |
| orders | merchant_id | INDEX | 商户订单查询 |
| orders | status | INDEX | 订单状态筛选 |
| orders | payment_status | INDEX | 支付状态筛选 |
| orders | created_at | INDEX | 时间排序 |
| carts | user_id | INDEX | 用户购物车 |
| carts | product_id | INDEX | 商品购物车 |
| carts | user_id_product_id | INDEX | 联合索引 |
| bids | project_id | INDEX | 项目投标查询 |
| bids | buyer_id | INDEX | 买家投标查询 |
| bids | status | INDEX | 投标状态筛选 |
| bids | bid_date | INDEX | 投标时间排序 |
| projects | name | INDEX | 项目名称搜索 |
| projects | status | INDEX | 项目状态筛选 |
| projects | user_id | INDEX | 商户项目查询 |
| projects | type | INDEX | 项目类型筛选 |
| projects | price | INDEX | 价格筛选 |
| projects | created_at | INDEX | 时间排序 |

### 1.2 复合索引建议

```sql
-- 订单查询优化（买家+状态）
ALTER TABLE orders ADD INDEX idx_buyer_status (buyer_id, status);

-- 订单查询优化（商户+状态）
ALTER TABLE orders ADD INDEX idx_merchant_status (merchant_id, status);

-- 购物车查询优化
ALTER TABLE carts ADD INDEX idx_user_product (user_id, product_id);

-- 商品搜索优化（商户+状态）
ALTER TABLE products ADD INDEX idx_merchant_status (user_id, status);
```

### 1.3 索引使用注意事项

1. **避免过多索引**: 每个索引都会增加写操作的开销
2. **遵循最左前缀原则**: 复合索引从左到右使用
3. **避免在区分度低的字段建索引**: 如is_active只有true/false

## 二、查询优化

### 2.1 分页优化

**低效分页 (OFFSET大时性能差)**:
```sql
SELECT * FROM orders ORDER BY created_at LIMIT 1000000, 20;
```

**优化方案 - 使用游标分页**:
```sql
-- 假设已知最后一条记录的created_at
SELECT * FROM orders
WHERE created_at < '2024-01-01 10:00:00'
ORDER BY created_at DESC
LIMIT 20;
```

### 2.2 预加载关联数据

**N+1查询问题**:
```javascript
// 不推荐 - N+1查询
const orders = await Order.findAll();
for (const order of orders) {
  order.buyer = await User.findByPk(order.buyerId);
}

// 推荐 - 使用include预加载
const orders = await Order.findAll({
  include: [
    { model: User, as: 'buyer' },
    { model: User, as: 'merchant' },
    { model: Product, as: 'product' }
  ]
});
```

### 2.3 避免SELECT *

```sql
-- 不推荐
SELECT * FROM products WHERE status = '在售';

-- 推荐 - 只查询需要的字段
SELECT id, name, price, stock FROM products WHERE status = '在售';
```

## 三、连接池配置

### 3.1 MySQL连接池参数

```javascript
pool: {
  max: 10,        // 最大连接数
  min: 2,         // 最小连接数
  acquire: 30000, // 获取连接超时(ms)
  idle: 10000,    // 空闲连接超时(ms)
  evict: 10000    // 连接回收间隔(ms)
}
```

### 3.2 配置建议

| 环境 | max | min | 说明 |
|------|-----|-----|------|
| 开发环境 | 5 | 0 | 轻量级开发 |
| 生产环境 | 20 | 5 | 高并发 |
| 高并发 | 50 | 10 | 峰值处理 |

## 四、数据库维护

### 4.1 定期优化表

```sql
-- 定期执行（每周一次）
OPTIMIZE TABLE products;
OPTIMIZE TABLE orders;
OPTIMIZE TABLE users;
```

### 4.2 分析表统计

```sql
-- 更新统计信息，帮助优化器选择最佳执行计划
ANALYZE TABLE products;
ANALYZE TABLE orders;
```

### 4.3 慢查询日志

在MySQL配置中启用:
```ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1
```

## 五、性能监控

### 5.1 关键监控指标

1. **QPS (Queries Per Second)**: 每秒查询数
2. **连接数**: 当前活跃连接数
3. **缓存命中率**: Query Cache命中率
4. **慢查询数量**: 执行时间超过1秒的查询

### 5.2 监控SQL

```sql
-- 查看当前连接数
SHOW STATUS LIKE 'Threads_connected';

-- 查看最大连接数
SHOW VARIABLES LIKE 'max_connections';

-- 查看缓存命中率
SHOW STATUS LIKE 'Qcache_hits';

-- 查看慢查询数量
SHOW STATUS LIKE 'Slow_queries';
```

## 六、数据归档策略

### 6.1 历史数据归档

对于已完成超过1年的订单，建议归档到历史表:

```sql
-- 创建历史订单表
CREATE TABLE orders_archive LIKE orders;

-- 归档历史数据
INSERT INTO orders_archive
SELECT * FROM orders
WHERE status = '已完成'
AND completed_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- 删除原表中的历史数据
DELETE FROM orders
WHERE status = '已完成'
AND completed_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### 6.2 定期清理

```sql
-- 清理超过3年的已删除数据（软删除）
DELETE FROM products WHERE deleted_at < DATE_SUB(NOW(), INTERVAL 3 YEAR);

-- 清理超过1年的登录日志
DELETE FROM users WHERE last_login_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```