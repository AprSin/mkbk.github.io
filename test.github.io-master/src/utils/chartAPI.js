/**
 * 图表数据 API 工具
 * 用于获取后端生成的图表配置数据
 */

import { apiService } from './api'

export const chartAPI = {
  /**
   * 获取所有图表数据
   * @param {string} timeRange - 时间范围: week|month|quarter|year|all
   * @returns {Promise<Object>} 所有图表配置
   */
  async getAllCharts(timeRange = 'year') {
    const response = await apiService.get(`/charts/all?timeRange=${timeRange}`)
    // 后端返回格式: { success: true, data: {...} }
    return response.data?.data || {}
  },

  /**
   * 获取交易趋势图表
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 图表配置
   */
  async getTransactionTrendChart(timeRange = 'year') {
    const response = await apiService.get(`/charts/transaction-trend?timeRange=${timeRange}`)
    return response.data?.data || {}
  },

  /**
   * 获取订单状态分布图表
   * @returns {Promise<Object>} 图表配置
   */
  async getOrderStatusChart() {
    const response = await apiService.get('/charts/order-status')
    return response.data?.data || {}
  },

  /**
   * 获取交易金额分布图表
   * @returns {Promise<Object>} 图表配置
   */
  async getAmountDistributionChart() {
    const response = await apiService.get('/charts/amount-distribution')
    return response.data?.data || {}
  },

  /**
   * 获取项目类型分布图表
   * @returns {Promise<Object>} 图表配置
   */
  async getProjectTypeChart() {
    const response = await apiService.get('/charts/project-type')
    return response.data?.data || {}
  },

  /**
   * 获取商户交易排行图表
   * @param {number} limit - 排行数量
   * @returns {Promise<Object>} 图表配置
   */
  async getMerchantRankingChart(limit = 10) {
    const response = await apiService.get(`/charts/merchant-ranking?limit=${limit}`)
    return response.data?.data || {}
  },

  /**
   * 获取完整统计数据（包含概览和交易详情）
   * @param {string} timeRange - 时间范围
   * @returns {Promise<Object>} 统计数据
   */
  async getFullStatistics(timeRange = 'year') {
    const response = await apiService.get(`/charts/statistics?timeRange=${timeRange}`)
    return response.data?.data || {}
  }
}
