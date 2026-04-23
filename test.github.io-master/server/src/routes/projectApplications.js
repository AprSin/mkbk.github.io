const express = require('express')
const { body, query, param, validationResult } = require('express-validator')
const { ProjectApplication, Project, User, Message } = require('../models')
const { authenticate, checkAccountType } = require('../middleware/auth')
const { asyncHandler, AppError } = require('../middleware/errorHandler')
const { Op } = require('sequelize')

const router = express.Router()

const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR')
  }
  next()
}

// 获取项目申请列表（管理员）
router.get('/',
  authenticate,
  checkAccountType(['admin']),
  [
    query('type').optional().isIn(['publish', 'modify']).withMessage('申请类型必须是publish或modify'),
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

    if (req.query.type) {
      where.type = req.query.type
    }
    if (req.query.status) {
      where.status = req.query.status
    }

    const { count, rows } = await ProjectApplication.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'username', 'name'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'status'] }
      ]
    })

    res.json({
      success: true,
      data: {
        applications: rows,
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

// 获取用户的项目申请列表
router.get('/my',
  authenticate,
  checkAccountType(['merchant']),
  asyncHandler(async (req, res) => {
    const applications = await ProjectApplication.findAll({
      where: { applicantId: req.userId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'status'] }
      ]
    })

    res.json({
      success: true,
      data: { applications }
    })
  })
)

// 创建项目发布申请
router.post('/',
  authenticate,
  checkAccountType(['merchant']),
  [
    body('projectName').trim().isLength({ min: 1, max: 200 }).withMessage('项目名称不能为空且不能超过200字符'),
    body('content').isObject().withMessage('申请内容必须是对象'),
    body('content.name').optional().trim().isLength({ min: 1, max: 200 }),
    body('content.price').optional().isFloat({ min: 0 }).withMessage('价格必须是非负数'),
    body('content.type').optional().isString(),
    body('content.location').optional().isString(),
    body('content.area').optional().isString(),
    body('content.description').optional().isString(),
    body('content.contactPerson').optional().isString(),
    body('content.contactInfo').optional().isString(),
    body('content.bidEndDate').optional().isISO8601().withMessage('截止日期格式不正确')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectName, content } = req.body

    const existingPending = await ProjectApplication.findOne({
      where: {
        applicantId: req.userId,
        projectName,
        type: 'publish',
        status: 'pending'
      }
    })

    if (existingPending) {
      throw new AppError('您已提交过相同名称的项目发布申请，请等待审核完成', 400, 'DUPLICATE_REQUEST')
    }

    const application = await ProjectApplication.create({
      type: 'publish',
      status: 'pending',
      applicantId: req.userId,
      applicantName: req.user.name || req.user.username,
      projectName,
      content
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
        content: `商户"${req.user.name || req.user.username}"提交了项目"${projectName}"的发布申请，请及时审核`,
        type: 'system'
      })
    }

    res.status(201).json({
      success: true,
      message: '项目发布申请已提交，等待管理员审核',
      data: { application }
    })
  })
)

