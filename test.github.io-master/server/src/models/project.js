const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Project = sequelize.define('Project', {
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
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  area: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '面积'
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '项目类型：宅基地、厂房等'
  },
  status: {
    type: DataTypes.ENUM('待审核', '交易中', '已完成', '已取消'),
    defaultValue: '待审核'
  },
  bidEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '投标截止日期'
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contactInfo: {
    type: DataTypes.STRING(100),
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
  bidCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '投标人数'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附件列表 [{name, url, size, type}]'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['status'] },
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['price'] },
    { fields: ['created_at'] }
  ]
})

module.exports = { Project }