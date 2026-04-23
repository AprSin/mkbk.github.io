const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { Bid, Project, User, Message } = require('../models')
const { authenticate, checkAccountType } = require('../middleware/auth')
const { asyncHandler, AppError } = require('../middleware/errorHandler')
const { sanitizeInput } = require('../utils/helpers')
const { Op } = require('sequelize')

const router = express.Router()

const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR')
  }
  next()
}

router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须在1-100之间'),
    validateRequest
  ],
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const offset = (page - 1) * size

    const where = {}
    const include = [
      { 
        model: Project, 
        as: 'project', 
        attributes: ['id', 'name', 'price', 'status', 'bidEndDate', 'userId', 'description', 'location', 'area'],
        include: [
          { model: User, as: 'owner', attributes: ['id', 'username', 'name'] }
        ]
      },
      { model: User, as: 'bidder', attributes: ['id', 'username', 'name', 'phone'] }
    ]

    if (req.user.accountType === 'buyer') {
      where.buyerId = req.userId
    } else if (req.user.accountType === 'merchant') {
      include[0].where = { userId: req.userId }
    }

    // 使用 findAndCountAll 获取总数和分页数据
    const { count, rows: bids } = await Bid.findAndCountAll({
      where,
      include,
      order: [['bidDate', 'DESC']],
      limit: size,
      offset: offset,
      distinct: true
    })

    const totalPages = Math.ceil(count / size)

    res.json({
      success: true,
      data: { 
        bids,
        pagination: {
          page,
          size,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })
  })
)

router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const bid = await Bid.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'bidder', attributes: ['id', 'username', 'name', 'phone'] }
      ]
    })

    if (!bid) {
      throw new AppError('投标记录不存在', 404, 'NOT_FOUND')
    }

    const project = await Project.findByPk(bid.projectId)
    if (project && project.userId !== req.userId && bid.buyerId !== req.userId && req.user.role !== 'admin') {
      throw new AppError('无权查看此投标', 403, 'FORBIDDEN')
    }

    res.json({
      success: true,
      data: { bid }
    })
  })
)

router.post('/',
  authenticate,
  checkAccountType(['buyer']),
  [
    body('projectId').isInt().withMessage('项目ID必须是整数'),
    body('amount').isFloat({ min: 0 }).withMessage('投标金额必须是非负数'),
    body('contact').isString().isLength({ min: 1, max: 100 }).withMessage('联系人不能为空'),
    body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请提供有效的手机号码')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId, amount, contact, phone } = req.body
    
    console.log(`[投标提交] 用户ID: ${req.userId}, 项目ID: ${projectId}, 金额: ${amount}`)

    const project = await Project.findByPk(projectId)
    if (!project) {
      console.log(`[投标提交] 项目不存在: ${projectId}`)
      throw new AppError('项目不存在', 404, 'PROJECT_NOT_FOUND')
    }
    
    console.log(`[投标提交] 项目状态: ${project.status}, 投标截止: ${project.bidEndDate}`)

    if (project.status !== '交易中') {
      console.log(`[投标提交] 项目状态不符合: ${project.status}`)
      throw new AppError('项目不在交易中', 400, 'PROJECT_NOT_AVAILABLE')
    }

    if (project.bidEndDate && new Date(project.bidEndDate) < new Date()) {
      console.log(`[投标提交] 投标已截止: ${project.bidEndDate}`)
      throw new AppError('投标已截止', 400, 'BID_ENDED')
    }

    const existingBid = await Bid.findOne({
      where: {
        projectId,
        buyerId: req.userId
      }
    })

    if (existingBid) {
      console.log(`[投标提交] 重复投标: 用户 ${req.userId} 已对项目 ${projectId} 投过标`)
      throw new AppError('您已对此项目投过标', 400, 'ALREADY_BID')
    }

    try {
      const bid = await Bid.create({
        projectId,
        buyerId: req.userId,
        amount,
        contact: sanitizeInput(contact),
        phone: sanitizeInput(phone),
        status: '待处理',
        bidDate: new Date()
      })
      
      console.log(`[投标提交] 投标创建成功: ${bid.id}`)

      await project.increment('bidCount')
      
      console.log(`[投标提交] 项目投标数已更新`)

      res.status(201).json({
        success: true,
        message: '投标提交成功',
        data: { bid }
      })
    } catch (createError) {
      console.error(`[投标提交] 创建投标失败:`, createError)
      throw new AppError('投标创建失败: ' + createError.message, 500, 'BID_CREATE_ERROR')
    }
  })
)

