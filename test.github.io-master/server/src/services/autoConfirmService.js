const { Op } = require('sequelize')
const { Order, Message, User } = require('../models')

/**
 * 自动确认收货服务
 * 检查所有待收货且超过14天的订单，自动确认收货
 */
class AutoConfirmService {
  constructor() {
    this.isRunning = false
    this.intervalId = null
  }

  /**
   * 启动自动确认收货定时任务
   * @param {number} intervalMinutes - 检查间隔（分钟），默认10分钟
   */
  start(intervalMinutes = 10) {
    if (this.isRunning) {
      console.log('[自动确认收货] 服务已在运行中')
      return
    }

    console.log(`[自动确认收货] 启动定时任务，检查间隔：${intervalMinutes}分钟`)
    this.isRunning = true

    // 立即执行一次
    this.checkAndAutoConfirm()

    // 设置定时任务
    this.intervalId = setInterval(() => {
      this.checkAndAutoConfirm()
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * 停止自动确认收货定时任务
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('[自动确认收货] 定时任务已停止')
  }

  /**
   * 检查并自动确认收货
   */
  async checkAndAutoConfirm() {
    try {
      console.log('[自动确认收货] 开始检查待确认订单...')

      const now = new Date()

      // 查找所有待收货状态且超过自动确认时间的订单
      const ordersToConfirm = await Order.findAll({
        where: {
          status: '待收货',
          autoConfirmScheduledAt: {
            [Op.lte]: now
          }
        },
        include: [
          { model: User, as: 'buyer', attributes: ['id', 'username', 'name'] },
          { model: User, as: 'merchant', attributes: ['id', 'username', 'name'] }
        ]
      })

      console.log(`[自动确认收货] 找到 ${ordersToConfirm.length} 个需要自动确认的订单`)

      for (const order of ordersToConfirm) {
        await this.autoConfirmOrder(order)
      }

      console.log('[自动确认收货] 检查完成')
    } catch (error) {
      console.error('[自动确认收货] 检查失败:', error)
    }
  }

  /**
   * 自动确认单个订单
   * @param {Order} order - 订单实例
   */
  async autoConfirmOrder(order) {
    try {
      console.log(`[自动确认收货] 正在处理订单: ${order.orderNo}`)

      // 更新订单状态
      await order.update({
        status: '已完成',
        completedAt: new Date(),
        deliveredAt: new Date(),
        logisticsStatus: '已签收',
        autoConfirmed: true
      })

      // 发送通知给买家
      await Message.create({
        senderId: 0,
        senderType: 'system',
        senderName: '系统',
        receiverId: order.buyerId,
        receiverType: 'specific_user',
        receiverName: order.buyer?.name || order.buyer?.username || '买家',
        title: '订单已自动确认收货',
        content: `您的订单（订单号：${order.orderNo}）已自动确认收货！\n由于您在发货后14天内未主动确认收货，系统已自动完成订单。\n订单状态已更新为"已完成"。\n如有任何问题，请及时联系客服。`,
        type: 'order',
        relatedId: order.id,
        relatedType: 'Order'
      })

      // 发送通知给卖家
      await Message.create({
        senderId: 0,
        senderType: 'system',
        senderName: '系统',
        receiverId: order.merchantId,
        receiverType: 'specific_merchant',
        receiverName: order.merchant?.name || order.merchant?.username || '商户',
        title: '订单已自动完成',
        content: `订单（订单号：${order.orderNo}）已由系统自动确认收货！\n买家在发货后14天内未主动确认，系统已自动完成订单。\n订单状态已更新为"已完成"。\n交易金额：¥${order.totalPrice}已到账。`,
        type: 'order',
        relatedId: order.id,
        relatedType: 'Order'
      })

      // 记录系统日志
      console.log(`[自动确认收货] 订单 ${order.orderNo} (ID:${order.id}) 已自动确认收货`)

    } catch (error) {
      console.error(`[自动确认收货] 处理订单 ${order.orderNo} 失败:`, error)
    }
  }

  /**
   * 手动触发一次检查（用于测试或管理后台）
   */
  async manualCheck() {
    console.log('[自动确认收货] 手动触发检查')
    await this.checkAndAutoConfirm()
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId ? 'active' : 'inactive'
    }
  }
}

// 导出单例
const autoConfirmService = new AutoConfirmService()

module.exports = { autoConfirmService, AutoConfirmService }
