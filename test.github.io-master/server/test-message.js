/**
 * 消息发送功能测试脚本
 */

const { sequelize } = require('./src/config/database')
const { Bid, Project, User, Message } = require('./src/models')

async function testMessageCreation() {
  console.log('=== 开始测试消息发送功能 ===\n')

  try {
    // 测试1: 检查数据库连接
    console.log('测试1: 检查数据库连接...')
    await sequelize.authenticate()
    console.log('✓ 数据库连接正常\n')

    // 测试2: 检查 Message 模型
    console.log('测试2: 检查 Message 模型...')
    const messageAttributes = Object.keys(Message.rawAttributes)
    console.log('Message 模型字段:', messageAttributes)
    console.log('✓ Message 模型定义正常\n')

    // 测试3: 检查数据库表是否存在
    console.log('测试3: 检查数据库表...')
    const [tables] = await sequelize.query('SHOW TABLES')
    console.log('数据库表列表:', tables.map(t => Object.values(t)[0]))
    console.log('✓ 数据库表查询正常\n')

    // 测试4: 创建测试消息
    console.log('测试4: 创建测试消息...')
    const testMessage = await Message.create({
      senderId: 1,
      senderType: 'user',
      senderName: '测试发送者',
      receiverId: 2,
      receiverType: 'specific_user',
      receiverName: '测试接收者',
      title: '测试消息标题',
      content: '这是一条测试消息',
      type: 'bid',
      relatedId: 1,
      relatedType: 'bid'
    })
    console.log('✓ 测试消息创建成功, ID:', testMessage.id)
    console.log('消息内容:', JSON.stringify(testMessage.toJSON(), null, 2))

    // 测试5: 查询消息
    console.log('\n测试5: 查询消息...')
    const foundMessage = await Message.findByPk(testMessage.id)
    console.log('✓ 消息查询成功:', foundMessage ? '找到消息' : '未找到')

    // 测试6: 查询特定用户的消息
    console.log('\n测试6: 查询特定用户的消息...')
    const { Op } = require('sequelize')
    const userMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { receiverType: 'all_users', receiverId: null },
          { receiverType: 'specific_user', receiverId: 2 }
        ]
      }
    })
    console.log('✓ 查询到', userMessages.length, '条消息')

    // 清理测试数据
    console.log('\n测试7: 清理测试数据...')
    await testMessage.destroy()
    console.log('✓ 测试数据已清理\n')

    console.log('=== 所有测试通过 ===')

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message)
    console.error('错误堆栈:', error.stack)
  } finally {
    await sequelize.close()
  }
}

// 运行测试
testMessageCreation()
