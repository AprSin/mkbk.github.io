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

async function addField() {
  try {
    console.log('开始添加 status_before_return 字段...')

    // 测试连接
    await sequelize.authenticate()
    console.log('数据库连接成功')

    // 获取查询接口
    const queryInterface = sequelize.getQueryInterface()

    // 检查字段是否已存在
    const tableInfo = await queryInterface.describeTable('orders')

    // 添加 status_before_return 字段
    if (!tableInfo.status_before_return) {
      await queryInterface.addColumn('orders', 'status_before_return', {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '申请退单前的订单状态'
      })
      console.log('✓ 添加字段: status_before_return')
    } else {
      console.log('✓ 字段已存在: status_before_return')
    }

    console.log('\n字段添加完成！')
    await sequelize.close()
    process.exit(0)
  } catch (error) {
    console.error('添加字段失败:', error)
    await sequelize.close()
    process.exit(1)
  }
}

addField()
