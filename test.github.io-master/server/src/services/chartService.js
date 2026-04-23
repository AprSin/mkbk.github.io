/**
 * 图表数据生成服务
 * 负责从数据库查询数据并生成图表配置
 */

const { Order, Product, Project, User, Bid, sequelize } = require('../models')
const { Op, Sequelize } = require('sequelize')

class ChartService {
  /**
   * 生成交易趋势图表数据
   * @param {string} timeRange - 时间范围: week|month|quarter|year|all
   * @returns {Object} 图表配置数据
   */
  static async generateTransactionTrendChart(timeRange = 'year') {
    const dateRange = this.getDateRange(timeRange)
    
    let monthlyStats = []
    
    try {
      // 使用原始 SQL 查询获取月度统计数据
      monthlyStats = await sequelize.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as period,
          COUNT(id) as count,
          SUM(total_price) as amount
        FROM orders
        WHERE created_at >= :startDate AND created_at <= :endDate
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY period ASC
      `, {
        replacements: {
          startDate: dateRange.start,
          endDate: dateRange.end
        },
        type: Sequelize.QueryTypes.SELECT
      })
    } catch (error) {
      console.warn('[ChartService] 交易趋势查询失败:', error.message)
      // 返回空数据
      monthlyStats = []
    }

    // 生成图表配置
    const labels = monthlyStats.map(m => m.period)
    const counts = monthlyStats.map(m => parseInt(m.count))
    const amounts = monthlyStats.map(m => Math.round((parseFloat(m.amount) || 0) / 10000 * 100) / 100)

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '交易数量',
            data: counts,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: '交易金额 (万元)',
            data: amounts,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif',
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: '交易趋势分析',
            font: {
              family: '"Microsoft YaHei", "SimHei", sans-serif',
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: '交易数量',
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            },
            ticks: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: '交易金额 (万元)',
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            }
          }
        }
      }
    }
  }

  /**
   * 生成订单状态分布图表数据
   * @returns {Object} 图表配置数据
   */
  static async generateOrderStatusChart() {
    // 使用原始 SQL 查询
    const statusDistribution = await sequelize.query(`
      SELECT 
        status,
        COUNT(id) as count
      FROM orders
      GROUP BY status
    `, {
      type: Sequelize.QueryTypes.SELECT
    })

    const labels = statusDistribution.map(s => s.status)
    const data = statusDistribution.map(s => parseInt(s.count))
    
    // 为不同状态分配颜色
    const colorMap = {
      '已支付': '#4CAF50',
      '待发货': '#2196F3',
      '待收货': '#9C27B0',
      '已完成': '#2E7D32',
      '已取消': '#F44336',
      '退单中': '#FF9800',
      '已退单': '#795548'
    }
    
    const backgroundColor = labels.map(label => colorMap[label] || '#9E9E9E')

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif',
                size: 12
              },
              padding: 15
            }
          },
          title: {
            display: true,
            text: '订单状态分布',
            font: {
              family: '"Microsoft YaHei", "SimHei", sans-serif',
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                return `${label}: ${value} (${percentage}%)`
              }
            }
          }
        }
      }
    }
  }

  /**
   * 生成交易金额分布图表数据
   * @returns {Object} 图表配置数据
   */
  static async generateAmountDistributionChart() {
    const amountRanges = [
      { label: '0-1万', min: 0, max: 10000 },
      { label: '1-5万', min: 10000, max: 50000 },
      { label: '5-10万', min: 50000, max: 100000 },
      { label: '10-50万', min: 100000, max: 500000 },
      { label: '50-100万', min: 500000, max: 1000000 },
      { label: '100万以上', min: 1000000, max: null }
    ]

    const distribution = await Promise.all(
      amountRanges.map(async (range) => {
        const where = {
          totalPrice: {
            [Op.gte]: range.min
          }
        }
        if (range.max) {
          where.totalPrice[Op.lt] = range.max
        }
        const count = await Order.count({ where })
        return { label: range.label, count }
      })
    )

    const labels = distribution.map(d => d.label)
    const data = distribution.map(d => d.count)

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '订单数量',
          data,
          backgroundColor: [
            '#E8F5E9',
            '#C8E6C9',
            '#A5D6A7',
            '#81C784',
            '#66BB6A',
            '#4CAF50'
          ],
          borderColor: '#4CAF50',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: '交易金额分布',
            font: {
              family: '"Microsoft YaHei", "SimHei", sans-serif',
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '订单数量',
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            },
            ticks: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            }
          }
        }
      }
    }
  }

  /**
   * 生成项目类型分布图表数据
   * @returns {Object} 图表配置数据
   */
  static async generateProjectTypeChart() {
    // 使用原始 SQL 查询
    const projectTypeDistribution = await sequelize.query(`
      SELECT 
        type,
        COUNT(id) as count
      FROM projects
      GROUP BY type
    `, {
      type: Sequelize.QueryTypes.SELECT
    })

    const labels = projectTypeDistribution.map(p => p.type || '其他')
    const data = projectTypeDistribution.map(p => parseInt(p.count))

    const backgroundColor = [
      '#4CAF50',
      '#2196F3',
      '#FFC107',
      '#9C27B0',
      '#FF5722',
      '#00BCD4',
      '#795548',
      '#607D8B'
    ]

    return {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: backgroundColor.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif',
                size: 12
              },
              padding: 10
            }
          },
          title: {
            display: true,
            text: '项目类型分布',
            font: {
              family: '"Microsoft YaHei", "SimHei", sans-serif',
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    }
  }

  /**
   * 生成商户交易排行图表数据
   * @param {number} limit - 排行数量
   * @returns {Object} 图表配置数据
   */
  static async generateMerchantRankingChart(limit = 10) {
    // 使用原始 SQL 查询获取商户统计数据
    const merchantStats = await sequelize.query(`
      SELECT 
        merchant_id as merchantId,
        COUNT(id) as orderCount,
        SUM(total_price) as totalAmount
      FROM orders
      WHERE merchant_id IS NOT NULL
      GROUP BY merchant_id
      ORDER BY SUM(total_price) DESC
      LIMIT :limit
    `, {
      replacements: { limit },
      type: Sequelize.QueryTypes.SELECT
    })

    // 获取商户信息
    const merchantIds = merchantStats.map(m => m.merchantId)
    const merchants = await User.findAll({
      where: {
        id: {
          [Op.in]: merchantIds
        }
      },
      attributes: ['id', 'name', 'username'],
      raw: true
    })

    // 创建商户ID到名称的映射
    const merchantMap = {}
    merchants.forEach(m => {
      merchantMap[m.id] = m.name || m.username || '未知商户'
    })

    const labels = merchantStats.map(m => merchantMap[m.merchantId] || '未知商户')
    const data = merchantStats.map(m => Math.round((parseFloat(m.totalAmount) || 0) / 10000 * 100) / 100)

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '交易金额 (万元)',
          data,
          backgroundColor: '#4CAF50',
          borderColor: '#388E3C',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: '商户交易排行 (Top 10)',
            font: {
              family: '"Microsoft YaHei", "SimHei", sans-serif',
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '交易金额 (万元)',
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            },
            ticks: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            }
          },
          y: {
            ticks: {
              font: {
                family: '"Microsoft YaHei", "SimHei", sans-serif'
              }
            }
          }
        }
      }
    }
  }

  /**
   * 获取所有图表数据
   * @param {string} timeRange - 时间范围
   * @returns {Object} 所有图表配置
   */
  static async generateAllCharts(timeRange = 'year') {
    const [
      transactionTrend,
      orderStatus,
      amountDistribution,
      projectType,
      merchantRanking
    ] = await Promise.all([
      this.generateTransactionTrendChart(timeRange),
      this.generateOrderStatusChart(),
      this.generateAmountDistributionChart(),
      this.generateProjectTypeChart(),
      this.generateMerchantRankingChart()
    ])

    return {
      transactionTrend,
      orderStatus,
      amountDistribution,
      projectType,
      merchantRanking
    }
  }

  /**
   * 获取完整的交易大数据统计
   * @param {string} timeRange - 时间范围
   * @returns {Object} 统计数据
   */
  static async getFullStatistics(timeRange = 'year') {
    const dateRange = this.getDateRange(timeRange)
    const { Op } = require('sequelize')
    const { Project, Bid } = require('../models')

    try {
      // 基础统计数据 - 添加错误处理
      const [
        totalOrders,
        totalAmountResult,
        successOrders,
        activeUsers,
        totalProjects,
        totalProducts,
        totalBids
      ] = await Promise.all([
        Order.count({
          where: {
            createdAt: {
              [Op.gte]: dateRange.start,
              [Op.lte]: dateRange.end
            }
          }
        }).catch(() => 0),
        Order.sum('totalPrice', {
          where: {
            createdAt: {
              [Op.gte]: dateRange.start,
              [Op.lte]: dateRange.end
            }
          }
        }).catch(() => 0),
        Order.count({
          where: {
            status: '已完成',
            createdAt: {
              [Op.gte]: dateRange.start,
              [Op.lte]: dateRange.end
            }
          }
        }).catch(() => 0),
        User.count({ where: { isActive: true } }).catch(() => 0),
        Project.count().catch(() => 0),
        Product.count().catch(() => 0),
        Bid.count().catch(() => 0)
      ])

      const totalAmount = totalAmountResult || 0

      const successRate = totalOrders > 0 ? Math.round((successOrders / totalOrders) * 100) : 0

      // 最近订单详情 - 添加错误处理
      let orderDetails = []
      try {
        const recentOrders = await Order.findAll({
          limit: 20,
          order: [['createdAt', 'DESC']],
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
            { model: User, as: 'merchant', attributes: ['id', 'name', 'username'] },
            { model: User, as: 'buyer', attributes: ['id', 'name', 'username'] }
          ]
        })

        // 获取订单详情
        orderDetails = recentOrders.map(o => ({
          id: o.orderNo,
          name: o.product?.name || '未知商品',
          type: o.product ? '农产品' : '项目',
          amount: parseFloat(o.totalPrice) / 10000, // 转换为万元
          date: o.createdAt,
          status: o.status === '已完成' ? 'success' : o.status === '已取消' ? 'failed' : 'processing',
          statusText: o.status,
          merchant: o.merchant?.name || o.merchant?.username || '未知商户',
          buyer: o.buyer?.name || o.buyer?.username || '未知买家'
        }))
      } catch (err) {
        console.warn('[ChartService] 获取最近订单失败:', err.message)
        orderDetails = []
      }

      return {
        // 顶部统计卡片数据
        overview: {
          totalProjects: totalOrders + totalProjects,
          totalAmount: Math.round((totalAmount || 0) / 10000 * 100) / 100,
          successRate,
          activeUsers,
          totalOrders,
          totalProducts,
          totalBids
        },
        // 交易详情列表
        transactionDetails: orderDetails
      }
    } catch (error) {
      console.error('[ChartService] getFullStatistics 错误:', error)
      // 返回默认数据
      return {
        overview: {
          totalProjects: 0,
          totalAmount: 0,
          successRate: 0,
          activeUsers: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalBids: 0
        },
        transactionDetails: []
      }
    }
  }

  /**
   * 获取日期范围
   * @param {string} timeRange - 时间范围
   * @returns {Object} 开始和结束日期
   */
  static getDateRange(timeRange) {
    const end = new Date()
    const start = new Date()

    switch (timeRange) {
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setMonth(end.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(end.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(end.getFullYear() - 1)
        break
      case 'all':
        start.setFullYear(2000)
        break
      default:
        start.setFullYear(end.getFullYear() - 1)
    }

    return { start, end }
  }
}

module.exports = ChartService
