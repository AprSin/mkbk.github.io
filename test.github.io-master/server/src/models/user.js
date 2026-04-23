const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const { hashPassword } = require('../utils/helpers')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^1[3-9]\d{9}$/
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'guest'),
    defaultValue: 'user'
  },
  accountType: {
    type: DataTypes.ENUM('merchant', 'buyer', 'admin'),
    defaultValue: 'buyer'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  realName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '真实姓名'
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
    comment: '身份证号'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  businessLicense: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '营业执照编号'
  },
  businessScope: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '经营范围'
  },
  companyPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '企业联系电话'
  },
  companyAddress: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '企业地址'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['username'] },
    { unique: true, fields: ['email'] },
    { fields: ['role'] },
    { fields: ['account_type'] },
    { fields: ['is_active'] }
  ]
})

User.beforeCreate(async (user) => {
  user.password = await hashPassword(user.password)
})

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await hashPassword(user.password)
  }
})

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get())
  delete values.password
  return values
}

User.prototype.comparePassword = async function(password) {
  const { verifyPassword } = require('../utils/helpers')
  return verifyPassword(password, this.password)
}

module.exports = { User }