router.put('/:id',
  authenticate,
  checkAccountType(['buyer']),
  [
    body('amount').optional().isFloat({ min: 0 }).withMessage('投标金额必须是非负数'),
    body('contact').optional().isString().isLength({ min: 1, max: 100 }).withMessage('联系人不能为空'),
    body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('请提供有效的手机号码')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const bid = await Bid.findByPk(req.params.id)

    if (!bid) {
      throw new AppError('投标记录不存在', 404, 'NOT_FOUND')
    }

    if (bid.buyerId !== req.userId) {
      throw new AppError('无权修改此投标', 403, 'FORBIDDEN')
    }

    if (bid.status !== '待处理') {
      throw new AppError('只能修改待处理的投标', 400, 'CANNOT_MODIFY')
    }

    const { amount, contact, phone } = req.body

    await bid.update({
      amount: amount !== undefined ? amount : bid.amount,
      contact: contact ? sanitizeInput(contact) : bid.contact,
      phone: phone ? sanitizeInput(phone) : bid.phone
    })

    res.json({
      success: true,
      message: '投标更新成功',
      data: { bid }
    })
  })
)

router.delete('/:id',
  authenticate,
  checkAccountType(['buyer']),
  asyncHandler(async (req, res) => {
    const bid = await Bid.findByPk(req.params.id)

    if (!bid) {
      throw new AppError('投标记录不存在', 404, 'NOT_FOUND')
    }

    if (bid.buyerId !== req.userId) {
      throw new AppError('无权删除此投标', 403, 'FORBIDDEN')
    }

    if (bid.status !== '待处理') {
      throw new AppError('只能删除待处理的投标', 400, 'CANNOT_DELETE')
    }

    await bid.update({ status: '已撤回' })

    res.json({
      success: true,
      message: '投标已撤回'
    })
  })
)

router.put('/:id/accept',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const bid = await Bid.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'bidder', attributes: ['id', 'username', 'name'] }
      ]
    })

    if (!bid) {
      throw new AppError('投标记录不存在', 404, 'NOT_FOUND')
    }

    const project = bid.project
    if (!project || project.userId !== req.userId) {
      throw new AppError('无权操作此投标', 403, 'FORBIDDEN')
    }

    if (bid.status !== '待处理') {
      throw new AppError('只能处理待处理的投标', 400, 'INVALID_STATUS')
    }

    // 获取当前项目的所有待处理投标
    const otherBids = await Bid.findAll({
      where: {
        projectId: project.id,
        id: { [Op.ne]: bid.id },
        status: '待处理'
      },
      include: [{ model: User, as: 'bidder', attributes: ['id', 'username', 'name'] }]
    })

    // 更新接受的投标状态
    await bid.update({ status: '已接受' })
    await project.update({ status: '已完成' })

    // 更新其他投标为已拒绝
    await Bid.update(
      { status: '已拒绝' },
      {
        where: {
          projectId: project.id,
          id: { [Op.ne]: bid.id },
          status: '待处理'
        }
      }
    )

    // 向投标成功的用户发送消息
    console.log(`[消息发送] 准备发送成功通知: 发送者=${req.user.id}, 接收者=${bid.bidder?.id}`)
    console.log(`[消息发送] bid.bidder 对象:`, JSON.stringify(bid.bidder))
    
    if (!bid.bidder) {
      console.error('[消息发送] 错误: bid.bidder 为 null，无法发送消息')
    } else {
      try {
        const message = await Message.create({
          senderId: req.user.id,
          senderType: 'user',
          senderName: req.user.name || req.user.username,
          receiverId: bid.bidder.id,
          receiverType: 'specific_user',
          receiverName: bid.bidder.name || bid.bidder.username,
          title: '投标成功通知',
          content: '我已接受你的投标，请尽快联系我',
          type: 'bid',
          relatedId: bid.id,
          relatedType: 'bid'
        })
        console.log(`[消息发送] 成功发送投标成功通知给用户 ${bid.bidder.id}, 消息ID=${message.id}`)
      } catch (msgError) {
        console.error('[消息发送] 发送成功通知失败:', msgError.message, msgError.stack)
      }
    }

    // 向所有其他参与投标但被拒绝的用户发送消息
    console.log(`[消息发送] 准备向 ${otherBids.length} 个其他投标人发送拒绝通知`)
    for (const otherBid of otherBids) {
      console.log(`[消息发送] 处理其他投标: bidder=${JSON.stringify(otherBid.bidder)}`)
      if (!otherBid.bidder) {
        console.error(`[消息发送] 错误: otherBid.bidder 为 null，跳过该投标`)
        continue
      }
      try {
        await Message.create({
          senderId: req.user.id,
          senderType: 'user',
          senderName: req.user.name || req.user.username,
          receiverId: otherBid.bidder.id,
          receiverType: 'specific_user',
          receiverName: otherBid.bidder.name || otherBid.bidder.username,
          title: '投标结果通知',
          content: '不好意思，您的投标未被采纳',
          type: 'bid',
          relatedId: otherBid.id,
          relatedType: 'bid'
        })
        console.log(`[消息发送] 成功发送拒绝通知给用户 ${otherBid.bidder.id}`)
      } catch (msgError) {
        console.error(`[消息发送] 发送拒绝通知给用户 ${otherBid.bidder?.id} 失败:`, msgError.message)
      }
    }

    res.json({
      success: true,
      message: '已接受投标，系统已自动通知所有投标人',
      data: { bid }
    })
  })
)

