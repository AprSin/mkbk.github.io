const { DataLog } = require('../models')

async function logDataChange(options) {
  const {
    userId,
    action,
    entityType,
    entityId,
    changes = null,
    oldData = null,
    newData = null,
    req = null
  } = options

  try {
    await DataLog.create({
      userId,
      action,
      entityType,
      entityId,
      changes,
      oldData,
      newData,
      ipAddress: req ? (req.ip || req.connection?.remoteAddress) : null,
      userAgent: req ? (req.get('User-Agent') || req.headers?.['user-agent']) : null,
      requestId: req ? req.requestId : null
    })
  } catch (error) {
    console.error('Failed to log data change:', error.message)
  }
}

function detectChanges(oldData, newData, allowedFields) {
  const changes = {}
  const allowed = new Set(allowedFields)

  for (const key of Object.keys(newData)) {
    if (allowed.has(key) && oldData[key] !== newData[key]) {
      changes[key] = [oldData[key], newData[key]]
    }
  }

  return Object.keys(changes).length > 0 ? changes : null
}

module.exports = {
  logDataChange,
  detectChanges
}