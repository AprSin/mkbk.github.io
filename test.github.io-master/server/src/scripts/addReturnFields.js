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

async function addReturnFields() {
  try {
    console.log('开始添加退货相关字段...')
    console.log('数据库: cloud_prosperity')

    // 测试连接
    await sequelize.authenticate()
    console.log('数据库连接成功')

    // 获取查询接口
    const queryInterface = sequelize.getQueryInterface()

    // 检查字段是否已存在
    const tableInfo = await queryInterface.describeTable('orders')
    console.log('找到 orders 表，现有字段:', Object.keys(tableInfo))

    // 添加 return_refund_method 字段
    if (!tableInfo.return_refund_method) {
      await queryInterface.addColumn('orders', 'return_refund_method', {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '退款方式'
      })
      console.log('✓ 添加字段: return_refund_method')
    } else {
      console.log('✓ 字段已存在: return_refund_method')
    }

    // 添加 return_images 字段
    if (!tableInfo.return_images) {
      await queryInterface.addColumn('orders', 'return_images', {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '退货凭证图片，JSON数组格式'
      })
      console.log('✓ 添加字段: return_images')
    } else {
      console.log('✓ 字段已存在: return_images')
    }

    // 添加 return_logistics_company 字段
    if (!tableInfo.return_logistics_company) {
      await queryInterface.addColumn('orders', 'return_logistics_company', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '退货物流公司'
      })
      console.log('✓ 添加字段: return_logistics_company')
    } else {
      console.log('✓ 字段已存在: return_logistics_company')
    }

    // 添加 return_logistics_number 字段
    if (!tableInfo.return_logistics_number) {
      await queryInterface.addColumn('orders', 'return_logistics_number', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '退货运单号'
      })
      console.log('✓ 添加字段: return_logistics_number')
    } else {
      console.log('✓ 字段已存在: return_logistics_number')
    }

    // 添加 return_shipped 字段
    if (!tableInfo.return_shipped) {
      await queryInterface.addColumn('orders', 'return_shipped', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否已发货退货'
      })
      console.log('✓ 添加字段: return_shipped')
    } else {
      console.log('✓ 字段已存在: return_shipped')
    }

    // 添加 return_shipped_at 字段
    if (!tableInfo.return_shipped_at) {
      await queryInterface.addColumn('orders', 'return_shipped_at', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '退货发货时间'
      })
      console.log('✓ 添加字段: return_shipped_at')
    } else {
      console.log('✓ 字段已存在: return_shipped_at')
    }

    // 添加 return_requested_at 字段
    if (!tableInfo.return_requested_at) {
      await queryInterface.addColumn('orders', 'return_requested_at', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '退货申请时间'
      })
      console.log('✓ 添加字段: return_requested_at')
    } else {
      console.log('✓ 字段已存在: return_requested_at')
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

addReturnFields()
