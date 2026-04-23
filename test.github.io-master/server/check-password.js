/**
 * 检查密码脚本
 */

const { sequelize } = require('./src/config/database')
const { User } = require('./src/models')
const bcrypt = require('bcryptjs')

async function checkPassword() {
  try {
    await sequelize.authenticate()
    console.log('数据库连接成功\n')

    // 查找管理员
    const admin = await User.findOne({
      where: { username: 'admin' }
    })

    if (!admin) {
      console.log('管理员账号不存在')
      return
    }

    console.log('管理员信息:')
    console.log('  ID:', admin.id)
    console.log('  用户名:', admin.username)
    console.log('  邮箱:', admin.email)
    console.log('  密码哈希:', admin.password.substring(0, 30) + '...')

    // 测试常见密码
    const testPasswords = ['admin', 'admin123', '123456', '12345678', 'password', 'mkbk', 'wcAdmin123']

    console.log('\n测试密码:')
    for (const pwd of testPasswords) {
      const isMatch = await bcrypt.compare(pwd, admin.password)
      console.log(`  ${pwd}: ${isMatch ? '✓ 正确' : '✗ 错误'}`)
    }

  } catch (error) {
    console.error('查询失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

checkPassword()
