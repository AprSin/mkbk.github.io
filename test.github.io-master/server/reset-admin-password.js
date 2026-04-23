/**
 * 重置管理员密码脚本
 */

const { sequelize } = require('./src/config/database')
const { User } = require('./src/models')
const bcrypt = require('bcryptjs')

async function resetPassword() {
  try {
    await sequelize.authenticate()
    console.log('数据库连接成功\n')

    // 新密码
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新管理员密码
    const [updated] = await User.update(
      { password: hashedPassword },
      { where: { username: 'admin' } }
    )

    if (updated) {
      console.log('✓ 管理员密码重置成功')
      console.log('  用户名: admin')
      console.log('  新密码: admin123')
    } else {
      console.log('✗ 管理员账号不存在')
    }

  } catch (error) {
    console.error('重置失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

resetPassword()
