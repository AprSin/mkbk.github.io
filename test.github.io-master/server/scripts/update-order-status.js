/**
 * 更新订单状态枚举，将 '待付款' 改为 '已支付'
 */

require('dotenv').config()
const { sequelize } = require('../src/config/database')

async function updateOrderStatus() {
  try {
    console.log('开始更新订单状态...')
    console.log('数据库类型:', process.env.DB_TYPE || 'sqlite')

    const dbType = process.env.DB_TYPE || 'sqlite'
    
    if (dbType === 'mysql') {
      // MySQL: 先修改 ENUM 包含新值
      console.log('修改 ENUM 类型...')
      await sequelize.query(`
        ALTER TABLE orders 
        MODIFY COLUMN status ENUM('待付款', '已支付', '待发货', '待收货', '已完成', '已取消', '退单中', '已退单') 
        DEFAULT '已支付'
      `)
      console.log('订单 status 字段 ENUM 已扩展')
    }

    // 1. 修改现有订单状态 (MySQL 使用下划线命名)
    console.log('更新订单数据...')
    await sequelize.query(`
      UPDATE orders 
      SET status = '已支付', 
          payment_status = '已支付',
          paid_at = COALESCE(paid_at, created_at)
      WHERE status = '待付款'
    `)
    console.log('已更新现有订单状态')

    if (dbType === 'mysql') {
      // MySQL: 最后移除旧的 ENUM 值
      console.log('移除旧的 ENUM 值...')
      await sequelize.query(`
        ALTER TABLE orders 
        MODIFY COLUMN status ENUM('已支付', '待发货', '待收货', '已完成', '已取消', '退单中', '已退单') 
        DEFAULT '已支付'
      `)
      console.log('订单 status 字段 ENUM 已更新')

      // 修改 payment_status 字段默认值
      await sequelize.query(`
        ALTER TABLE orders 
        MODIFY COLUMN payment_status ENUM('未支付', '已支付', '已退款') 
        DEFAULT '已支付'
      `)
      console.log('订单 payment_status 字段默认值已更新')
    } else {
      // SQLite 不需要修改 ENUM，直接更新数据即可
      console.log('SQLite 数据库：数据已更新，ENUM 约束将在应用层处理')
    }

    console.log('订单状态更新完成！')
    process.exit(0)
  } catch (error) {
    console.error('更新订单状态失败:', error)
    process.exit(1)
  }
}

updateOrderStatus()
