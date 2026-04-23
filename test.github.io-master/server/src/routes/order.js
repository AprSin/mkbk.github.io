const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { Order, Product, User, Message, sequelize } = require('../models')
const { authenticate, checkAccountType } = require('../middleware/auth')
const { asyncHandler, AppError } = require('../middleware/errorHandler')
const { sanitizeInput } = require('../utils/helpers')
const { Op } = require('sequelize')
const crypto = require('crypto')

const router = express.Router()

const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR')
  }
  next()
}

const generateOrderNo = () => {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `ORD${timestamp}${random}`
}

router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isString(),
    query('type').optional().isIn(['shopping', 'bid'])
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const where = {}
    const include = [
      { model: User, as: 'buyer', attributes: ['id', 'username', 'name', 'phone', 'address'] },
      { model: User, as: 'merchant', attributes: ['id', 'username', 'name', 'phone', 'companyPhone', 'companyAddress', 'businessScope'] },
      { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'image', 'origin', 'category'] }
    ]

    if (req.query.status) {
      where.status = req.query.status
    }

    // 防御性检查：确保 req.user 存在
    if (!req.user) {
      throw new AppError('用户信息未找到', 401, 'USER_NOT_FOUND')
    }

    // 根据用户账户类型设置查询条件
    console.log(`[订单查询] 用户ID: ${req.userId}, 账户类型: ${req.user.accountType}`)
    if (req.user.accountType === 'buyer') {
      where.buyerId = req.userId
      console.log(`[订单查询] 买家查询, where.buyerId = ${req.userId}`)
    } else if (req.user.accountType === 'merchant') {
      where.merchantId = req.userId
      console.log(`[订单查询] 商家查询, where.merchantId = ${req.userId}`)
    } else {
      // 对于其他类型用户（如admin），查询所有订单
      console.log(`[订单查询] 管理员查询, 返回所有订单`)
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    })

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    })
  })
)

router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'username', 'name', 'phone', 'address'] },
        { model: User, as: 'merchant', attributes: ['id', 'username', 'name', 'phone', 'companyAddress'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'image', 'origin'] }
      ]
    })

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.buyerId !== req.userId && order.merchantId !== req.userId && req.user.role !== 'admin') {
      throw new AppError('无权查看此订单', 403, 'FORBIDDEN')
    }

    res.json({
      success: true,
      data: { order }
    })
  })
)

router.post('/',
  authenticate,
  checkAccountType(['buyer']),
  [
    body('items').isArray({ min: 1 }).withMessage('订单项目不能为空'),
    body('items.*.productId').isInt().withMessage('商品ID必须是整数'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('数量必须大于0')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { items } = req.body
    
    console.log(`[订单创建] 买家ID: ${req.userId}, 商品数量: ${items.length}`)
    console.log(`[订单创建] 订单项目:`, JSON.stringify(items))

    // 先查询所有商品信息（不加锁，减少锁等待时间）
    const productIds = items.map(item => item.productId)
    const products = await Product.findAll({
      where: { id: productIds },
      include: [
        { model: User, as: 'seller', attributes: ['id', 'username', 'name'] }
      ]
    })
    
    // 验证商品信息
    const productMap = new Map()
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      
      if (!product) {
        throw new AppError(`商品ID ${item.productId} 不存在`, 404, 'PRODUCT_NOT_FOUND')
      }
      if (product.userId === req.userId) {
        throw new AppError(`不能购买自己的商品 ${product.name}`, 400, 'CANNOT_BUY_OWN_PRODUCT')
      }
      if (product.status !== '在售') {
        throw new AppError(`商品 ${product.name} 不可售`, 400, 'PRODUCT_NOT_AVAILABLE')
      }
      if (product.stock < item.quantity) {
        throw new AppError(`商品 ${product.name} 库存不足`, 400, 'INSUFFICIENT_STOCK')
      }
      
      productMap.set(item.productId, product)
    }

    // 使用数据库事务确保数据一致性
    const transaction = await sequelize.transaction()

    try {
      const orders = []
      for (const item of items) {
        const product = productMap.get(item.productId)

        // 在事务中创建订单（直接设置为已支付状态）
        const order = await Order.create({
          orderNo: generateOrderNo(),
          buyerId: req.userId,
          merchantId: product.userId,
          productId: product.id,
          quantity: item.quantity,
          totalPrice: product.price * item.quantity,
          status: '已支付',
          paidAt: new Date()
        }, { transaction })

        // 在事务中更新库存和销量
        await Product.decrement('stock', { by: item.quantity, where: { id: product.id }, transaction })
        await Product.increment('salesCount', { where: { id: product.id }, transaction })

        orders.push(order)

        // 发送新订单通知给卖家（在事务外发送，避免影响事务性能）
        try {
          await Message.create({
            senderId: req.userId,
            senderType: 'user',
            senderName: req.user?.username || '买家',
            receiverId: product.userId,
            receiverType: 'specific_merchant',
            receiverName: product.seller?.name || product.seller?.username || '商户',
            title: '收到新订单',
            content: `您有新订单！\n订单编号：${order.orderNo}\n商品：${product.name}\n数量：${item.quantity}斤\n金额：¥${order.totalPrice}\n买家：${req.user?.username || '未知'}\n下单时间：${new Date().toLocaleString('zh-CN')}\n请及时处理发货。`,
            type: 'order',
            relatedId: order.id,
            relatedType: 'Order'
          })
          console.log(`[新订单] 通知已发送给商户 ID:${product.userId}`)
        } catch (msgErr) {
          console.error('[新订单] 发送通知失败:', msgErr)
        }
      }

      // 提交事务
      await transaction.commit()
      
      console.log(`[订单创建] 成功创建 ${orders.length} 个订单`)
      orders.forEach(o => {
        console.log(`[订单创建] 订单号: ${o.orderNo}, ID: ${o.id}, 商家ID: ${o.merchantId}`)
      })

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: { orders }
      })
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      console.error(`[订单创建] 失败:`, error.message)
      throw error
    }
  })
)

