# Navicat 数据库操作指南

## 项目信息
- **数据库名称**: `mkbk`
- **连接名称**: `mkbk`
- **密码**: `123456`

---

## 一、创建数据库连接

### 1. 新建连接
1. 打开 Navicat
2. 点击左上角 **"连接"** → 选择 **"MySQL"**
3. 填写连接信息：
   - **连接名**: `mkbk` (或自定义)
   - **主机**: `localhost` (或你的MySQL服务器IP)
   - **端口**: `3306`
   - **用户名**: `root` (或你的MySQL用户名)
   - **密码**: `123456`
4. 点击 **"测试连接"** 确认连接成功
5. 点击 **"确定"** 保存连接

---

## 二、创建数据库

### 方法一：使用 SQL 脚本（推荐）

1. 在 Navicat 中双击打开 `mkbk` 连接
2. 右键点击连接名 → 选择 **"新建数据库"**
3. 填写信息：
   - **数据库名**: `mkbk`
   - **字符集**: `utf8mb4`
   - **排序规则**: `utf8mb4_unicode_ci`
4. 点击 **"确定"**

### 方法二：直接运行 SQL 文件

1. 在 Navicat 中右键点击 `mkbk` 连接
2. 选择 **"运行 SQL 文件..."**
3. 选择文件：`server/database/mkbk_database.sql`
4. 点击 **"开始"** 执行脚本

---

## 三、数据库表结构说明

### 1. users (用户表)
存储平台所有用户信息（买家、商家、管理员）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一 |
| email | VARCHAR(100) | 邮箱，唯一 |
| phone | VARCHAR(20) | 手机号 |
| password | VARCHAR(255) | 密码哈希 |
| role | ENUM | 角色：admin/user/guest |
| account_type | ENUM | 账户类型：merchant/buyer/admin |
| name | VARCHAR(100) | 真实姓名 |
| address | VARCHAR(255) | 地址 |
| business_license | VARCHAR(100) | 营业执照编号 |
| business_scope | TEXT | 经营范围 |
| is_active | TINYINT | 是否激活 |
| last_login_at | DATETIME | 最后登录时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted_at | DATETIME | 删除时间（软删除） |

### 2. products (农产品表)
存储农产品信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(200) | 产品名称 |
| description | TEXT | 产品描述 |
| price | DECIMAL(10,2) | 价格 |
| stock | INT | 库存数量 |
| origin | VARCHAR(100) | 产地 |
| image | VARCHAR(500) | 产品图片URL |
| status | ENUM | 状态：在售/已售罄/下架 |
| category | VARCHAR(50) | 分类 |
| user_id | INT | 商家ID（外键） |
| view_count | INT | 浏览次数 |
| sales_count | INT | 销售数量 |

### 3. projects (项目表)
存储农村产权项目（宅基地、厂房等）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(200) | 项目名称 |
| description | TEXT | 项目描述 |
| price | DECIMAL(15,2) | 价格 |
| location | VARCHAR(255) | 位置 |
| area | VARCHAR(100) | 面积 |
| type | VARCHAR(50) | 项目类型 |
| status | ENUM | 状态：交易中/已完成/已取消 |
| bid_end_date | DATETIME | 投标截止日期 |
| contact_person | VARCHAR(100) | 联系人 |
| contact_info | VARCHAR(100) | 联系方式 |
| user_id | INT | 发布者ID（外键） |
| view_count | INT | 浏览次数 |
| bid_count | INT | 投标人数 |
| attachments | JSON | 附件列表 |

### 4. orders (订单表)
存储农产品订单信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| order_no | VARCHAR(50) | 订单编号 |
| buyer_id | INT | 买家ID（外键） |
| merchant_id | INT | 商家ID（外键） |
| product_id | INT | 产品ID（外键） |
| quantity | INT | 购买数量 |
| total_price | DECIMAL(10,2) | 总价 |
| status | ENUM | 订单状态 |
| payment_status | ENUM | 支付状态 |
| logistics_company | VARCHAR(100) | 物流公司 |
| tracking_number | VARCHAR(100) | 物流单号 |
| remark | TEXT | 备注 |
| return_reason | TEXT | 退单原因 |
| return_quantity | INT | 退单数量 |
| return_status | ENUM | 退单状态 |
| paid_at | DATETIME | 支付时间 |
| shipped_at | DATETIME | 发货时间 |
| completed_at | DATETIME | 完成时间 |

