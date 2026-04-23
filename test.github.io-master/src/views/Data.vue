<template>
  <div class="data-container">
    <h1>交易大数据</h1>
    
    <div class="time-filter">
      <label>时间范围</label>
      <select v-model="timeRange">
        <option value="week">近一周</option>
        <option value="month">近一个月</option>
        <option value="quarter">近三个月</option>
        <option value="year">近一年</option>
        <option value="all">全部</option>
      </select>
    </div>
    
    <div class="data-overview">
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalProjects }}</div>
          <div class="stat-label">累计交易项目</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalAmount }}</div>
          <div class="stat-label">累计交易金额 (万元)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ successRate }}%</div>
          <div class="stat-label">交易成功率</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ activeUsers }}</div>
          <div class="stat-label">活跃用户数</div>
        </div>
      </div>
    </div>
    
    <div class="chart-section">
      <div class="chart-card">
        <h2>交易趋势</h2>
        <div class="chart-container">
          <canvas id="transactionTrendChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h2>交易类型分布</h2>
        <div class="chart-container">
          <canvas id="transactionTypeChart"></canvas>
        </div>
      </div>
    </div>
    
    <div class="chart-section">
      <div class="chart-card">
        <h2>项目类型分布</h2>
        <div class="chart-container">
          <canvas id="regionDistributionChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h2>交易金额分布</h2>
        <div class="chart-container">
          <canvas id="amountDistributionChart"></canvas>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <div class="chart-card full-width">
        <h2>商户交易排行</h2>
        <div class="chart-container">
          <canvas id="merchantRankingChart"></canvas>
        </div>
      </div>
    </div>
    
    <div class="data-details">
      <h2>交易详情</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>项目编号</th>
              <th>项目名称</th>
              <th>交易类型</th>
              <th>交易金额 (万元)</th>
              <th>交易日期</th>
              <th>交易状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in transactionDetails" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.type }}</td>
              <td>{{ formatAmount(item.amount) }}</td>
              <td>{{ formatDate(item.date) }}</td>
              <td>
                <span :class="['status-badge', item.status]">
                  {{ item.statusText }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { orderAPI } from '@/utils/orderAPI'
import { chartAPI } from '@/utils/chartAPI'
import Chart from 'chart.js/auto'

export default {
  name: 'Data',
  data() {
    return {
      timeRange: 'year',
      totalProjects: 0,
      totalAmount: 0,
      successRate: 0,
      activeUsers: 0,
      loading: false,
      error: null,
      transactionDetails: [],
      // 图表配置（从后端获取）
      chartConfigs: {
        transactionTrend: null,
        orderStatus: null,
        amountDistribution: null,
        projectType: null,
        merchantRanking: null
      },
      // Chart.js 实例
      chartInstances: {}
    }
  },
  watch: {
    timeRange(newVal) {
      // 时间范围变化时，同时更新统计数据和图表
      this.loadStatistics()
      this.loadCharts()
    }
  },
  async mounted() {
    await this.loadStatistics()
    await this.loadCharts()
  },
  beforeUnmount() {
    // 销毁所有图表实例
    Object.values(this.chartInstances).forEach(chart => {
      if (chart) chart.destroy()
    })
  },
  methods: {
    async loadStatistics() {
      this.loading = true
      this.error = null
      try {
        // 使用新的图表统计API获取完整数据
        const result = await chartAPI.getFullStatistics(this.timeRange)
        if (result.overview) {
          this.totalProjects = result.overview.totalProjects || 0
          this.totalAmount = result.overview.totalAmount || 0
          this.successRate = result.overview.successRate || 0
          this.activeUsers = result.overview.activeUsers || 0
        }
        if (result.transactionDetails) {
          this.transactionDetails = result.transactionDetails
        }
      } catch (error) {
        console.error('Failed to load statistics:', error)
        this.error = '加载统计数据失败'
      } finally {
        this.loading = false
      }
    },

    /**
     * 从后端加载图表配置数据
     */
    async loadCharts() {
      try {
        console.log('开始加载图表数据...')
        const charts = await chartAPI.getAllCharts(this.timeRange)
        console.log('获取到的图表数据:', charts)
        this.chartConfigs = charts
        console.log('chartConfigs 已设置:', this.chartConfigs)
        this.$nextTick(() => {
          console.log('开始渲染图表...')
          this.renderCharts()
        })
      } catch (error) {
        console.error('Failed to load charts:', error)
        this.error = '加载图表数据失败'
      }
    },

    /**
     * 渲染所有图表
     */
    renderCharts() {
      // 销毁旧实例
      Object.values(this.chartInstances).forEach(chart => {
        if (chart) chart.destroy()
      })
      this.chartInstances = {}

      // 渲染交易趋势图
      this.renderChart('transactionTrendChart', this.chartConfigs.transactionTrend)

      // 渲染订单状态分布图
      this.renderChart('transactionTypeChart', this.chartConfigs.orderStatus)

      // 渲染项目类型分布图
      this.renderChart('regionDistributionChart', this.chartConfigs.projectType)

      // 渲染交易金额分布图
      this.renderChart('amountDistributionChart', this.chartConfigs.amountDistribution)

      // 渲染商户排行图（新增）
      this.renderChart('merchantRankingChart', this.chartConfigs.merchantRanking)
    },

    /**
     * 渲染单个图表
     * @param {string} canvasId - Canvas 元素 ID
     * @param {Object} config - 图表配置
     */
    renderChart(canvasId, config) {
      console.log(`渲染图表 ${canvasId}:`, config)
      if (!config) {
        console.log(`图表 ${canvasId} 配置为空，跳过`)
        return
      }

      const canvas = document.getElementById(canvasId)
      if (!canvas) {
        console.log(`Canvas ${canvasId} 不存在，跳过`)
        return
      }

      const ctx = canvas.getContext('2d')

      // 创建 Chart.js 实例
      try {
        this.chartInstances[canvasId] = new Chart(ctx, config)
        console.log(`图表 ${canvasId} 渲染成功`)
      } catch (error) {
        console.error(`图表 ${canvasId} 渲染失败:`, error)
      }
    },

    /**
     * 格式化金额
     */
    formatAmount(amount) {
      if (amount === undefined || amount === null) return '0.00'
      return parseFloat(amount).toFixed(2)
    },

    /**
     * 格式化日期
     */
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.data-container {
  padding: 20px;
}

.time-filter {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-filter label {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.time-filter select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.data-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  background-color: rgba(76, 175, 80, 0.1);
  padding: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.chart-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.chart-container {
  height: 300px;
  position: relative;
}

.data-details {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.data-details h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 500;
  color: #333;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.success {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.status-badge.processing {
  background-color: rgba(255, 193, 7, 0.1);
  color: #FFC107;
}

.status-badge.failed {
  background-color: rgba(244, 67, 54, 0.1);
  color: #F44336;
}

@media (max-width: 768px) {
  .data-overview {
    grid-template-columns: 1fr;
  }
  
  .chart-section {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .time-filter {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .time-filter select {
    width: 100%;
  }
}
</style>
