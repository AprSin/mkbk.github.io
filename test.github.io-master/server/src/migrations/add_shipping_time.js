const { sequelize, dbType } = require('../config/database')

async function addShippingTimeField() {
  try {
    console.log('开始添加 shipping_time 字段到 products 表...')
    console.log('数据库类型:', dbType)

    if (dbType === 'sqlite') {
      // SQLite 语法
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN shipping_time VARCHAR(20) DEFAULT '24小时内发货'
      `)
    } else {
      // MySQL 语法
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN shipping_time ENUM('24小时内发货', '3天内发货', '15天内发货', '预售') 
        DEFAULT '24小时内发货' 
        COMMENT '发货时间：24小时内发货、3天内发货、15天内发货、预售'
      `)
    }

    console.log('✓ shipping_time 字段添加成功')
    process.exit(0)
  } catch (error) {
    if (error.message.includes('Duplicate column') || error.message.includes('already exists') || error.message.includes('duplicate column')) {
      console.log('✓ shipping_time 字段已存在')
      process.exit(0)
    }
    console.error('添加字段失败:', error.message)
    process.exit(1)
  }
}

addShippingTimeField()