router.put('/:id/pay',
  authenticate,
  checkAccountType(['buyer']),
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id)

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.buyerId !== req.userId) {
      throw new AppError('无权操作此订单', 403, 'FORBIDDEN')
    }

    // 订单已支付，无需再次付款
    if (order.status === '已支付' || order.status === '待发货' || order.status === '待收货' || order.status === '已完成') {
      res.json({
        success: true,
        message: '订单已支付',
        data: { order }
      })
      return
    }

    throw new AppError('订单状态不允许付款', 400, 'INVALID_ORDER_STATUS')
  })
)

router.put('/:id/ship',
  authenticate,
  checkAccountType(['merchant']),
  [
    body('logisticsCompany').optional().isString(),
    body('trackingNumber').optional().isString()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { logisticsCompany, trackingNumber } = req.body
    const order = await Order.findByPk(req.params.id)

    console.log('[订单发货] 请求参数:', { orderId: req.params.id, logisticsCompany, trackingNumber })
    console.log('[订单发货] 订单信息:', { orderId: order?.id, status: order?.status, merchantId: order?.merchantId, userId: req.userId })

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.merchantId !== req.userId) {
      throw new AppError('无权操作此订单', 403, 'FORBIDDEN')
    }

    if (order.status !== '已支付' && order.status !== '待发货') {
      console.log('[订单发货] 状态检查失败:', { orderStatus: order.status, allowed: ['已支付', '待发货'] })
      throw new AppError('订单状态不允许发货', 400, 'INVALID_ORDER_STATUS')
    }

    if (!logisticsCompany || !trackingNumber) {
      throw new AppError('物流公司和运单号不能为空', 400, 'MISSING_LOGISTICS_INFO')
    }

    const { buyerId, buyerName } = await User.findByPk(order.buyerId) || {}

    // 计算自动确认收货时间（发货后14天）
    const shippedAt = new Date()
    const autoConfirmScheduledAt = new Date(shippedAt.getTime() + 14 * 24 * 60 * 60 * 1000)

    await order.update({
      status: '待收货',
      shippedAt: shippedAt,
      autoConfirmScheduledAt: autoConfirmScheduledAt,
      logisticsCompany,
      trackingNumber,
      logisticsStatus: '已发货'
    })

    // 发送通知给买家
    if (order.buyerId) {
      try {
        const receiverType = order.buyer?.accountType === 'merchant' ? 'specific_merchant' : 'specific_user'
        await Message.create({
          senderId: order.merchantId,
          senderType: 'user',
          senderName: order.merchant?.name || '商户',
          receiverId: order.buyerId,
          receiverType: receiverType,
          receiverName: buyerName || '买家',
          title: '您的订单已发货',
          content: `您的订单（订单号：${order.orderNo}）已发货！\n物流公司：${logisticsCompany}\n运单号：${trackingNumber}\n请注意查收。`,
          type: 'order',
          relatedId: order.id,
          relatedType: 'Order'
        })
        console.log(`[订单发货] 通知已发送给买家 ID:${order.buyerId}`)
      } catch (msgErr) {
        console.error('[订单发货] 发送通知失败:', msgErr)
      }
    }

    res.json({
      success: true,
      message: '发货成功',
      data: { order }
    })
  })
)

