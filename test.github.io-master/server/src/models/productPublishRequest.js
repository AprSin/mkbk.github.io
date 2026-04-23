const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProductPublishRequest = sequelize.define('ProductPublishRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '申请状态：pending-待审核, approved-已通过, rejected-已驳回'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商户ID'
  },
  merchantName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商户名称'
  },
  productName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '农产品名称'
  },
  productData: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '申请的农产品完整信息'
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
  reviewerName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '审核人名称'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  }
}, {
  tableName: 'product_publish_requests',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['merchantId'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
})

module.exports = { ProductPublishRequest }