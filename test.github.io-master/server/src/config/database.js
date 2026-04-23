const { Sequelize } = require('sequelize')
const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'
const dbType = process.env.DB_TYPE || (isProduction ? 'mysql' : 'sqlite')

let sequelize

if (dbType === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'cloud_prosperity',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
        evict: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      },
      dialectOptions: {
        connectTimeout: 10000
      }
    }
  )
} else {
  const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite')
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  })
}

async function testConnection() {
  const connectionInfo = {
    type: dbType,
    host: dbType === 'mysql' ? (process.env.DB_HOST || 'localhost') : 'local',
    port: dbType === 'mysql' ? (process.env.DB_PORT || 3306) : null,
    database: dbType === 'mysql' ? (process.env.DB_NAME || 'cloud_prosperity') : path.join(__dirname, '..', 'data', 'database.sqlite'),
    status: 'disconnected',
    responseTime: null,
    error: null
  }

  const startTime = Date.now()

  try {
    await sequelize.authenticate({
      logging: false
    })
    connectionInfo.responseTime = Date.now() - startTime
    connectionInfo.status = 'connected'
  } catch (error) {
    connectionInfo.responseTime = Date.now() - startTime
    connectionInfo.status = 'failed'
    connectionInfo.error = {
      message: error.message,
      name: error.name,
      code: error.original?.code || null
    }
  }

  return connectionInfo
}

async function syncDatabase() {
  const syncOptions = {
    force: false,
    alter: false
  }

  try {
    await sequelize.sync(syncOptions)
    console.log('数据库表结构已同步')
  } catch (error) {
    console.warn('数据库同步警告:', error.message)
  }
}

module.exports = { sequelize, testConnection, syncDatabase, dbType }
