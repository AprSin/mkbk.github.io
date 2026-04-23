const express = require('express')
const { body, validationResult } = require('express-validator')
const { User } = require('../models')
const { authenticate, authorize } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const { AppError } = require('../middleware/errorHandler')
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
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, accountType, keyword } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (role) where.role = role
    if (accountType) where.accountType = accountType
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    })

    res.json({
      success: true,
      data: {
        users: rows.map(u => u.toJSON()),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    })
  })
)

router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }

    res.json({
      success: true,
      data: { user }
    })
  })
)

router.put('/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ max: 100 }).withMessage('姓名长度不能超过100个字符'),
    body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('请提供有效的手机号码'),
    body('address').optional().trim().isLength({ max: 255 }).withMessage('地址长度不能超过255个字符'),
    body('businessLicense').optional().trim().isLength({ max: 100 }).withMessage('营业执照编号长度不能超过100个字符'),
    body('businessScope').optional().trim().isLength({ max: 1000 }).withMessage('经营范围长度不能超过1000个字符'),
    body('companyPhone').optional({ nullable: true, checkFalsy: true }).trim().custom((value) => {
      if (!value) return true
      if (/^1[3-9]\d{9}$/.test(value)) return true
      throw new Error('请提供有效的企业联系电话')
    }),
    body('companyAddress').optional().trim().isLength({ max: 255 }).withMessage('企业地址长度不能超过255个字符')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const allowedFields = ['name', 'phone', 'address', 'businessLicense', 'businessScope', 'companyPhone', 'companyAddress']
    const updates = {}

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const value = req.body[field]
        updates[field] = value ? sanitizeInput(value) : null
      }
    })

    await req.user.update(updates)

    res.json({
      success: true,
      message: '个人信息更新成功',
      data: { user: req.user.toJSON() }
    })
  })
)

router.put('/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('新密码长度至少为8位')
      .custom((value) => {
        const { validatePasswordStrength } = require('../utils/helpers')
        const result = validatePasswordStrength(value)
        if (!result.isValid) {
          throw new Error(result.errors.join(', '))
        }
        return true
      }),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('两次密码输入不一致')
      }
      return true
    })
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body

    const isMatch = await req.user.comparePassword(currentPassword)
    if (!isMatch) {
      throw new AppError('当前密码错误', 400, 'INVALID_PASSWORD')
    }

    await req.user.update({ password: newPassword })

    res.json({
      success: true,
      message: '密码修改成功'
    })
  })
)

router.put('/:id/status',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body

    const user = await User.findByPk(req.params.id)
    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }

    if (user.id === req.user.id) {
      throw new AppError('无法修改自己的状态', 400, 'CANNOT_MODIFY_SELF')
    }

    await user.update({ isActive })

    res.json({
      success: true,
      message: '用户状态更新成功'
    })
  })
)

router.delete('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id)

    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }

    if (user.id === req.user.id) {
      throw new AppError('无法删除自己', 400, 'CANNOT_DELETE_SELF')
    }

    await user.destroy()

    res.json({
      success: true,
      message: '用户删除成功'
    })
  })
)

router.get('/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const { Product, Project, Order, Bid } = require('../models')
    const { Op } = require('sequelize')

    const whereUserId = { userId: req.userId }
    const whereBuyerId = { buyerId: req.userId }
    const whereMerchantId = { merchantId: req.userId }

    const [
      productCount,
      projectCount,
      activeProductCount,
      activeProjectCount,
      shoppingOrders,
      bidOrders,
      totalSales,
      totalPurchases
    ] = await Promise.all([
      Product.count({ where: whereUserId }),
      Project.count({ where: whereUserId }),
      Product.count({ where: { ...whereUserId, status: '在售' } }),
      Project.count({ where: { ...whereUserId, status: '交易中' } }),
      Order.count({ where: { ...whereBuyerId } }),
      Bid.count({ where: { buyerId: req.userId } }),
      Order.sum('totalPrice', { where: { ...whereMerchantId, status: '已完成' } }),
      Order.sum('totalPrice', { where: { ...whereBuyerId, status: '已完成' } })
    ])

    const recentProducts = await Product.findAll({
      where: whereUserId,
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'price', 'status', 'createdAt']
    })

    const recentProjects = await Project.findAll({
      where: whereUserId,
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'price', 'status', 'createdAt']
    })

    res.json({
      success: true,
      data: {
        stats: {
          productCount,
          projectCount,
          activeProductCount,
          activeProjectCount,
          shoppingOrderCount: shoppingOrders,
          bidOrderCount: bidOrders,
          totalSales: totalSales || 0,
          totalPurchases: totalPurchases || 0
        },
        recentProducts,
        recentProjects
      }
    })
  })
)

router.get('/activities',
  authenticate,
  asyncHandler(async (req, res) => {
    const { Product, Project, Order, Bid } = require('../models')
    const { Op } = require('sequelize')
    const limit = parseInt(req.query.limit) || 10

    const [recentProducts, recentProjects, recentOrders, recentBids] = await Promise.all([
      Product.findAll({
        where: { userId: req.userId },
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'name', 'status', 'createdAt']
      }),
      Project.findAll({
        where: { userId: req.userId },
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'name', 'status', 'createdAt']
      }),
      Order.findAll({
        where: {
          [Op.or]: [{ buyerId: req.userId }, { merchantId: req.userId }]
        },
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'status', 'totalPrice', 'createdAt']
      }),
      Bid.findAll({
        where: { buyerId: req.userId },
        order: [['bidDate', 'DESC']],
        limit,
        attributes: ['id', 'amount', 'status', 'bidDate']
      })
    ])

    const activities = [
      ...recentProducts.map(p => ({
        type: 'product',
        action: '创建',
        subject: p.name,
        status: p.status,
        date: p.createdAt,
        id: p.id
      })),
      ...recentProjects.map(p => ({
        type: 'project',
        action: '创建',
        subject: p.name,
        status: p.status,
        date: p.createdAt,
        id: p.id
      })),
      ...recentOrders.map(o => ({
        type: 'order',
        action: o.buyerId === req.userId ? '购买' : '销售',
        subject: `订单#${o.id}`,
        status: o.status,
        date: o.createdAt,
        id: o.id
      })),
      ...recentBids.map(b => ({
        type: 'bid',
        action: '投标',
        subject: `投标#${b.id}`,
        status: b.status,
        date: b.bidDate,
        id: b.id
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit)

    res.json({
      success: true,
      data: { activities }
    })
  })
)

module.exports = router