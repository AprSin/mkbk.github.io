/**
 * MySQL 数据库配置文件
 * 用于替换原有的 SQLite 配置
 */

const { Sequelize } = require('sequelize')

// MySQL 连接配置
// 请根据实际情况修改以下配置
const sequelize = new Sequelize('mkbk', 'root', '123456', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true
  }
})

// 测试连接
const testConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('MySQL 数据库连接成功！')
  } catch (error) {
    console.error('无法连接到 MySQL 数据库:', error.message)
  }
}

module.exports = {
  sequelize,
  testConnection
}