router.put('/:id/confirm',
  authenticate,
  checkAccountType(['buyer']),
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id)

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.buyerId !== req.userId) {
      throw new AppError('无权操作此订单', 403, 'FORBIDDEN')
    }

    if (order.status !== '待收货') {
      throw new AppError('订单状态不允许确认收货', 400, 'INVALID_ORDER_STATUS')
    }

    await order.update({
      status: '已完成',
      completedAt: new Date(),
      deliveredAt: new Date(),
      logisticsStatus: '已签收',
      autoConfirmed: false  // 标记为手动确认
    })

    // 发送通知给买家和卖家
    try {
      // 通知买家
      await Message.create({
        senderId: 0,
        senderType: 'system',
        senderName: '系统',
        receiverId: order.buyerId,
        receiverType: 'specific_user',
        receiverName: req.user?.username || '买家',
        title: '订单已确认收货',
        content: `您的订单（订单号：${order.orderNo}）已确认收货！\n订单状态已更新为"已完成"。\n感谢您的购买，如有任何问题请联系客服。`,
        type: 'order',
        relatedId: order.id,
        relatedType: 'Order'
      })

      // 通知卖家
      await Message.create({
        senderId: 0,
        senderType: 'system',
        senderName: '系统',
        receiverId: order.merchantId,
        receiverType: 'specific_merchant',
        receiverName: '商户',
        title: '订单已完成',
        content: `订单（订单号：${order.orderNo}）已由买家确认收货！\n订单状态已更新为"已完成"。\n交易金额：¥${order.totalPrice}已到账。`,
        type: 'order',
        relatedId: order.id,
        relatedType: 'Order'
      })
      console.log(`[确认收货] 通知已发送给买家和卖家，订单ID:${order.id}`)
    } catch (msgErr) {
      console.error('[确认收货] 发送通知失败:', msgErr)
    }

    res.json({
      success: true,
      message: '确认收货成功',
      data: { order }
    })
  })
)

