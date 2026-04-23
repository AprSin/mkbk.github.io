const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { Project, ProjectApplication, sequelize } = require('../models')
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
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('type').optional().isString(),
    query('status').optional().isIn(['交易中', '已完成', '已取消']),
    query('keyword').optional().isString(),
    query('includeExpired').optional().isBoolean().withMessage('includeExpired必须是布尔值')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const where = {}

    if (req.query.type) {
      where.type = req.query.type
    }
    if (req.query.status) {
      where.status = req.query.status
    } else {
      where.status = '交易中'
    }
    if (req.query.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${sanitizeInput(req.query.keyword)}%` } },
        { description: { [Op.like]: `%${sanitizeInput(req.query.keyword)}%` } },
        { location: { [Op.like]: `%${sanitizeInput(req.query.keyword)}%` } }
      ]
    }

    // 默认过滤掉已截止的项目（除非明确指定包含已过期项目）
    const includeExpired = req.query.includeExpired === 'true'
    if (!includeExpired) {
      where[Op.or] = [
        { bidEndDate: { [Op.gt]: new Date() } },
        { bidEndDate: null }
      ]
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: require('../models').User, as: 'owner', attributes: ['id', 'username', 'name'] }]
    })

    const projectsData = rows.map(p => p.toJSON ? p.toJSON() : p)

    res.json({
      success: true,
      data: {
        projects: projectsData,
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
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: require('../models').User, as: 'owner', attributes: ['id', 'username', 'name', 'phone', 'companyAddress'] },
        { model: require('../models').Bid, as: 'bids', attributes: ['id', 'amount', 'status', 'bidDate'] }
      ]
    })

    if (!project) {
      throw new AppError('项目不存在', 404, 'NOT_FOUND')
    }

    await project.increment('viewCount')

    res.json({
      success: true,
      data: { project }
    })
  })
)

router.post('/',
  authenticate,
  checkAccountType(['merchant']),
  [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('项目名称不能为空且不能超过200字符'),
    body('description').optional().isString(),
    body('price').isFloat({ min: 0 }).withMessage('价格必须是非负数'),
    body('location').optional().isString(),
    body('area').optional().isString(),
    body('type').optional().isString(),
    body('contactPerson').optional().isString(),
    body('contactInfo').optional().isString(),
    body('bidEndDate').optional().isISO8601().withMessage('截止日期格式不正确'),
    body('attachments').optional().isArray().withMessage('附件格式不正确')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, description, price, location, area, type, contactPerson, contactInfo, bidEndDate, attachments } = req.body

    console.log('[项目发布] 收到请求 - name:', name, 'userId:', req.userId)

    const { ProjectApplication, User, Message } = require('../models')

    const content = {
      name: sanitizeInput(name),
      description: sanitizeInput(description),
      price,
      location,
      area,
      type,
      contactPerson,
      contactInfo,
      bidEndDate,
      attachments: attachments || []
    }

    const application = await ProjectApplication.create({
      type: 'publish',
      status: 'pending',
      applicantId: req.userId,
      applicantName: req.user.name || req.user.username,
      projectName: name,
      content
    })

    const project = await Project.create({
      name: sanitizeInput(name),
      description: sanitizeInput(description),
      price,
      location,
      area,
      type,
      contactPerson,
      contactInfo,
      bidEndDate,
      attachments: attachments || [],
      userId: req.userId,
      status: '待审核'
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
        title: '新的交易项目发布申请',
        content: `商户"${req.user.name || req.user.username}"提交了项目"${name}"的发布申请，请及时审核`,
        type: 'system'
      })
    }

    res.status(201).json({
      success: true,
      message: '项目发布申请已提交，等待管理员审核',
      data: { application, project }
    })
  })
)

router.put('/:id',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const project = await Project.findByPk(req.params.id)

    if (!project) {
      throw new AppError('项目不存在', 404, 'NOT_FOUND')
    }

    if (project.userId !== req.userId) {
      throw new AppError('无权修改此项目', 403, 'FORBIDDEN')
    }

    const { name, description, price, location, area, type, contactPerson, contactInfo, bidEndDate, status } = req.body

    await project.update({
      name: name ? sanitizeInput(name) : project.name,
      description: description !== undefined ? sanitizeInput(description) : project.description,
      price: price !== undefined ? price : project.price,
      location: location !== undefined ? location : project.location,
      area: area !== undefined ? area : project.area,
      type: type !== undefined ? type : project.type,
      contactPerson: contactPerson !== undefined ? contactPerson : project.contactPerson,
      contactInfo: contactInfo !== undefined ? contactInfo : project.contactInfo,
      bidEndDate: bidEndDate !== undefined ? bidEndDate : project.bidEndDate,
      status: status !== undefined ? status : project.status
    })

    res.json({
      success: true,
      message: '项目更新成功',
      data: { project }
    })
  })
)

router.delete('/:id',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction()

    try {
      const project = await Project.findByPk(req.params.id, { transaction })

      if (!project) {
        await transaction.rollback()
        throw new AppError('项目不存在', 404, 'NOT_FOUND')
      }

      if (project.userId !== req.userId) {
        await transaction.rollback()
        throw new AppError('无权删除此项目', 403, 'FORBIDDEN')
      }

      if (project.status === '待审核') {
        await ProjectApplication.destroy({
          where: {
            applicantId: project.userId,
            projectName: project.name,
            type: 'publish',
            status: 'pending'
          },
          transaction
        })
      }

      await project.destroy({ transaction })
      await transaction.commit()

      res.json({
        success: true,
        message: '项目删除成功'
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  })
)

router.get('/merchant/projects',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const { User } = require('../models')
    const projects = await Project.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: require('../models').Bid, as: 'bids' },
        { model: User, as: 'owner', attributes: ['id', 'username', 'name'] }
      ]
    })

    res.json({
      success: true,
      data: { projects }
    })
  })
)

module.exports = router
