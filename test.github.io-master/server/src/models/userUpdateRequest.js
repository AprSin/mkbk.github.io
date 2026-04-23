const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const UserUpdateRequest = sequelize.define('UserUpdateRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '申请用户ID'
  },
  userType: {
    type: DataTypes.ENUM('buyer', 'merchant'),
    allowNull: false,
    comment: '用户类型'
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '用户名'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '申请状态：pending-待审核, approved-已通过, rejected-已驳回'
  },
  // 原始数据备份
  originalData: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '修改前的原始数据备份'
  },
  // 申请修改的数据
  requestedData: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '申请修改的数据内容'
  },
  // 修改的字段列表
  changedFields: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '发生变更的字段列表'
  },
  // 审核信息
  reviewComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核备注'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '审核人ID'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  }
}, {
  tableName: 'user_update_requests',
  timestamps: true,
  paranoid: true
})

module.exports = { UserUpdateRequest }
