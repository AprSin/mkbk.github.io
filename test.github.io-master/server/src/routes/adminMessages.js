/**
 * 管理员消息路由
 */

const express = require('express')
const { body, validationResult } = require('express-validator')
const { User, Product, Order, Bid, Message } = require('../models')
const { authenticate, adminOnly } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const { AppError } = require('../middleware/errorHandler')
const { Op } = require('sequelize')

const router = express.Router()

const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR')
  }
  next()
}

// 获取用户消息列表
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 20, isRead, type } = req.query
    const offset = (page - 1) * pageSize

    const where = {}

    // 构建消息查询条件
    // 使用 OR 条件组合: 
    // 1. 群发给所有用户/商户的消息 (receiverId: null)
    // 2. 特定发送给当前用户的消息 (receiverId: userId)
    
    const accountType = req.user.accountType
    
    where[Op.or] = [
      // 群发给所有用户的消息
      {
        receiverType: 'all_users',
        receiverId: null
      },
      // 群发给所有商户的消息
      ...(accountType === 'merchant' ? [{
        receiverType: 'all_merchants',
        receiverId: null
      }] : []),
      // 群发给管理员的消息
      ...(accountType === 'admin' ? [{
        receiverType: 'admin',
        receiverId: null
      }] : []),
      // 特定发送给当前用户的消息
      {
        receiverType: accountType === 'merchant' ? 'specific_merchant' : 'specific_user',
        receiverId: req.user.id
      }
    ]

    if (isRead !== undefined) {
      where.isRead = isRead === 'true'
    }

    if (type) {
      where.type = type
    }

    console.log(`[消息查询] 用户ID=${req.user.id}, 账户类型=${req.user.accountType}, 查询条件=`, JSON.stringify(where))

    const { count, rows } = await Message.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    })

    console.log(`[消息查询] 查询结果: 总数=${count}, 当前页=${rows.length}条`)
    if (rows.length > 0) {
      console.log(`[消息查询] 第一条消息:`, JSON.stringify(rows[0].toJSON()))
    }

    res.json({
      success: true,
      data: {
        messages: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  })
)

// 获取未读消息数量
router.get('/unread-count',
  authenticate,
  asyncHandler(async (req, res) => {
    const accountType = req.user.accountType
    
    const where = {
      isRead: false,
      [Op.or]: [
        // 群发给所有用户的消息
        {
          receiverType: 'all_users',
          receiverId: null
        },
        // 群发给所有商户的消息
        ...(accountType === 'merchant' ? [{
          receiverType: 'all_merchants',
          receiverId: null
        }] : []),
        // 群发给管理员的消息
        ...(accountType === 'admin' ? [{
          receiverType: 'admin',
          receiverId: null
        }] : []),
        // 特定发送给当前用户的消息
        {
          receiverType: accountType === 'merchant' ? 'specific_merchant' : 'specific_user',
          receiverId: req.user.id
        }
      ]
    }

    const count = await Message.count({ where })

    res.json({
      success: true,
      data: { count }
    })
  })
)

// 标记消息已读
router.put('/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const message = await Message.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { receiverId: req.user.id },
          { receiverId: null }
        ]
      }
    })

    if (!message) {
      throw new AppError('消息不存在', 404, 'NOT_FOUND')
    }

    await message.update({ isRead: true })

    res.json({
      success: true,
      message: '消息已标记为已读'
    })
  })
)

// 标记所有消息已读
router.put('/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = {
      isRead: false,
      [Op.or]: [
        { receiverId: req.user.id },
        { receiverId: null }
      ]
    }

    if (req.user.accountType === 'admin') {
      where.receiverType = 'admin'
    } else if (req.user.accountType === 'merchant') {
      where.receiverType = { [Op.in]: ['all_merchants', 'specific_merchant'] }
    } else {
      where.receiverType = { [Op.in]: ['all_users', 'specific_user'] }
    }

    await Message.update({ isRead: true }, { where })

    res.json({
      success: true,
      message: '所有消息已标记为已读'
    })
  })
)

// 删除消息
router.delete('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const message = await Message.findOne({
      where: {
        id: req.params.id,
        receiverId: req.user.id
      }
    })

    if (!message) {
      throw new AppError('消息不存在', 404, 'NOT_FOUND')
    }

    await message.destroy()

    res.json({
      success: true,
      message: '消息已删除'
    })
  })
)

// ========== 管理员接口 ==========

// 发送消息（管理员）
router.post('/',
  authenticate,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { receiverType, receiverId, receiverName, title, content, type = 'custom' } = req.body

    const message = await Message.create({
      senderId: req.user.id,
      senderType: req.user.accountType === 'admin' ? 'admin' : 'user',
      senderName: req.user.name || req.user.username,
      receiverType,
      receiverId: receiverType === 'specific_user' || receiverType === 'specific_merchant' ? receiverId : null,
      receiverName,
      title,
      content,
      type
    })

    res.status(201).json({
      success: true,
      message: '消息发送成功',
      data: { message }
    })
  })
)

// 获取已发送消息列表（管理员）
router.get('/sent',
  authenticate,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize

    const { count, rows } = await Message.findAndCountAll({
      where: {
        senderId: req.user.id
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    })

    res.json({
      success: true,
      data: {
        messages: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  })
)

// 删除已发送消息（管理员）
router.delete('/sent/:id',
  authenticate,
  adminOnly,
  asyncHandler(async (req, res) => {
    const message = await Message.findOne({
      where: {
        id: req.params.id,
        senderId: req.user.id
      }
    })

    if (!message) {
      throw new AppError('消息不存在', 404, 'NOT_FOUND')
    }

    await message.destroy()

    res.json({
      success: true,
      message: '消息已删除'
    })
  })
)

// 发送系统通知
router.post('/broadcast',
  authenticate,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { receiverType, receiverIds, title, content, type = 'system' } = req.body

    if (receiverType === 'all_users' || receiverType === 'all_merchants') {
      await Message.create({
        senderId: req.user.id,
        senderType: 'admin',
        senderName: req.user.name || req.user.username,
        receiverType,
        receiverId: null,
        receiverName: null,
        title,
        content,
        type
      })
    } else if (receiverType === 'specific_users' || receiverType === 'specific_merchants') {
      const users = await User.findAll({
        where: {
          id: { [Op.in]: receiverIds }
        }
      })

      for (const user of users) {
        await Message.create({
          senderId: req.user.id,
          senderType: 'admin',
          senderName: req.user.name || req.user.username,
          receiverType: receiverType === 'specific_users' ? 'specific_user' : 'specific_merchant',
          receiverId: user.id,
          receiverName: user.name || user.username,
          title,
          content,
          type
        })
      }
    }

    res.status(201).json({
      success: true,
      message: '消息发送成功'
    })
  })
)

module.exports = router
