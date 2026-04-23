const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const DataLog = sequelize.define('DataLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作用户ID'
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW'),
    allowNull: false,
    comment: '操作类型'
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '实体类型：Product, Project, Order, Bid, User等'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '实体ID'
  },
  changes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更内容 {field: [oldValue, newValue]}'
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更前数据快照'
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更后数据快照'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP地址'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '用户代理'
  },
  requestId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '请求ID用于追踪'
  }
}, {
  tableName: 'data_logs',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['action'] },
    { fields: ['created_at'] }
  ]
})

module.exports = { DataLog }