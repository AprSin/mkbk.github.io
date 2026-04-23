/**
 * 更新 account_type ENUM
 */

require('dotenv').config()
const { sequelize } = require('../src/config/database')

async function updateEnum() {
  try {
    console.log('更新 account_type ENUM...')
    await sequelize.query(`
      ALTER TABLE users
      MODIFY COLUMN account_type ENUM('merchant', 'buyer', 'admin') DEFAULT 'buyer'
    `)
    console.log('ENUM 更新成功！')
    process.exit(0)
  } catch (error) {
    console.error('更新失败:', error)
    process.exit(1)
  }
}

updateEnum()