router.put('/:id/return',
  authenticate,
  checkAccountType(['buyer']),
  [
    body('returnType').isIn(['退货退款', '仅退款']).withMessage('申请类型必须是"退货退款"或"仅退款"'),
    body('reason').isString().withMessage('退单原因不能为空'),
    body('quantity').optional().isInt({ min: 1 }),
    body('refundMethod').optional().isString(),
    body('images').optional().isArray()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'merchant', attributes: ['id', 'username', 'name'] }
      ]
    })

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.buyerId !== req.userId) {
      throw new AppError('无权操作此订单', 403, 'FORBIDDEN')
    }

    // 允许所有已支付订单申请退货，包括之前被拒绝的
    if (!['已支付', '待发货', '待收货', '已完成'].includes(order.status) && order.status !== '退单中') {
      throw new AppError('订单状态不允许申请退单', 400, 'INVALID_ORDER_STATUS')
    }

    // 如果之前有过退货申请，检查是否可以重新申请
    if (order.returnStatus === '申请中') {
      throw new AppError('您已有进行中的退货申请，请等待商家处理', 400, 'RETURN_ALREADY_REQUESTED')
    }

    const { returnType, reason, quantity, refundMethod, images } = req.body

    // 验证退货类型
    if (!returnType || !['退货退款', '仅退款'].includes(returnType)) {
      throw new AppError('请选择有效的退货类型', 400, 'INVALID_RETURN_TYPE')
    }

    // 验证退货原因
    if (!reason || reason.trim().length === 0) {
      throw new AppError('退货原因不能为空', 400, 'MISSING_RETURN_REASON')
    }
    if (reason.trim().length < 5) {
      throw new AppError('退货原因描述不能少于5个字符', 400, 'RETURN_REASON_TOO_SHORT')
    }

    // 验证退货数量
    const returnQty = parseInt(quantity) || order.quantity
    if (returnQty < 1 || returnQty > order.quantity) {
      throw new AppError(`退货数量必须在1-${order.quantity}之间`, 400, 'INVALID_RETURN_QUANTITY')
    }

    // 保存申请退单前的状态
    const currentStatus = order.status === '退单中' ? (order.statusBeforeReturn || '待发货') : order.status

    await order.update({
      status: '退单中',
      returnStatus: '申请中',
      returnType: returnType,
      returnReason: sanitizeInput(reason),
      returnQuantity: quantity || order.quantity,
      returnRefundMethod: refundMethod || '原路退回',
      returnImages: images ? JSON.stringify(images) : null,
      returnRequestedAt: new Date(),
      statusBeforeReturn: currentStatus,
      // 清除之前的拒绝记录，允许重新申请
      returnRejected: false,
      returnApproved: false,
      returnRejectedAt: null,
      returnApprovedAt: null,
      // 清除之前的退货物流信息（如果是二次申请）
      returnShipped: false,
      returnShippedAt: null,
      returnLogisticsCompany: null,
      returnLogisticsNumber: null
    })

    // 发送通知给商户
    try {
      await Message.create({
        senderId: order.buyerId,
        senderType: 'user',
        senderName: req.user?.username || '买家',
        receiverId: order.merchantId,
        receiverType: 'specific_merchant',
        receiverName: order.merchant?.name || '商户',
        title: '收到退货申请',
        content: `订单（订单号：${order.orderNo}）的买家申请了退货。\n申请类型：${returnType}\n退货原因：${reason}\n退货数量：${quantity || order.quantity}斤\n申请时间：${new Date().toLocaleString('zh-CN')}\n请及时处理。`,
        type: 'return',
        relatedId: order.id,
        relatedType: 'Order'
      })
      console.log(`[退货申请] 通知已发送给商户 ID:${order.merchantId}`)
    } catch (msgErr) {
      console.error('[退货申请] 发送通知失败:', msgErr)
    }

    res.json({
      success: true,
      message: '退货申请已提交',
      data: { order }
    })
  })
)

router.put('/:id/return/approve',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'username', 'name', 'email'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'stock'] }
      ]
    })

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.merchantId !== req.userId) {
      throw new AppError('无权操作此订单', 403, 'FORBIDDEN')
    }

    if (order.status !== '退单中' || order.returnStatus !== '申请中') {
      throw new AppError('订单状态不允许审批退单', 400, 'INVALID_ORDER_STATUS')
    }

    await order.update({
      status: '已取消',
      returnStatus: '已批准',
      paymentStatus: '已退款',
      returnApproved: true,
      returnApprovedAt: new Date()
    })

    // 恢复库存
    const product = await Product.findByPk(order.productId)
    if (product) {
      await product.increment('stock', { by: order.returnQuantity || order.quantity })
      console.log(`[退货批准] 恢复库存: 商品${product.name} 恢复${order.returnQuantity || order.quantity}件，当前库存${product.stock + (order.returnQuantity || order.quantity)}`)
    }

    // 发送通知给买家
    try {
      await Message.create({
        senderId: order.merchantId,
        senderType: 'user',
        senderName: order.merchant?.name || '商户',
        receiverId: order.buyerId,
        receiverType: 'specific_user',
        receiverName: order.buyer?.username || '买家',
        title: '退货申请已批准',
        content: `您的退货申请（订单号：${order.orderNo}）已被商家批准。\n申请类型：${order.returnType || '退货退款'}\n退货数量：${order.returnQuantity || order.quantity}斤\n退款金额：¥${order.totalPrice}\n订单状态：已取消\n处理时间：${new Date().toLocaleString('zh-CN')}\n退款将在1-3个工作日内退回至您的账户。`,
        type: 'return',
        relatedId: order.id,
        relatedType: 'Order'
      })
      console.log(`[退货批准] 通知已发送给买家 ID:${order.buyerId}`)
    } catch (msgErr) {
      console.error('[退货批准] 发送通知失败:', msgErr)
    }

    res.json({
      success: true,
      message: '退单已批准',
      data: { order }
    })
  })
)

