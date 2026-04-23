const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { Product, User, ProductPublishRequest, sequelize } = require('../models')
const { authenticate, checkAccountType } = require('../middleware/auth')
const { asyncHandler, AppError } = require('../middleware/errorHandler')
const { sanitizeInput } = require('../utils/helpers')
const { logDataChange, detectChanges } = require('../utils/dataLog')
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
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('category').optional().isString(),
    query('status').optional().isIn(['在售', '已售罄', '下架']),
    query('keyword').optional().isString()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const where = {}

    if (req.query.category) {
      where.category = req.query.category
    }
    if (req.query.status) {
      where.status = req.query.status
    }
    if (req.query.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${sanitizeInput(req.query.keyword)}%` } },
        { description: { [Op.like]: `%${sanitizeInput(req.query.keyword)}%` } }
      ]
    }

    // 使用 findAndCountAll 获取准确的总数
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      paranoid: false,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'username', 'name'] }
      ],
      distinct: true  // 确保关联查询时计数准确
    })

    const productsData = rows.map(p => p.toJSON ? p.toJSON() : p)

    res.json({
      success: true,
      data: {
        products: productsData,
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
  asyncHandler(async (req, res) => {
    console.log(`[商品详情] 开始查询商品ID: ${req.params.id}`)
    try {
      const product = await Product.findByPk(req.params.id, {
        paranoid: false,
        include: [{
          model: User,
          as: 'seller',
            attributes: [
            'id', 'username', 'name', 'phone', 'address',
            'businessScope', 'companyAddress', 'companyPhone'
          ]
        }]
      })
      console.log(`[商品详情] 查询完成, 商品存在: ${!!product}`)

      if (!product) {
        throw new AppError('商品不存在', 404, 'NOT_FOUND')
      }

      console.log(`[商品详情] 开始增加浏览量`)
      await product.increment('viewCount')
      console.log(`[商品详情] 浏览量增加完成`)

      console.log(`[商品详情] 发送响应`)
      res.json({
        success: true,
        data: { product }
      })
      console.log(`[商品详情] 响应已发送`)
    } catch (error) {
      console.error('[商品详情] 错误:', error.parent || error);
      throw error;
    }
  })
)

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

    console.log('[农产品发布] 收到请求 - name:', name, 'userId:', req.userId)

    const { ProductPublishRequest, User, Message } = require('../models')

    const productPayload = {
      name: sanitizeInput(name),
      description: sanitizeInput(description),
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      origin: origin || '',
      category: category || '',
      image: image || '',
      shippingTime: shippingTime || '24小时内发货',
      userId: req.userId,
      status: '待审核'
    }

    console.log('[农产品发布] productPayload:', JSON.stringify(productPayload))

    let request
    let product

    try {
      request = await ProductPublishRequest.create({
        status: 'pending',
        merchantId: req.userId,
        merchantName: req.user.name || req.user.username,
        productName: name,
        productData: productPayload
      })
      console.log('[农产品发布] ProductPublishRequest 创建成功, id:', request.id)
    } catch (err) {
      console.error('[农产品发布] ProductPublishRequest 创建失败:', err)
      throw err
    }

    try {
      product = await Product.create({
        name: sanitizeInput(name),
        description: sanitizeInput(description),
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        origin: origin || '',
        category: category || '',
        image: image || '',
        shippingTime: shippingTime || '24小时内发货',
        userId: req.userId,
        status: '待审核'
      })
      console.log('[农产品发布] Product 创建成功, id:', product.id)
    } catch (err) {
      console.error('[农产品发布] Product 创建失败:', err)
      throw err
    }

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
      data: { request, product }
    })
  })
)

router.put('/:id',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id)

    if (!product) {
      throw new AppError('商品不存在', 404, 'NOT_FOUND')
    }

    if (product.userId !== req.userId) {
      throw new AppError('无权修改此商品', 403, 'FORBIDDEN')
    }

    const { name, description, price, stock, origin, category, image, status, shippingTime } = req.body
    const oldData = product.toJSON()

    await product.update({
      name: name ? sanitizeInput(name) : product.name,
      description: description !== undefined ? sanitizeInput(description) : product.description,
      price: price !== undefined ? price : product.price,
      stock: stock !== undefined ? stock : product.stock,
      origin: origin !== undefined ? origin : product.origin,
      category: category !== undefined ? category : product.category,
      image: image !== undefined ? image : product.image,
      status: status !== undefined ? status : product.status,
      shippingTime: shippingTime !== undefined ? shippingTime : product.shippingTime
    })

    const changes = detectChanges(oldData, product.toJSON(), ['name', 'description', 'price', 'stock', 'origin', 'category', 'image', 'status'])
    await logDataChange({
      userId: req.userId,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: product.id,
      changes,
      oldData,
      newData: product.toJSON(),
      req
    })

    res.json({
      success: true,
      message: '商品更新成功',
      data: { product }
    })
  })
)

router.delete('/:id',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction()

    try {
      const product = await Product.findByPk(req.params.id, { transaction })

      if (!product) {
        await transaction.rollback()
        throw new AppError('商品不存在', 404, 'NOT_FOUND')
      }

      if (product.userId !== req.userId) {
        await transaction.rollback()
        throw new AppError('无权删除此商品', 403, 'FORBIDDEN')
      }

      if (product.status === '待审核') {
        await ProductPublishRequest.destroy({
          where: {
            productName: product.name,
            merchantId: product.userId,
            status: 'pending'
          },
          transaction
        })
      }

      const oldData = product.toJSON()
      await product.destroy({ transaction })

      await logDataChange({
        userId: req.userId,
        action: 'DELETE',
        entityType: 'Product',
        entityId: oldData.id,
        oldData,
        req
      })

      await transaction.commit()

      res.json({
        success: true,
        message: '商品删除成功'
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  })
)

router.get('/merchant/products',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const { User } = require('../models')
    const products = await Product.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'seller', attributes: ['id', 'username', 'name'] }
      ]
    })

    res.json({
      success: true,
      data: { products }
    })
  })
)

module.exports = router