### 5. carts (购物车表)
存储用户购物车信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 用户ID（外键） |
| product_id | INT | 产品ID（外键） |
| quantity | INT | 数量 |

### 6. bids (投标表)
存储项目投标信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| project_id | INT | 项目ID（外键） |
| buyer_id | INT | 投标人ID（外键） |
| amount | DECIMAL(15,2) | 投标金额 |
| contact | VARCHAR(100) | 联系人 |
| phone | VARCHAR(20) | 联系电话 |
| status | ENUM | 投标状态 |
| reject_reason | TEXT | 拒绝原因 |
| bid_date | DATETIME | 投标日期 |

### 7. messages (消息表)
存储系统消息和用户消息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| sender_id | INT | 发送者ID |
| sender_type | ENUM | 发送者类型 |
| sender_name | VARCHAR(100) | 发送者名称 |
| receiver_id | INT | 接收者ID |
| receiver_type | ENUM | 接收者类型 |
| receiver_name | VARCHAR(100) | 接收者名称 |
| title | VARCHAR(200) | 消息标题 |
| content | TEXT | 消息内容 |
| type | ENUM | 消息类型 |
| is_read | TINYINT | 是否已读 |
| related_id | INT | 关联ID |
| related_type | VARCHAR(50) | 关联类型 |
| expires_at | DATETIME | 过期时间 |

### 8. data_logs (数据日志表)
存储数据操作日志

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 操作用户ID |
| action | ENUM | 操作类型 |
| entity_type | VARCHAR(50) | 实体类型 |
| entity_id | INT | 实体ID |
| changes | JSON | 变更内容 |
| old_data | JSON | 变更前数据 |
| new_data | JSON | 变更后数据 |
| ip_address | VARCHAR(45) | IP地址 |
| user_agent | VARCHAR(500) | 用户代理 |
| request_id | VARCHAR(100) | 请求ID |

---

## 四、表关系图

```
users (用户)
  ├── products (农产品) [1:N]
  ├── projects (项目) [1:N]
  ├── orders (订单) [1:N] 作为买家
  ├── orders (订单) [1:N] 作为商家
  ├── carts (购物车) [1:N]
  ├── bids (投标) [1:N]
  ├── messages (消息) [1:N] 作为发送者
  ├── messages (消息) [1:N] 作为接收者
  └── data_logs (日志) [1:N]

products (农产品)
  ├── orders (订单) [1:N]
  └── carts (购物车) [1:N]

projects (项目)
  └── bids (投标) [1:N]
```

---

## 五、常用 SQL 查询示例

### 1. 查询所有商家
```sql
SELECT * FROM users WHERE account_type = 'merchant';
```

### 2. 查询在售农产品
```sql
SELECT p.*, u.username as seller_name 
FROM products p 
JOIN users u ON p.user_id = u.id 
WHERE p.status = '在售';
```

### 3. 查询用户的订单
```sql
SELECT o.*, p.name as product_name, u.username as merchant_name
FROM orders o
LEFT JOIN products p ON o.product_id = p.id
LEFT JOIN users u ON o.merchant_id = u.id
WHERE o.buyer_id = 1;
```

### 4. 查询项目的投标记录
```sql
SELECT b.*, u.username as bidder_name
FROM bids b
JOIN users u ON b.buyer_id = u.id
WHERE b.project_id = 1
ORDER BY b.amount DESC;
```

### 5. 查询未读消息
```sql
SELECT * FROM messages 
WHERE receiver_id = 1 AND is_read = 0
ORDER BY created_at DESC;
```

---

## 六、注意事项

1. **字符集**: 数据库使用 `utf8mb4` 以支持完整的 Unicode 字符（包括 emoji）
2. **软删除**: 所有表都支持软删除（deleted_at 字段），删除数据时请使用软删除
3. **外键约束**: 表之间建立了外键关系，删除父表数据时请注意子表数据
4. **索引优化**: 已为常用查询字段创建索引，提高查询性能
5. **JSON 字段**: `attachments`、`changes`、`old_data`、`new_data` 字段使用 JSON 类型存储

---

## 七、后端配置修改

将后端数据库配置从 SQLite 切换到 MySQL：

1. 打开 `server/src/config/database.js`
2. 替换为 MySQL 配置（参考 `server/database/mysql-config.js`）
3. 安装 MySQL 依赖：
   ```bash
   cd server
   npm install mysql2
   ```
4. 重启服务器