// 创建项目修改申请
router.post('/:projectId/modify',
  authenticate,
  checkAccountType(['merchant']),
  [
    param('projectId').isInt().withMessage('项目ID必须是整数'),
    body('projectName').trim().isLength({ min: 1, max: 200 }).withMessage('项目名称不能为空'),
    body('requestedData').isObject().withMessage('申请数据必须是对象'),
    body('originalData').isObject().withMessage('原始数据必须是对象'),
    body('changedFields').isArray({ min: 1 }).withMessage('变更字段不能为空数组')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { projectName, requestedData, originalData, changedFields } = req.body

    // 检查项目是否存在且属于当前用户
    const project = await Project.findByPk(projectId)
    if (!project) {
      throw new AppError('项目不存在', 404, 'NOT_FOUND')
    }
    if (project.userId !== req.userId) {
      throw new AppError('无权修改此项目', 403, 'FORBIDDEN')
    }

    // 检查是否有待审核的申请
    const pendingRequest = await ProjectApplication.findOne({
      where: {
        projectId,
        type: 'modify',
        status: 'pending'
      }
    })

    if (pendingRequest) {
      throw new AppError('该项目有正在审核中的修改申请，请等待审核完成后再提交', 400, 'PENDING_REQUEST_EXISTS')
    }

    const application = await ProjectApplication.create({
      type: 'modify',
      status: 'pending',
      applicantId: req.userId,
      applicantName: req.user.name || req.user.username,
      projectId,
      projectName,
      content: requestedData,  // 兼容字段
      requestedData,
      originalData,
      changedFields
    })

    res.status(201).json({
      success: true,
      message: '项目修改申请已提交，等待管理员审核',
      data: { application }
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

    const application = await ProjectApplication.findByPk(id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'applicant', attributes: ['id', 'username', 'name', 'accountType'] }
      ]
    })
    if (!application) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }
    if (application.status !== 'pending') {
      throw new AppError('该申请已被处理', 400, 'ALREADY_PROCESSED')
    }

    // 更新申请状态
    await application.update({
      status: 'approved',
      reviewComment: comment || '审核通过',
      reviewerId: req.userId,
      reviewedAt: new Date()
    })

    // 根据申请类型执行相应操作
    if (application.type === 'publish') {
      // 查找已创建的项目并更新状态
      const existingProject = await Project.findOne({
        where: {
          name: application.content.name || application.projectName,
          userId: application.applicantId,
          status: '待审核'
        }
      })

      if (existingProject) {
        await existingProject.update({ status: '交易中' })
        await application.update({ projectId: existingProject.id })
      } else {
        // 如果没有找到已创建的项目，则创建一个新项目
        const projectData = application.content
        const newProject = await Project.create({
          name: projectData.name || application.projectName,
          description: projectData.description,
          price: projectData.price,
          location: projectData.location,
          area: projectData.area,
          type: projectData.type,
          contactPerson: projectData.contactPerson,
          contactInfo: projectData.contactInfo,
          bidEndDate: projectData.bidEndDate,
          userId: application.applicantId,
          status: '交易中'
        })
        await application.update({ projectId: newProject.id })
      }

      // 发送通知消息
      const receiverType = application.applicant?.accountType === 'merchant' ? 'specific_merchant' : 'specific_user'
      console.log('[项目发布审批] 创建通知消息 - 申请人ID:', application.applicantId, '申请人名称:', application.applicantName, '账户类型:', application.applicant?.accountType, 'receiverType:', receiverType)
      try {
        const msg = await Message.create({
          senderId: null,
          senderType: 'system',
          senderName: '系统',
          receiverId: application.applicantId,
          receiverType: receiverType,
          receiverName: application.applicantName,
          title: '项目发布申请已通过',
          content: `您的项目"${application.projectName}"发布申请已通过，项目已成功发布`,
          type: 'system'
        })
        console.log('[项目发布审批] 通知消息创建成功:', msg.id)
      } catch (msgErr) {
        console.error('[项目发布审批] 通知消息创建失败:', msgErr)
      }
    } else if (application.type === 'modify') {
      // 更新现有项目
      const project = await Project.findByPk(application.projectId)
      if (project) {
        const beforeUpdate = { ...project.toJSON() }
        const updateData = application.requestedData || application.content

        console.log('[项目修改审批] 开始处理项目修改申请')
        console.log('[项目修改审批] 申请ID:', id)
        console.log('[项目修改审批] 项目ID:', application.projectId)
        console.log('[项目修改审批] 变更字段:', application.changedFields)
        console.log('[项目修改审批] 更新数据:', updateData)
        console.log('[项目修改审批] 更新前:', beforeUpdate)

        await project.update({
          name: updateData.name !== undefined ? updateData.name : project.name,
          description: updateData.description !== undefined ? updateData.description : project.description,
          price: updateData.price !== undefined ? updateData.price : project.price,
          location: updateData.location !== undefined ? updateData.location : project.location,
          area: updateData.area !== undefined ? updateData.area : project.area,
          type: updateData.type !== undefined ? updateData.type : project.type,
          contactPerson: updateData.contactPerson !== undefined ? updateData.contactPerson : project.contactPerson,
          contactInfo: updateData.contactInfo !== undefined ? updateData.contactInfo : project.contactInfo,
          bidEndDate: updateData.bidEndDate !== undefined ? updateData.bidEndDate : project.bidEndDate
        })
        await project.reload()
        console.log('[项目修改审批] 更新后:', project.toJSON())
        console.log('[项目修改审批] 项目修改申请处理完成')
      }

      // 发送通知消息
      const receiverTypeModify = application.applicant?.accountType === 'merchant' ? 'specific_merchant' : 'specific_user'
      console.log('[项目修改审批] 创建通知消息 - 申请人ID:', application.applicantId, '申请人名称:', application.applicantName, '账户类型:', application.applicant?.accountType, 'receiverType:', receiverTypeModify)
      try {
        const msg = await Message.create({
          senderId: null,
          senderType: 'system',
          senderName: '系统',
          receiverId: application.applicantId,
          receiverType: receiverTypeModify,
          receiverName: application.applicantName,
          title: '项目信息修改已通过',
          content: `您的项目"${application.projectName}"信息修改申请已通过，信息修改已完成`,
          type: 'system'
        })
        console.log('[项目修改审批] 通知消息创建成功:', msg.id)
      } catch (msgErr) {
        console.error('[项目修改审批] 通知消息创建失败:', msgErr)
      }
    }

    const updatedApplication = await ProjectApplication.findByPk(id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'username', 'name'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'status'] }
      ]
    })

    res.json({
      success: true,
      message: '申请已通过',
      data: {
        application: updatedApplication,
        updatedProject: application.type === 'modify' && application.projectId
          ? await Project.findByPk(application.projectId)
          : null
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

    const application = await ProjectApplication.findByPk(id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'username', 'name', 'accountType'] }
      ]
    })
    if (!application) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }
    if (application.status !== 'pending') {
      throw new AppError('该申请已被处理', 400, 'ALREADY_PROCESSED')
    }

    const finalRejectionDetail = rejectionReason === '其他' ? rejectionDetail : null

    await application.update({
      status: 'rejected',
      rejectionReason,
      rejectionDetail: finalRejectionDetail,
      reviewerId: req.userId,
      reviewedAt: new Date()
    })

    if (application.type === 'publish') {
      await Project.destroy({
        where: {
          name: application.projectName,
          userId: application.applicantId,
          status: '待审核'
        }
      })
    }

    // 发送通知消息
    const receiverTypeReject = application.applicant?.accountType === 'merchant' ? 'specific_merchant' : 'specific_user'
    console.log('[项目申请驳回] 创建通知消息 - 申请人ID:', application.applicantId, '申请人名称:', application.applicantName, '账户类型:', application.applicant?.accountType, 'receiverType:', receiverTypeReject)
    const title = application.type === 'publish' ? '项目发布申请未通过' : '项目信息修改未通过'
    const content = application.type === 'publish'
      ? `您的项目"${application.projectName}"发布申请未通过。原因：${rejectionReason}${finalRejectionDetail ? ' - ' + finalRejectionDetail : ''}`
      : `您的项目"${application.projectName}"信息修改申请未通过。原因：${rejectionReason}${finalRejectionDetail ? ' - ' + finalRejectionDetail : ''}`

    try {
      const msg = await Message.create({
        senderId: null,
        senderType: 'system',
        senderName: '系统',
        receiverId: application.applicantId,
        receiverType: receiverTypeReject,
        receiverName: application.applicantName,
        title: title,
        content: content,
        type: 'system'
      })
      console.log('[项目申请驳回] 通知消息创建成功:', msg.id)
    } catch (msgErr) {
      console.error('[项目申请驳回] 通知消息创建失败:', msgErr)
    }

    res.json({
      success: true,
      message: '申请已驳回',
      data: { application }
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

    const application = await ProjectApplication.findByPk(id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'username', 'name'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'status'] }
      ]
    })

    if (!application) {
      throw new AppError('申请不存在', 404, 'NOT_FOUND')
    }

    // 检查权限（只有管理员或申请人本人可以查看）
    if (req.user.accountType !== 'admin' && application.applicantId !== req.userId) {
      throw new AppError('无权查看此申请', 403, 'FORBIDDEN')
    }

    res.json({
      success: true,
      data: { application }
    })
  })
)

module.exports = router
