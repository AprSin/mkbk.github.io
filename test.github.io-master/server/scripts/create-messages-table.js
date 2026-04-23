/**
 * 创建消息表
 */

require('dotenv').config()
const { sequelize } = require('../src/config/database')

async function createMessagesTable() {
  try {
    console.log('创建消息表...')

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sender_id INT NULL COMMENT '发送者ID',
        sender_type ENUM('admin', 'system', 'user') DEFAULT 'admin',
        sender_name VARCHAR(100) NULL,
        receiver_id INT NULL COMMENT '接收者ID',
        receiver_type ENUM('all_users', 'all_merchants', 'specific_user', 'specific_merchant', 'admin') DEFAULT 'specific_user',
        receiver_name VARCHAR(100) NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        type ENUM('system', 'order', 'product', 'account', 'return', 'bid', 'custom') DEFAULT 'custom',
        is_read BOOLEAN DEFAULT FALSE,
        related_id INT NULL,
        related_type VARCHAR(50) NULL,
        expires_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_receiver (receiver_id),
        INDEX idx_sender (sender_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    console.log('消息表创建成功！')
    process.exit(0)
  } catch (error) {
    console.error('创建失败:', error)
    process.exit(1)
  }
}

createMessagesTable()