router.put('/:id/return/reject',
  authenticate,
  checkAccountType(['merchant']),
  [
    body('reason').isString().withMessage('拒绝原因不能为空')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'username', 'name', 'email'] }
      ]
    })

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.merchantId !== req.userId) {
      throw new AppError('无权操作此订单', 403, 'FORBIDDEN')
    }

    if (order.status !== '退单中' || order.returnStatus !== '申请中') {
      throw new AppError('订单状态不允许拒绝退单', 400, 'INVALID_ORDER_STATUS')
    }

    const { reason } = req.body

    // 恢复到申请退单前的状态
    const previousStatus = order.statusBeforeReturn || '待发货'

    await order.update({
      status: previousStatus,
      returnStatus: '已拒绝',
      returnRejected: true,
      returnRejectedAt: new Date(),
      remark: `退单拒绝原因: ${sanitizeInput(reason)}`
    })

    // 发送通知给买家
    try {
      await Message.create({
        senderId: order.merchantId,
        senderType: 'user',
        senderName: order.merchant?.name || '商户',
        receiverId: order.buyerId,
        receiverType: 'specific_user',
        receiverName: order.buyer?.username || '买家',
        title: '退货申请被拒绝',
        content: `您的退货申请（订单号：${order.orderNo}）已被商家拒绝。\n申请类型：${order.returnType || '退货退款'}\n拒绝原因：${reason}\n订单状态：已恢复为${previousStatus}\n处理时间：${new Date().toLocaleString('zh-CN')}\n\n如有疑问，请联系商家协商或重新提交申请。`,
        type: 'return',
        relatedId: order.id,
        relatedType: 'Order'
      })
      console.log(`[拒绝退单] 通知已发送给买家 ID:${order.buyerId}`)
    } catch (msgErr) {
      console.error('[拒绝退单] 发送通知失败:', msgErr)
    }

    res.json({
      success: true,
      message: '退单已拒绝',
      data: { order }
    })
  })
)

// 买家提交退货物流
router.put('/:id/return/logistics',
  authenticate,
  checkAccountType(['buyer']),
  [
    body('logisticsCompany').isString().withMessage('物流公司不能为空'),
    body('logisticsNumber').isString().withMessage('运单号不能为空')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id)

    if (!order) {
      throw new AppError('订单不存在', 404, 'NOT_FOUND')
    }

    if (order.buyerId !== req.userId) {
      throw new AppError('无权操作此订单', 403, 'FORBIDDEN')
    }

    if (order.returnStatus !== '已批准') {
      throw new AppError('订单状态不允许提交退货物流', 400, 'INVALID_ORDER_STATUS')
    }

    // 防止重复提交物流信息
    if (order.returnShipped) {
      throw new AppError('您已提交过退货物流信息，请勿重复提交', 400, 'RETURN_LOGISTICS_ALREADY_SUBMITTED')
    }

    const { logisticsCompany, logisticsNumber } = req.body

    // 验证物流信息
    if (!logisticsCompany || logisticsCompany.trim().length === 0) {
      throw new AppError('物流公司不能为空', 400, 'MISSING_LOGISTICS_COMPANY')
    }
    if (!logisticsNumber || logisticsNumber.trim().length < 6) {
      throw new AppError('运单号长度不能少于6位', 400, 'INVALID_LOGISTICS_NUMBER')
    }

    await order.update({
      returnLogisticsCompany: logisticsCompany.trim(),
      returnLogisticsNumber: logisticsNumber.trim(),
      returnShipped: true,
      returnShippedAt: new Date()
    })

    // 发送通知给商户
    try {
      await Message.create({
        senderId: order.buyerId,
        senderType: 'user',
        senderName: order.buyer?.username || '买家',
        receiverId: order.merchantId,
        receiverType: 'specific_merchant',
        receiverName: order.merchant?.name || '商户',
        title: '买家已提交退货物流',
        content: `订单（订单号：${order.orderNo}）的买家已提交退货物流信息。\n物流公司：${logisticsCompany}\n运单号：${logisticsNumber}\n请及时查收退货商品。`,
        type: 'return',
        relatedId: order.id,
        relatedType: 'Order'
      })
      console.log(`[退货物流] 通知已发送给商户 ID:${order.merchantId}`)
    } catch (msgErr) {
      console.error('[退货物流] 发送通知失败:', msgErr)
    }

    res.json({
      success: true,
      message: '退货物流信息已提交',
      data: { order }
    })
  })
)

