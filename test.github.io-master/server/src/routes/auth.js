const express = require('express')
const { body, validationResult } = require('express-validator')
const { User } = require('../models')
const { generateToken, authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const { validatePasswordStrength, sanitizeInput } = require('../utils/helpers')
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

router.post('/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间'),
    body('email')
      .isEmail()
      .withMessage('请提供有效的邮箱地址')
      .normalizeEmail(),
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请提供有效的手机号码'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('密码长度至少为8位')
      .custom((value) => {
        const result = validatePasswordStrength(value)
        if (!result.isValid) {
          throw new Error(result.errors.join(', '))
        }
        return true
      }),
    body('accountType')
      .isIn(['merchant', 'buyer'])
      .withMessage('账户类型必须是商户或买家')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { username, email, phone, password, accountType, name, realName, idCard } = req.body

    const sanitizedUsername = sanitizeInput(username)
    const sanitizedEmail = sanitizeInput(email)

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: sanitizedUsername },
          { email: sanitizedEmail }
        ]
      }
    })

    if (existingUser) {
      throw new AppError('用户名或邮箱已存在', 409, 'USER_EXISTS')
    }

    const user = await User.create({
      username: sanitizedUsername,
      email: sanitizedEmail,
      phone: sanitizeInput(phone),
      password,
      accountType,
      name: name ? sanitizeInput(name) : null,
      realName: realName ? sanitizeInput(realName) : null,
      idCard: idCard ? sanitizeInput(idCard) : null
    })

    const token = generateToken(user)

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: user.toJSON(),
        token
      }
    })
  })
)

router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
    body('accountType').optional().isIn(['merchant', 'buyer', 'admin']).withMessage('账户类型无效')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { username, password, accountType } = req.body

    const sanitizedUsername = sanitizeInput(username)

    const user = await User.findOne({
      where: { username: sanitizedUsername }
    })

    if (!user) {
      throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    if (!user.isActive) {
      throw new AppError('账户已被禁用', 403, 'ACCOUNT_DISABLED')
    }

    if (user.accountType === 'admin') {
      if (accountType && accountType !== 'admin') {
        throw new AppError('账户类型不匹配', 400, 'ACCOUNT_TYPE_MISMATCH')
      }
    } else if (user.accountType !== accountType) {
      throw new AppError('账户类型不匹配', 400, 'ACCOUNT_TYPE_MISMATCH')
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    await user.update({
      lastLoginAt: new Date(),
      lastLoginIp: req.ip
    })

    const token = generateToken(user)

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: user.toJSON(),
        token,
        tokenType: 'Bearer',
        expiresIn: '2h'
      }
    })
  })
)

router.post('/refresh-token',
  authenticate,
  asyncHandler(async (req, res) => {
    const token = generateToken(req.user)
    res.json({
      success: true,
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: '2h'
      }
    })
  })
)

router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: '登出成功'
    })
  })
)

router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('请提供有效的邮箱地址').normalizeEmail()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ where: { email } })

    if (!user) {
      res.json({
        success: true,
        message: '如果邮箱存在，密码重置链接已发送'
      })
      return
    }

    res.json({
      success: true,
      message: '如果邮箱存在，密码重置链接已发送'
    })
  })
)

router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    })
  })
)

module.exports = router