const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  origin: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('待审核', '在售', '已售罄', '下架'),
    defaultValue: '待审核'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shippingTime: {
    type: DataTypes.ENUM('24小时内发货', '3天内发货', '15天内发货', '预售'),
    defaultValue: '24小时内发货',
    allowNull: false,
    comment: '发货时间：24小时内发货、3天内发货、15天内发货、预售'
  }
}, {
  tableName: 'products',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['status'] },
    { fields: ['user_id'] },
    { fields: ['category'] },
    { fields: ['price'] },
    { fields: ['created_at'] }
  ]
})

module.exports = { Product }