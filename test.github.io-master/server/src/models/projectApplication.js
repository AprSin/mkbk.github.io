const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProjectApplication = sequelize.define('ProjectApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('publish', 'modify'),
    allowNull: false,
    comment: '申请类型：publish-发布申请, modify-修改申请'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '申请状态：pending-待审核, approved-已通过, rejected-已驳回'
  },
  applicantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '申请人ID'
  },
  applicantName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '申请人名称'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联项目ID（修改申请时必填）'
  },
  projectName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '项目名称'
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '申请内容（项目详细信息）'
  },
  requestedData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '申请修改的数据内容（与农产品流程一致）'
  },
  // 原始数据备份（修改申请时使用）
  originalData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '修改前的原始数据备份'
  },
  // 修改的字段列表（修改申请时使用）
  changedFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '发生变更的字段列表'
  },
  reviewComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核意见'
  },
  rejectionReason: {
    type: DataTypes.ENUM('信息不完整', '价格不合理', '违反平台规则', '其他'),
    allowNull: true,
    comment: '驳回原因类型'
  },
  rejectionDetail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '驳回详细原因（当rejectionReason为其他时必填）'
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
  tableName: 'project_applications',
  timestamps: true,
  paranoid: true
})

module.exports = { ProjectApplication }
