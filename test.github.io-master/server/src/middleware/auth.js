const jwt = require('jsonwebtoken')
const { AppError } = require('./errorHandler')
const { User } = require('../models')

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

const generateToken = (user, type = 'access') => {
  const expiresIn = type === 'access' ? JWT_EXPIRES_IN : JWT_REFRESH_EXPIRES_IN
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      accountType: user.accountType
    },
    JWT_SECRET,
    { expiresIn, algorithm: 'HS256' }
  )
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch (error) {
    throw new AppError('令牌验证失败', 401, 'INVALID_TOKEN')
  }
}

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('未提供认证令牌', 401, 'NO_TOKEN')
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      throw new AppError('用户不存在', 401, 'USER_NOT_FOUND')
    }

    if (!user.isActive) {
      throw new AppError('账户已被禁用', 403, 'ACCOUNT_DISABLED')
    }

    req.user = user
    req.userId = user.id
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('令牌已过期，请重新登录', 401, 'TOKEN_EXPIRED'))
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('无效的令牌', 401, 'INVALID_TOKEN'))
    }
    next(error)
  }
}

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('未认证', 401, 'UNAUTHENTICATED'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('无权限访问此资源', 403, 'FORBIDDEN'))
    }

    next()
  }
}

const checkAccountType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('未认证', 401, 'UNAUTHENTICATED'))
    }

    if (!allowedTypes.includes(req.user.accountType)) {
      return next(new AppError('账户类型不允许执行此操作', 403, 'ACCOUNT_TYPE_NOT_ALLOWED'))
    }

    next()
  }
}

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('未认证', 401, 'UNAUTHENTICATED'))
  }

  if (req.user.accountType !== 'admin') {
    return next(new AppError('无权限访问此资源', 403, 'FORBIDDEN'))
  }

  next()
}

const verifySignature = (req, res, next) => {
  const signature = req.headers['x-signature']
  const timestamp = req.headers['x-timestamp']
  const nonce = req.headers['x-nonce']

  if (!signature || !timestamp || !nonce) {
    return next(new AppError('缺少签名参数', 401, 'MISSING_SIGNATURE'))
  }

  const timestampNum = parseInt(timestamp)
  const now = Date.now()
  const diff = Math.abs(now - timestampNum)

  if (diff > 30000) {
    return next(new AppError('请求已过期', 401, 'REQUEST_EXPIRED'))
  }

  const expectedSignature = require('crypto')
    .createHmac('sha256', process.env.SIGNATURE_SECRET || 'signature-secret')
    .update(`${timestamp}:${nonce}:${JSON.stringify(req.body)}`)
    .digest('hex')

  if (signature !== expectedSignature) {
    return next(new AppError('签名验证失败', 401, 'INVALID_SIGNATURE'))
  }

  next()
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  checkAccountType,
  adminOnly,
  verifySignature,
  JWT_SECRET,
  JWT_EXPIRES_IN
}