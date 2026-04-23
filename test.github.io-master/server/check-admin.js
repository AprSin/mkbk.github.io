/**
 * 检查管理员账号脚本
 */

const { sequelize } = require('./src/config/database')
const { User } = require('./src/models')

async function checkAdmin() {
  try {
    await sequelize.authenticate()
    console.log('数据库连接成功\n')

    // 查找所有管理员账号
    const admins = await User.findAll({
      where: {
        role: 'admin'
      },
      attributes: ['id', 'username', 'email', 'role', 'accountType'],
      raw: true
    })

    console.log('管理员账号列表:')
    console.table(admins)

    // 查找所有用户
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'accountType'],
      raw: true
    })

    console.log('\n所有用户列表:')
    console.table(allUsers)

  } catch (error) {
    console.error('查询失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

checkAdmin()
