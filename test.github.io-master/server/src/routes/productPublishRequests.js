const express = require('express')
const { body, query, param, validationResult } = require('express-validator')
const { ProductPublishRequest, Product, User, Message, sequelize } = require('../models')
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

router.post('/',
  authenticate,
  checkAccountType(['merchant']),
  [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('商品名称不能为空且不能超过200字符'),
    body('description').optional().isString(),
    body('price').isFloat({ min: 0 }).withMessage('价格必须是非负数'),
    body('stock').isInt({ min: 0 }).withMessage('库存必须是非负整数'),
    body('origin').optional().isString(),
    body('category').optional().isString(),
    body('image').optional().isString(),
    body('shippingTime').optional().isIn(['24小时内发货', '3天内发货', '15天内发货', '预售']).withMessage('发货时间格式不正确')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, description, price, stock, origin, category, image, shippingTime } = req.body

    const existingPending = await ProductPublishRequest.findOne({
      where: {
        merchantId: req.userId,
        productName: name,
        status: 'pending'
      }
    })

    if (existingPending) {
      throw new AppError('您已提交过相同名称的农产品发布申请，请等待审核完成', 400, 'DUPLICATE_REQUEST')
    }

    const productData = {
      name,
      description,
      price,
      stock,
      origin,
      category,
      image,
      shippingTime: shippingTime || '24小时内发货',
      userId: req.userId,
      status: '待审核'
    }

    const request = await ProductPublishRequest.create({
      status: 'pending',
      merchantId: req.userId,
      merchantName: req.user.name || req.user.username,
      productName: name,
      productData
    })

    const adminUsers = await User.findAll({
      where: { accountType: 'admin' }
    })

    for (const admin of adminUsers) {
      await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: admin.id,
        receiverType: 'admin',
        receiverName: admin.name || admin.username,
        title: '新的农产品发布申请',
        content: `商户"${req.user.name || req.user.username}"提交了农产品"${name}"的发布申请，请及时审核`,
        type: 'system'
      })
    }

    res.status(201).json({
      success: true,
      message: '发布申请已提交，等待管理员审核',
      data: { request }
    })
  })
)

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

    const { count, rows } = await ProductPublishRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'merchant', attributes: ['id', 'username', 'name', 'phone', 'company_phone', 'company_address'] },
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

router.get('/my',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const requests = await ProductPublishRequest.findAll({
      where: { merchantId: req.userId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] }
      ]
    })

    res.json({
      success: true,
      data: { requests }
    })
  })
)

router.get('/:id',
  authenticate,
  [
    param('id').isInt().withMessage('申请ID必须是整数')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const request = await ProductPublishRequest.findByPk(id, {
      include: [
        { model: User, as: 'merchant', attributes: ['id', 'username', 'name', 'phone', 'company_phone', 'company_address'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] }
      ]
    })

    if (!request) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }

    if (req.user.accountType !== 'admin' && request.merchantId !== req.userId) {
      throw new AppError('无权查看此申请', 403, 'FORBIDDEN')
    }

    res.json({
      success: true,
      data: { request }
    })
  })
)

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

    const transaction = await sequelize.transaction()

    try {
      const request = await ProductPublishRequest.findByPk(id, {
        include: [{ model: User, as: 'merchant' }],
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

      const existingProduct = await Product.findOne({
        where: {
          name: request.productData.name || request.productName,
          userId: request.merchantId,
          status: '待审核'
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      let product
      if (existingProduct) {
        await existingProduct.update({ status: '在售' }, { transaction })
        product = existingProduct
      } else {
        product = await Product.create(request.productData, { transaction })
      }

      await request.update({
        status: 'approved',
        reviewComment: comment || '审核通过',
        reviewerId: req.userId,
        reviewerName: req.user.name || req.user.username,
        reviewedAt: new Date()
      }, { transaction })

      await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: request.merchantId,
        receiverType: 'specific_merchant',
        receiverName: request.merchantName,
        title: '农产品发布已通过',
        content: `您的农产品"${request.productName}"已成功发布`,
        type: 'system'
      }, { transaction })

      await transaction.commit()

      console.log('[ProductPublish] 审批通过:', {
        requestId: id,
        productId: product.id,
        merchantId: request.merchantId,
        reviewerId: req.userId,
        productName: request.productName,
        timestamp: new Date().toISOString()
      })

      res.json({
        success: true,
        message: '申请已通过，农产品已发布',
        data: { request, product }
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  })
)

router.put('/:id/reject',
  authenticate,
  checkAccountType(['admin']),
  [
    param('id').isInt().withMessage('申请ID必须是整数'),
    body('rejectionReason').isIn(['信息不完整', '价格不合理', '违反平台规则', '其他']).withMessage('请选择驳回原因'),
    body('rejectionDetail').optional().isString()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { rejectionReason, rejectionDetail } = req.body

    if (rejectionReason === '其他' && (!rejectionDetail || rejectionDetail.trim() === '')) {
      throw new AppError('请填写详细的驳回原因', 400, 'VALIDATION_ERROR')
    }

    const transaction = await sequelize.transaction()

    try {
      const request = await ProductPublishRequest.findByPk(id, {
        include: [{ model: User, as: 'merchant' }],
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

      const finalRejectionDetail = rejectionReason === '其他' ? rejectionDetail : null

      await request.update({
        status: 'rejected',
        rejectionReason,
        rejectionDetail: finalRejectionDetail,
        reviewerId: req.userId,
        reviewerName: req.user.name || req.user.username,
        reviewedAt: new Date()
      }, { transaction })

      await Product.destroy({
        where: {
          name: request.productName,
          userId: request.merchantId,
          status: '待审核'
        },
        transaction
      })

      const content = rejectionReason === '其他'
        ? `您的农产品"${request.productName}"发布申请未通过。原因：${rejectionDetail}`
        : `您的农产品"${request.productName}"发布申请未通过。原因：${rejectionReason}`

      await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: request.merchantId,
        receiverType: 'specific_merchant',
        receiverName: request.merchantName,
        title: '农产品发布未通过',
        content,
        type: 'system'
      }, { transaction })

      await transaction.commit()

      console.log('[ProductPublish] 审批驳回:', {
        requestId: id,
        merchantId: request.merchantId,
        reviewerId: req.userId,
        rejectionReason,
        rejectionDetail: finalRejectionDetail,
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

module.exports = router