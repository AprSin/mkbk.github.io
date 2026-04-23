/**
 * 图表数据 API 路由
 * 提供图表配置数据，支持前端直接渲染
 */

const express = require('express')
const { query, validationResult } = require('express-validator')
const ChartService = require('../services/chartService')
const { asyncHandler, AppError } = require('../middleware/errorHandler')

const router = express.Router()

const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR')
  }
  next()
}

/**
 * 获取所有图表数据
 * GET /api/charts/all
 */
router.get('/all',
  [
    query('timeRange').optional().isIn(['week', 'month', 'quarter', 'year', 'all'])
      .withMessage('时间范围必须是: week, month, quarter, year, all')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const timeRange = req.query.timeRange || 'year'
    
    const charts = await ChartService.generateAllCharts(timeRange)
    
    res.json({
      success: true,
      data: charts,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })
  })
)

/**
 * 获取交易趋势图表
 * GET /api/charts/transaction-trend
 */
router.get('/transaction-trend',
  [
    query('timeRange').optional().isIn(['week', 'month', 'quarter', 'year', 'all'])
      .withMessage('时间范围必须是: week, month, quarter, year, all')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const timeRange = req.query.timeRange || 'year'
    
    const chartConfig = await ChartService.generateTransactionTrendChart(timeRange)
    
    res.json({
      success: true,
      data: chartConfig,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })
  })
)

/**
 * 获取订单状态分布图表
 * GET /api/charts/order-status
 */
router.get('/order-status',
  asyncHandler(async (req, res) => {
    const chartConfig = await ChartService.generateOrderStatusChart()
    
    res.json({
      success: true,
      data: chartConfig,
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  })
)

/**
 * 获取交易金额分布图表
 * GET /api/charts/amount-distribution
 */
router.get('/amount-distribution',
  asyncHandler(async (req, res) => {
    const chartConfig = await ChartService.generateAmountDistributionChart()
    
    res.json({
      success: true,
      data: chartConfig,
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  })
)

/**
 * 获取项目类型分布图表
 * GET /api/charts/project-type
 */
router.get('/project-type',
  asyncHandler(async (req, res) => {
    const chartConfig = await ChartService.generateProjectTypeChart()
    
    res.json({
      success: true,
      data: chartConfig,
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  })
)

/**
 * 获取商户交易排行图表
 * GET /api/charts/merchant-ranking
 */
router.get('/merchant-ranking',
  [
    query('limit').optional().isInt({ min: 5, max: 20 })
      .withMessage('排行数量必须在5-20之间')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10
    
    const chartConfig = await ChartService.generateMerchantRankingChart(limit)
    
    res.json({
      success: true,
      data: chartConfig,
      meta: {
        limit,
        generatedAt: new Date().toISOString()
      }
    })
  })
)

/**
 * 获取完整统计数据（包含概览和交易详情）
 * GET /api/charts/statistics
 */
router.get('/statistics',
  [
    query('timeRange').optional().isIn(['week', 'month', 'quarter', 'year', 'all'])
      .withMessage('时间范围必须是: week, month, quarter, year, all')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const timeRange = req.query.timeRange || 'year'
    
    const statistics = await ChartService.getFullStatistics(timeRange)
    
    res.json({
      success: true,
      data: statistics,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })
  })
)

module.exports = router
