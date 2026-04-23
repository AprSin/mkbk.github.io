const { logger } = require('../utils/logger')

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message
  error.requestId = req.requestId

  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ')
    error = new AppError(message, 400, 'VALIDATION_ERROR')
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = '数据已存在，请勿重复添加'
    error = new AppError(message, 409, 'DUPLICATE_ENTRY')
  }

  if (err.name === 'SequelizeDatabaseError') {
    const message = process.env.NODE_ENV === 'development' 
      ? `数据库操作失败: ${err.message}` 
      : '数据库操作失败'
    error = new AppError(message, 500, 'DATABASE_ERROR')
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('无效的令牌', 401, 'INVALID_TOKEN')
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('令牌已过期', 401, 'TOKEN_EXPIRED')
  }

  const statusCode = error.statusCode || 500
  const response = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || '服务器内部错误',
      requestId: error.requestId
    }
  }

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack
  }

  logger.error(`${statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    requestId: req.requestId,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  })

  res.status(statusCode).json(response)
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = { AppError, errorHandler, asyncHandler }