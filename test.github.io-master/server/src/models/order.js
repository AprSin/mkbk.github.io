const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  merchantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('已支付', '待发货', '待收货', '已完成', '已取消', '退单中', '已退单'),
    defaultValue: '已支付'
  },
  paymentStatus: {
    type: DataTypes.ENUM('未支付', '已支付', '已退款'),
    defaultValue: '已支付'
  },
  logisticsCompany: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  returnReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '退单原因'
  },
  returnQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '退单数量'
  },
  returnStatus: {
    type: DataTypes.ENUM('无', '申请中', '已批准', '已拒绝'),
    defaultValue: '无'
  },
  returnRefundMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '退款方式'
  },
  returnImages: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '退货凭证图片，JSON数组格式'
  },
  returnLogisticsCompany: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '退货物流公司'
  },
  returnLogisticsNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '退货运单号'
  },
  returnShipped: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已发货退货'
  },
  returnShippedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '退货发货时间'
  },
  returnRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '退货申请时间'
  },
  statusBeforeReturn: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '申请退单前的订单状态'
  },
  returnType: {
    type: DataTypes.ENUM('退货退款', '仅退款'),
    allowNull: true,
    comment: '退货申请类型：退货退款或仅退款'
  },
  returnApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '退货申请是否已批准'
  },
  returnApprovedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '退货批准时间'
  },
  returnRejected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '退货申请是否已拒绝'
  },
  returnRejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '退货拒绝时间'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shippedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // deliveredAt: {
  //   type: DataTypes.DATE,
  //   allowNull: true,
  //   comment: '送达时间（确认收货时间）'
  // },
  // logisticsStatus: {
  //   type: DataTypes.ENUM('未发货', '已发货', '运输中', '已签收', '已退回'),
  //   defaultValue: '未发货',
  //   comment: '物流状态'
  // },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  autoConfirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为系统自动确认收货'
  },
  autoConfirmScheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '自动确认收货的计划时间（发货后14天）'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['order_no'] },
    { fields: ['buyer_id'] },
    { fields: ['merchant_id'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['created_at'] }
  ]
})

module.exports = { Order }