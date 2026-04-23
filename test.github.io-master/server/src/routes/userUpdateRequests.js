const express = require('express')
const { body, query, param, validationResult } = require('express-validator')
const { UserUpdateRequest, User, Message } = require('../models')
const { authenticate, checkAccountType } = require('../middleware/auth')
const { asyncHandler, AppError } = require('../middleware/errorHandler')

const router = express.Router()

const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR')
  }
  next()
}

// 获取用户修改申请列表（管理员）
router.get('/',
  authenticate,
  checkAccountType(['admin']),
  [
    query('userType').optional().isIn(['buyer', 'merchant']).withMessage('用户类型必须是buyer或merchant'),
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('状态必须是pending、approved或rejected'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const where = {}

    if (req.query.userType) {
      where.userType = req.query.userType
    }
    if (req.query.status) {
      where.status = req.query.status
    }

    const { count, rows } = await UserUpdateRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'name', 'accountType'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] }
      ]
    })

    res.json({
      success: true,
      data: {
        requests: rows,
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

// 获取我的修改申请列表
router.get('/my',
  authenticate,
  checkAccountType(['buyer', 'merchant']),
  asyncHandler(async (req, res) => {
    const requests = await UserUpdateRequest.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    })

    res.json({
      success: true,
      data: { requests }
    })
  })
)

// 创建修改申请
router.post('/',
  authenticate,
  checkAccountType(['buyer', 'merchant']),
  [
    body('requestedData').isObject().withMessage('申请数据必须是对象'),
    body('originalData').isObject().withMessage('原始数据必须是对象'),
    body('changedFields').isArray({ min: 1 }).withMessage('变更字段不能为空数组')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { requestedData, originalData, changedFields } = req.body

    const pendingRequest = await UserUpdateRequest.findOne({
      where: {
        userId: req.userId,
        status: 'pending'
      }
    })

    if (pendingRequest) {
      throw new AppError('您有正在审核中的修改申请，请等待审核完成后再提交', 400, 'PENDING_REQUEST_EXISTS')
    }

    const request = await UserUpdateRequest.create({
      userId: req.userId,
      userType: req.user.accountType,
      username: req.user.username,
      status: 'pending',
      originalData,
      requestedData,
      changedFields
    })

    res.status(201).json({
      success: true,
      message: '修改申请已提交，请等待管理员审核',
      data: { request }
    })
  })
)

// 审核通过申请
router.put('/:id/approve',
  authenticate,
  checkAccountType(['admin']),
  [
    param('id').isInt().withMessage('申请ID必须是整数'),
    body('comment').optional().isString()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { comment } = req.body

    const request = await UserUpdateRequest.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    })

    if (!request) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }
    if (request.status !== 'pending') {
      throw new AppError('该申请已被处理', 400, 'ALREADY_PROCESSED')
    }

    try {
      await request.update({
        status: 'approved',
        reviewComment: comment || '审核通过',
        reviewerId: req.userId,
        reviewedAt: new Date()
      })
    } catch (updateError) {
      console.error('更新申请状态失败:', updateError)
      throw new AppError('更新申请状态失败', 500, 'UPDATE_STATUS_FAILED')
    }

    let updatedUser = null
    try {
      const user = await User.findByPk(request.userId)
      if (user) {
        const updateData = {}
        for (const field of request.changedFields) {
          if (request.requestedData[field] !== undefined) {
            updateData[field] = request.requestedData[field]
          }
        }
        console.log(`[审核通过] 用户${request.userId} 更新数据:`, JSON.stringify(updateData))
        console.log(`[审核通过] 用户${request.userId} 变更字段:`, request.changedFields)
        await user.update(updateData)
        updatedUser = await User.findByPk(request.userId)
        console.log(`[审核通过] 用户${request.userId} 更新后的完整数据:`, JSON.stringify({
          name: updatedUser.name,
          realName: updatedUser.realName,
          idCard: updatedUser.idCard,
          phone: updatedUser.phone,
          email: updatedUser.email
        }))
      } else {
        console.error(`[审核通过] 未找到用户 ID: ${request.userId}`)
      }
    } catch (userUpdateError) {
      console.error('更新用户信息失败:', userUpdateError)
      throw new AppError('更新用户信息失败', 500, 'UPDATE_USER_FAILED')
    }

    try {
      const changedFieldsText = request.changedFields.join('、')
      const receiverType = request.userType === 'merchant' ? 'specific_merchant' : 'specific_user'
      await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: request.userId,
        receiverType: receiverType,
        receiverName: request.username,
        title: '个人信息修改申请已通过',
        content: `您的个人信息修改申请已通过审核。修改内容：${changedFieldsText}。如有疑问请联系管理员。`,
        type: 'system'
      })
      console.log(`已向用户 ${request.userId}(${request.username}, ${receiverType}) 发送审核通过通知消息`)
    } catch (messageError) {
      console.error('发送通知消息失败:', messageError)
    }

    res.json({
      success: true,
      message: '申请已通过，用户信息已更新',
      data: {
        request,
        updatedUser: updatedUser ? {
          name: updatedUser.name,
          realName: updatedUser.realName,
          idCard: updatedUser.idCard,
          phone: updatedUser.phone,
          email: updatedUser.email,
          address: updatedUser.address
        } : null
      }
    })
  })
)

// 驳回申请
router.put('/:id/reject',
  authenticate,
  checkAccountType(['admin']),
  [
    param('id').isInt().withMessage('申请ID必须是整数'),
    body('comment').trim().isLength({ min: 1 }).withMessage('驳回原因不能为空')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { comment } = req.body

    const request = await UserUpdateRequest.findByPk(id)

    if (!request) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }
    if (request.status !== 'pending') {
      throw new AppError('该申请已被处理', 400, 'ALREADY_PROCESSED')
    }

    try {
      await request.update({
        status: 'rejected',
        reviewComment: comment,
        reviewerId: req.userId,
        reviewedAt: new Date()
      })
    } catch (updateError) {
      console.error('更新申请状态失败:', updateError)
      throw new AppError('更新申请状态失败', 500, 'UPDATE_STATUS_FAILED')
    }

    try {
      const receiverType = request.userType === 'merchant' ? 'specific_merchant' : 'specific_user'
      await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: request.userId,
        receiverType: receiverType,
        receiverName: request.username,
        title: '个人信息修改申请未通过',
        content: `您的个人信息修改申请未通过审核。驳回原因：${comment}。如有疑问请联系管理员。`,
        type: 'system'
      })
      console.log(`已向用户 ${request.userId}(${request.username}, ${receiverType}) 发送审核驳回通知消息`)
    } catch (messageError) {
      console.error('发送通知消息失败:', messageError)
    }

    res.json({
      success: true,
      message: '申请已驳回',
      data: { request }
    })
  })
)

// 获取申请详情
router.get('/:id',
  authenticate,
  [
    param('id').isInt().withMessage('申请ID必须是整数')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const request = await UserUpdateRequest.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'name', 'accountType'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] }
      ]
    })

    if (!request) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }

    if (req.user.accountType !== 'admin' && request.userId !== req.userId) {
      throw new AppError('无权查看此申请', 403, 'FORBIDDEN')
    }

    res.json({
      success: true,
      data: { request }
    })
  })
)

module.exports = router