router.put('/:id/reject',
  authenticate,
  checkAccountType(['merchant']),
  [
    body('reason').optional().isString().withMessage('拒绝原因必须是字符串')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const bid = await Bid.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'bidder', attributes: ['id', 'username', 'name'] }
      ]
    })

    if (!bid) {
      throw new AppError('投标记录不存在', 404, 'NOT_FOUND')
    }

    const project = bid.project
    if (!project || project.userId !== req.userId) {
      throw new AppError('无权操作此投标', 403, 'FORBIDDEN')
    }

    if (bid.status !== '待处理') {
      throw new AppError('只能处理待处理的投标', 400, 'INVALID_STATUS')
    }

    const { reason } = req.body

    await bid.update({
      status: '已拒绝',
      rejectReason: reason ? sanitizeInput(reason) : null
    })

    // 向被拒绝的用户发送消息
    console.log(`[消息发送] 准备发送拒绝通知: 发送者=${req.user.id}, 接收者=${bid.bidder?.id}`)
    console.log(`[消息发送] bid.bidder 对象:`, JSON.stringify(bid.bidder))
    
    if (!bid.bidder) {
      console.error('[消息发送] 错误: bid.bidder 为 null，无法发送消息')
    } else {
      try {
        await Message.create({
          senderId: req.user.id,
          senderType: 'user',
          senderName: req.user.name || req.user.username,
          receiverId: bid.bidder.id,
          receiverType: 'specific_user',
          receiverName: bid.bidder.name || bid.bidder.username,
          title: '投标结果通知',
          content: reason ? `不好意思，您的投标未被采纳。原因：${reason}` : '不好意思，您的投标未被采纳',
          type: 'bid',
          relatedId: bid.id,
          relatedType: 'bid'
        })
        console.log(`[消息发送] 成功发送拒绝通知给用户 ${bid.bidder.id}`)
      } catch (msgError) {
        console.error('[消息发送] 发送拒绝通知失败:', msgError.message)
      }
    }

    res.json({
      success: true,
      message: '已拒绝投标，系统已自动通知投标人',
      data: { bid }
    })
  })
)

router.get('/project/:projectId/bids',
  authenticate,
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.projectId)

    if (!project) {
      throw new AppError('项目不存在', 404, 'PROJECT_NOT_FOUND')
    }

    if (project.userId !== req.userId && req.user.role !== 'admin') {
      throw new AppError('无权查看此项目的投标', 403, 'FORBIDDEN')
    }

    const bids = await Bid.findAll({
      where: { projectId: req.params.projectId },
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'username', 'name', 'phone'] }
      ],
      order: [['amount', 'DESC']]
    })

    res.json({
      success: true,
      data: { bids }
    })
  })
)

module.exports = router
