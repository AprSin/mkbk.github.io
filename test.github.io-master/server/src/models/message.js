const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '发送者ID，NULL表示系统消息'
  },
  senderType: {
    type: DataTypes.ENUM('admin', 'system', 'user'),
    defaultValue: 'admin',
    comment: '发送者类型'
  },
  senderName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '发送者名称'
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '接收者ID，NULL表示全体'
  },
  receiverType: {
    type: DataTypes.ENUM('all_users', 'all_merchants', 'specific_user', 'specific_merchant', 'admin'),
    defaultValue: 'specific_user',
    comment: '接收者类型'
  },
  receiverName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '接收者名称'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '消息标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  type: {
    type: DataTypes.ENUM('system', 'order', 'product', 'account', 'return', 'bid', 'custom'),
    defaultValue: 'custom',
    comment: '消息类型'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已读'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联ID（如订单ID、农产品ID等）'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联类型'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['receiver_id'] },
    { fields: ['sender_id'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] }
  ]
})

module.exports = { Message }
