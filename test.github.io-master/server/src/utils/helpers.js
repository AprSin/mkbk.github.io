const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const SALT_ROUNDS = 16
const SALT_LENGTH = 32

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash)
}

const generateSalt = () => {
  return crypto.randomBytes(SALT_LENGTH).toString('hex')
}

const sha256Hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex')
}

const generateNonce = () => {
  return crypto.randomBytes(16).toString('hex')
}

const validatePasswordStrength = (password) => {
  const errors = []

  if (password.length < 8) {
    errors.push('密码长度至少为8位')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input
    .replace(/[<>]/g, '')
    .trim()
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateSalt,
  sha256Hash,
  generateNonce,
  validatePasswordStrength,
  sanitizeInput,
  SALT_ROUNDS,
  SALT_LENGTH
}