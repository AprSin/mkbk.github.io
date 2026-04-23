/**
 * 初始化管理员账号
 * 账户：wcAdmin
 * 密码：wcAdmin123
 */

require('dotenv').config()
const { sequelize } = require('../src/config/database')
const { User } = require('../src/models')

async function initAdmin() {
  try {
    console.log('开始初始化管理员账号...')

    // 检查管理员是否已存在
    const existingAdmin = await User.findOne({
      where: { username: 'wcAdmin' }
    })

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'wcAdmin'
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wcAdmin123'

    if (existingAdmin) {
      console.log('管理员账号已存在，正在更新密码...')
      // 直接设置明文密码，让 beforeUpdate 钩子处理加密
      await existingAdmin.update({
        password: ADMIN_PASSWORD,
        role: 'admin',
        accountType: 'admin',
        email: 'admin@cloudprosperity.com',
        phone: '13800138000',
        name: '系统管理员'
      })
      console.log('管理员密码已更新！')
    } else {
      console.log('创建管理员账号...')
      // 直接设置明文密码，让 beforeCreate 钩子处理加密
      await User.create({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        role: 'admin',
        accountType: 'admin',
        email: 'admin@cloudprosperity.com',
        phone: '13800138000',
        name: '系统管理员'
      })
      console.log('管理员账号创建成功！')
    }

    console.log('管理员账号初始化完成！')
    console.log('账户：wcAdmin')
    console.log('密码：wcAdmin123')
    process.exit(0)
  } catch (error) {
    console.error('初始化管理员账号失败:', error)
    process.exit(1)
  }
}

initAdmin()
