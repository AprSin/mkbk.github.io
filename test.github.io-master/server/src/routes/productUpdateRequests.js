const express = require('express')
const { body, query, param, validationResult } = require('express-validator')
const { ProductUpdateRequest, Product, User, Message, sequelize } = require('../models')
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

// 获取农产品修改申请列表（管理员）
router.get('/',
  authenticate,
  checkAccountType(['admin']),
  [
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

    if (req.query.status) {
      where.status = req.query.status
    }

    const { count, rows } = await ProductUpdateRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'merchant', attributes: ['id', 'username', 'name'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'status'] }
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

// 获取我的农产品修改申请列表（商户）
router.get('/my',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const requests = await ProductUpdateRequest.findAll({
      where: { merchantId: req.userId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'status'] }
      ]
    })

    res.json({
      success: true,
      data: { requests }
    })
  })
)

// 创建农产品修改申请
router.post('/',
  authenticate,
  checkAccountType(['merchant']),
  [
    body('productId').isInt().withMessage('农产品ID必须是整数'),
    body('requestedData').isObject().withMessage('申请数据必须是对象'),
    body('originalData').isObject().withMessage('原始数据必须是对象'),
    body('changedFields').isArray({ min: 1 }).withMessage('变更字段不能为空数组')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { productId, requestedData, originalData, changedFields } = req.body

    // 检查农产品是否存在且属于当前商户
    const product = await Product.findByPk(productId)
    if (!product) {
      throw new AppError('农产品不存在', 404, 'NOT_FOUND')
    }
    if (product.userId !== req.userId) {
      throw new AppError('无权修改此农产品', 403, 'FORBIDDEN')
    }

    // 检查是否有待审核的申请
    const pendingRequest = await ProductUpdateRequest.findOne({
      where: {
        productId,
        status: 'pending'
      }
    })

    if (pendingRequest) {
      throw new AppError('该农产品有正在审核中的修改申请，请等待审核完成后再提交', 400, 'PENDING_REQUEST_EXISTS')
    }

    const request = await ProductUpdateRequest.create({
      productId,
      merchantId: req.userId,
      merchantName: req.user.name || req.user.username,
      status: 'pending',
      originalData,
      requestedData,
      changedFields
    })

    res.status(201).json({
      success: true,
      message: '农产品修改申请已提交，请等待管理员审核',
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

    // 使用事务确保数据一致性
    const transaction = await sequelize.transaction()

    try {
      // 获取申请信息（带锁）
      const request = await ProductUpdateRequest.findByPk(id, {
        include: [
          { model: Product, as: 'product' },
          { model: User, as: 'merchant' }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!request) {
        await transaction.rollback()
        throw new AppError('申请不存在', 404, 'NOT_FOUND')
      }
      if (request.status !== 'pending') {
        await transaction.rollback()
        throw new AppError('该申请已被处理', 400, 'ALREADY_PROCESSED')
      }

      // 获取农产品信息（带锁）
      const product = await Product.findByPk(request.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!product) {
        await transaction.rollback()
        throw new AppError('农产品不存在', 404, 'PRODUCT_NOT_FOUND')
      }

      // 记录更新前的数据
      const beforeUpdate = { ...product.toJSON() }

      // 构建更新数据 - 只更新申请的字段
      const updateData = {}
      const changedFields = request.changedFields || []
      const requestedData = request.requestedData || {}

      for (const field of changedFields) {
        if (requestedData[field] !== undefined) {
          updateData[field] = requestedData[field]
        }
      }

      console.log('[ProductUpdate DEBUG] updateData:', updateData)
      console.log('[ProductUpdate DEBUG] changedFields:', changedFields)
      console.log('[ProductUpdate DEBUG] requestedData:', requestedData)
      console.log('[ProductUpdate DEBUG] product.category BEFORE:', product.category)

      // 数据验证
      const requiredFields = ['name', 'price', 'stock']
      for (const field of requiredFields) {
        if (changedFields.includes(field) && (updateData[field] === undefined || updateData[field] === null || updateData[field] === '')) {
          await transaction.rollback()
          throw new AppError(`必填字段 ${field} 不能为空`, 400, 'VALIDATION_ERROR')
        }
      }

      // 更新农产品信息
      await product.update(updateData, { transaction })

      console.log('[ProductUpdate DEBUG] product.category AFTER:', product.category)

      // 重新加载产品数据以获取更新后的值
      await product.reload({ transaction })
      const afterUpdate = { ...product.toJSON() }

      // 更新申请状态
      await request.update({
        status: 'approved',
        reviewComment: comment || '审核通过',
        reviewerId: req.userId,
        reviewedAt: new Date()
      }, { transaction })

      // 发送通知消息
      await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: request.merchantId,
        receiverType: 'specific_merchant',
        receiverName: request.merchantName,
        title: '农产品信息修改已通过',
        content: `您的农产品"${request.product?.name || ''}"信息修改申请已通过，信息修改已完成`,
        type: 'system'
      }, { transaction })

      // 提交事务
      await transaction.commit()

      // 记录更新日志（异步，不影响主流程）
      console.log('[ProductUpdate] 审批通过:', {
        requestId: id,
        productId: request.productId,
        merchantId: request.merchantId,
        reviewerId: req.userId,
        changedFields,
        beforeUpdate: {
          name: beforeUpdate.name,
          price: beforeUpdate.price,
          stock: beforeUpdate.stock,
          status: beforeUpdate.status,
          category: beforeUpdate.category,
          origin: beforeUpdate.origin,
          description: beforeUpdate.description?.substring(0, 50)
        },
        afterUpdate: {
          name: afterUpdate.name,
          price: afterUpdate.price,
          stock: afterUpdate.stock,
          status: afterUpdate.status,
          category: afterUpdate.category,
          origin: afterUpdate.origin,
          description: afterUpdate.description?.substring(0, 50)
        },
        timestamp: new Date().toISOString()
      })

      res.json({
        success: true,
        message: '申请已通过，农产品信息已更新',
        data: { 
          request,
          product: afterUpdate
        }
      })
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
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

    // 使用事务确保数据一致性
    const transaction = await sequelize.transaction()

    try {
      const request = await ProductUpdateRequest.findByPk(id, {
        include: [
          { model: Product, as: 'product' }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!request) {
        await transaction.rollback()
        throw new AppError('申请不存在', 404, 'NOT_FOUND')
      }
      if (request.status !== 'pending') {
        await transaction.rollback()
        throw new AppError('该申请已被处理', 400, 'ALREADY_PROCESSED')
      }

      // 更新申请状态
      await request.update({
        status: 'rejected',
        reviewComment: comment,
        reviewerId: req.userId,
        reviewedAt: new Date()
      }, { transaction })

      // 发送通知消息
      await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: request.merchantId,
        receiverType: 'specific_merchant',
        receiverName: request.merchantName,
        title: '农产品信息修改未通过',
        content: `您的农产品"${request.product?.name || ''}"信息修改申请未通过。原因：${comment}`,
        type: 'system'
      }, { transaction })

      // 提交事务
      await transaction.commit()

      // 记录日志
      console.log('[ProductUpdate] 审批驳回:', {
        requestId: id,
        productId: request.productId,
        merchantId: request.merchantId,
        reviewerId: req.userId,
        rejectReason: comment,
        timestamp: new Date().toISOString()
      })

      res.json({
        success: true,
        message: '申请已驳回',
        data: { request }
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
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

    const request = await ProductUpdateRequest.findByPk(id, {
      include: [
        { model: User, as: 'merchant', attributes: ['id', 'username', 'name'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'status'] }
      ]
    })

    if (!request) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }

    // 检查权限（只有管理员或申请人本人可以查看）
    if (req.user.accountType !== 'admin' && request.merchantId !== req.userId) {
      throw new AppError('无权查看此申请', 403, 'FORBIDDEN')
    }

    res.json({
      success: true,
      data: { request }
    })
  })
)

module.exports = router
