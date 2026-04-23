const { DataTypes } = require('sequelize')
const { Sequelize } = require('sequelize')

// 强制使用 MySQL
const sequelize = new Sequelize(
  'cloud_prosperity',
  'root',
  '123456',
  {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
    }
  }
)

async function addFields() {
  try {
    console.log('开始添加退货流程相关字段...')

    // 测试连接
    await sequelize.authenticate()
    console.log('数据库连接成功')

    // 获取查询接口
    const queryInterface = sequelize.getQueryInterface()

    // 检查字段是否已存在
    const tableInfo = await queryInterface.describeTable('orders')

    // 添加 return_type 字段
    if (!tableInfo.return_type) {
      await queryInterface.addColumn('orders', 'return_type', {
        type: DataTypes.ENUM('退货退款', '仅退款'),
        allowNull: true,
        comment: '退货申请类型：退货退款或仅退款'
      })
      console.log('✓ 添加字段: return_type')
    } else {
      console.log('✓ 字段已存在: return_type')
    }

    // 添加 return_approved 字段
    if (!tableInfo.return_approved) {
      await queryInterface.addColumn('orders', 'return_approved', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '退货申请是否已批准'
      })
      console.log('✓ 添加字段: return_approved')
    } else {
      console.log('✓ 字段已存在: return_approved')
    }

    // 添加 return_approved_at 字段
    if (!tableInfo.return_approved_at) {
      await queryInterface.addColumn('orders', 'return_approved_at', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '退货批准时间'
      })
      console.log('✓ 添加字段: return_approved_at')
    } else {
      console.log('✓ 字段已存在: return_approved_at')
    }

    // 添加 return_rejected 字段
    if (!tableInfo.return_rejected) {
      await queryInterface.addColumn('orders', 'return_rejected', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '退货申请是否已拒绝'
      })
      console.log('✓ 添加字段: return_rejected')
    } else {
      console.log('✓ 字段已存在: return_rejected')
    }

    // 添加 return_rejected_at 字段
    if (!tableInfo.return_rejected_at) {
      await queryInterface.addColumn('orders', 'return_rejected_at', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '退货拒绝时间'
      })
      console.log('✓ 添加字段: return_rejected_at')
    } else {
      console.log('✓ 字段已存在: return_rejected_at')
    }

    console.log('\n所有字段添加完成！')
    await sequelize.close()
    process.exit(0)
  } catch (error) {
    console.error('添加字段失败:', error)
    await sequelize.close()
    process.exit(1)
  }
}

addFields()
