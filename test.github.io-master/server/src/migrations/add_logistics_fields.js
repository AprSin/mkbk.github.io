const { sequelize, dbType } = require('../config/database')

async function addLogisticsFields() {
  try {
    console.log('开始添加物流相关字段...')
    console.log('数据库类型:', dbType)

    if (dbType === 'sqlite') {
      // SQLite 语法
      try {
        await sequelize.query(`
          ALTER TABLE orders 
          ADD COLUMN delivered_at DATETIME
        `)
        console.log('✓ delivered_at 字段添加成功')
      } catch (err) {
        if (err.message.includes('duplicate column')) {
          console.log('✓ delivered_at 字段已存在')
        } else {
          throw err
        }
      }

      try {
        await sequelize.query(`
          ALTER TABLE orders 
          ADD COLUMN logistics_status VARCHAR(20) DEFAULT '未发货'
        `)
        console.log('✓ logistics_status 字段添加成功')
      } catch (err) {
        if (err.message.includes('duplicate column')) {
          console.log('✓ logistics_status 字段已存在')
        } else {
          throw err
        }
      }
    } else {
      // MySQL 语法
      try {
        await sequelize.query(`
          ALTER TABLE orders 
          ADD COLUMN delivered_at DATETIME NULL COMMENT '送达时间（确认收货时间）'
        `)
        console.log('✓ delivered_at 字段添加成功')
      } catch (err) {
        if (err.message.includes('Duplicate column')) {
          console.log('✓ delivered_at 字段已存在')
        } else {
          throw err
        }
      }

      try {
        await sequelize.query(`
          ALTER TABLE orders 
          ADD COLUMN logistics_status ENUM('未发货', '已发货', '运输中', '已签收', '已退回') 
          DEFAULT '未发货' 
          COMMENT '物流状态'
        `)
        console.log('✓ logistics_status 字段添加成功')
      } catch (err) {
        if (err.message.includes('Duplicate column')) {
          console.log('✓ logistics_status 字段已存在')
        } else {
          throw err
        }
      }
    }

    console.log('物流字段添加完成！')
    process.exit(0)
  } catch (error) {
    console.error('添加字段失败:', error.message)
    process.exit(1)
  }
}

addLogisticsFields()