router.get('/buyer/orders',
  authenticate,
  checkAccountType(['buyer']),
  asyncHandler(async (req, res) => {
    console.log(`[买家订单查询] 用户ID: ${req.userId}, 用户名: ${req.user?.username}`)
    
    const orders = await Order.findAll({
      where: { buyerId: req.userId },
      include: [
        { model: User, as: 'merchant', attributes: ['id', 'username', 'name', 'phone'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'image'] }
      ],
      order: [['createdAt', 'DESC']]
    })
    
    console.log(`[买家订单查询] 找到 ${orders.length} 个订单`)

    res.json({
      success: true,
      data: { orders }
    })
  })
)

router.get('/merchant/orders',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    console.log(`[商家订单查询] 用户ID: ${req.userId}, 用户名: ${req.user?.username}`)
    
    const orders = await Order.findAll({
      where: { merchantId: req.userId },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'username', 'name', 'phone'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'image'] }
      ],
      order: [['createdAt', 'DESC']]
    })
    
    console.log(`[商家订单查询] 找到 ${orders.length} 个订单`)

    res.json({
      success: true,
      data: { orders }
    })
  })
)

router.get('/statistics',
  asyncHandler(async (req, res) => {
    const { Project } = require('../models')
    const { Op } = require('sequelize')
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    // 基础统计数据
    const [totalOrders, totalAmount, successOrders, activeUsers, totalProjects] = await Promise.all([
      Order.count(),
      Order.sum('totalPrice'),
      Order.count({ where: { status: '已完成' } }),
      User.count({ where: { isActive: true } }),
      Project.count()
    ])

    const successRate = totalOrders > 0 ? Math.round((successOrders / totalOrders) * 100) : 0

    // 最近订单
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] }
      ]
    })

    // 按月统计交易趋势（近12个月）
    const monthlyStats = await Order.findAll({
      attributes: [
        [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'amount']
      ],
      where: {
        createdAt: {
          [Op.gte]: oneYearAgo
        }
      },
      group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt'))],
      order: [[sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')), 'ASC']],
      raw: true
    })

    // 交易类型分布（基于订单状态）
    const statusDistribution = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    })

    // 交易金额分布
    const amountRanges = [
      { label: '0-50万', min: 0, max: 500000 },
      { label: '50-100万', min: 500000, max: 1000000 },
      { label: '100-200万', min: 1000000, max: 2000000 },
      { label: '200万以上', min: 2000000, max: null }
    ]

    const amountDistribution = await Promise.all(
      amountRanges.map(async (range) => {
        const where = {
          totalPrice: {
            [Op.gte]: range.min
          }
        }
        if (range.max) {
          where.totalPrice[Op.lt] = range.max
        }
        const count = await Order.count({ where })
        return { label: range.label, count }
      })
    )

    // 项目类型分布
    const projectTypeDistribution = await Project.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    })

    res.json({
      success: true,
      data: {
        totalProjects: totalOrders + totalProjects,
        totalAmount: Math.round((totalAmount || 0) / 10000 * 100) / 100,
        successRate,
        activeUsers,
        recentOrders: recentOrders.map(o => ({
          id: o.orderNo,
          name: o.product?.name || '未知商品',
          type: o.product ? '农产品' : '项目',
          amount: parseFloat(o.totalPrice),
          date: o.createdAt,
          status: o.status === '已完成' ? 'success' : 'pending',
          statusText: o.status
        })),
        // 图表数据
        monthlyStats: monthlyStats.map(m => ({
          month: m.month,
          count: parseInt(m.count),
          amount: Math.round((parseFloat(m.amount) || 0) / 10000 * 100) / 100
        })),
        statusDistribution: statusDistribution.map(s => ({
          status: s.status,
          count: parseInt(s.count)
        })),
        amountDistribution,
        projectTypeDistribution: projectTypeDistribution.map(p => ({
          type: p.type || '其他',
          count: parseInt(p.count)
        }))
      }
    })
  })
)

module.exports = router
