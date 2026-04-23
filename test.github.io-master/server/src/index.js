require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { errorHandler } = require('./middleware/errorHandler')
const { requestLogger } = require('./middleware/logger')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const productRoutes = require('./routes/product')
const projectRoutes = require('./routes/project')
const orderRoutes = require('./routes/order')
const bidRoutes = require('./routes/bid')
const chartRoutes = require('./routes/charts')
const { sequelize, testConnection, syncDatabase } = require('./config/database')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const path = require('path')
const { autoConfirmService } = require('./services/autoConfirmService')

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Timestamp', 'X-Signature']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || require('uuid').v4()
  res.setHeader('X-Request-ID', req.requestId)
  next()
})

app.use(requestLogger)

app.get('/health', async (req, res) => {
  const dbConnection = await testConnection()
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      type: dbConnection.type,
      status: dbConnection.status,
      responseTime: dbConnection.responseTime,
      error: dbConnection.error?.message || null
    }
  })
})

app.get('/api/db/status', async (req, res) => {
  const dbConnection = await testConnection()
  res.json({
    success: true,
    data: {
      database: {
        type: dbConnection.type,
        host: dbConnection.host,
        port: dbConnection.port,
        database: dbConnection.database,
        status: dbConnection.status,
        responseTime: dbConnection.responseTime,
        error: dbConnection.error
      },
      server: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      }
    }
  })
})

try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'))
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
} catch (error) {
  console.warn('Swagger documentation not available:', error.message)
}

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/bids', bidRoutes)
app.use('/api/charts', chartRoutes)
app.use('/api/uploads', require('./routes/upload'))
app.use('/api/messages', require('./routes/adminMessages'))
app.use('/api/project-applications', require('./routes/projectApplications'))
app.use('/api/product-publish-requests', require('./routes/productPublishRequests'))
app.use('/api/user-update-requests', require('./routes/userUpdateRequests'))
app.use('/api/product-update-requests', require('./routes/productUpdateRequests'))

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在',
      requestId: req.requestId
    }
  })
})

app.use(errorHandler)

async function startServer() {
  const dbConnection = await testConnection()

  console.log('='.repeat(60))
  console.log('云上共富 - 数据库连接状态报告')
  console.log('='.repeat(60))
  console.log(`数据库类型: ${dbConnection.type}`)
  console.log(`主机地址: ${dbConnection.host}:${dbConnection.port || 'N/A'}`)
  console.log(`数据库名称: ${dbConnection.database}`)
  console.log(`连接状态: ${dbConnection.status}`)
  console.log(`响应时间: ${dbConnection.responseTime ? dbConnection.responseTime + 'ms' : 'N/A'}`)

  if (dbConnection.error) {
    console.log(`错误信息: ${dbConnection.error.message}`)
    console.log(`错误代码: ${dbConnection.error.code || 'N/A'}`)
  }
  console.log('='.repeat(60))

  if (dbConnection.status === 'failed') {
    console.warn('数据库连接失败，服务器将以受限模式启动...')
  }

  try {
    if (dbConnection.status === 'connected') {
      await syncDatabase()
      console.log('数据库表结构已同步')
    }

    app.listen(PORT, () => {
      console.log(`服务器运行端口: ${PORT}`)
      console.log(`健康检查: http://localhost:${PORT}/health`)
      console.log(`数据库状态: http://localhost:${PORT}/api/db/status`)
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`)

      // 启动自动确认收货服务
      if (dbConnection.status === 'connected') {
        autoConfirmService.start(10) // 每10分钟检查一次
        console.log('[自动确认收货] 服务已启动')
      }
    })
  } catch (error) {
    console.error('无法启动服务器:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

module.exports = app
