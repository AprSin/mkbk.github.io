import { apiService } from './api'

export const bidAPI = {
  async getBids(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.size) queryParams.append('size', params.size)
    
    const url = `/bids${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const { data, duration } = await apiService.get(url)
    console.log('[bidAPI.getBids] 原始响应数据:', JSON.stringify(data))
    const result = { 
      bids: data.data?.bids || data.bids || [], 
      pagination: data.data?.pagination || data.pagination,
      duration 
    }
    console.log('[bidAPI.getBids] 处理后的结果:', JSON.stringify(result))
    return result
  },

  async getBid(id) {
    const { data, duration } = await apiService.get(`/bids/${id}`)
    return { bid: data.data?.bid || data.bid, duration }
  },

  async createBid(projectId, amount, contact, phone) {
    const { data, duration } = await apiService.post('/bids', {
      projectId,
      amount,
      contact,
      phone
    })
    return { bid: data.data?.bid || data.bid, message: data.message, duration }
  },

  async updateBid(id, bidData) {
    const { data, duration } = await apiService.put(`/bids/${id}`, bidData)
    return { bid: data.data?.bid || data.bid, message: data.message, duration }
  },

  async cancelBid(id) {
    const { data, duration } = await apiService.delete(`/bids/${id}`)
    return { message: data.message, duration }
  },

  async acceptBid(id) {
    const { data, duration } = await apiService.put(`/bids/${id}/accept`)
    return { bid: data.data?.bid || data.bid, message: data.message, duration }
  },

  async rejectBid(id, reason) {
    const { data, duration } = await apiService.put(`/bids/${id}/reject`, { reason })
    return { bid: data.data?.bid || data.bid, message: data.message, duration }
  },

  async getProjectBids(projectId) {
    const { data, duration } = await apiService.get(`/bids/project/${projectId}/bids`)
    return { bids: data.data?.bids || data.bids || [], duration }
  }
}
