import { apiService } from './api'

export const orderAPI = {
  async getOrders(params = {}) {
    const { data, duration } = await apiService.get('/orders', params)
    return {
      orders: data.data?.orders || data.orders || [],
      pagination: data.data?.pagination,
      duration
    }
  },

  async getOrder(id) {
    const { data, duration } = await apiService.get(`/orders/${id}`)
    return { order: data.data?.order || data.order, duration }
  },

  async createOrder(items) {
    const { data, duration } = await apiService.post('/orders', { items })
    return { orders: data.data?.orders || data.orders, message: data.message, duration }
  },

  async payOrder(id) {
    const { data, duration } = await apiService.put(`/orders/${id}/pay`)
    return { order: data.data?.order || data.order, message: data.message, duration }
  },

  async shipOrder(id, logisticsInfo = {}) {
    const { data, duration } = await apiService.put(`/orders/${id}/ship`, logisticsInfo)
    return { order: data.data?.order || data.order, message: data.message, duration }
  },

  async confirmOrder(id) {
    const { data, duration } = await apiService.put(`/orders/${id}/confirm`)
    return { order: data.data?.order || data.order, message: data.message, duration }
  },

  async requestReturn(id, returnData) {
    const { data, duration } = await apiService.put(`/orders/${id}/return`, {
      returnType: returnData.returnType,
      reason: returnData.reason,
      quantity: returnData.quantity,
      refundMethod: returnData.refundMethod,
      images: returnData.images
    })
    return { order: data.data?.order || data.order, message: data.message, duration }
  },

  async approveReturn(id) {
    const { data, duration } = await apiService.put(`/orders/${id}/return/approve`)
    return { order: data.data?.order || data.order, message: data.message, duration }
  },

  async rejectReturn(id, reason) {
    const { data, duration } = await apiService.put(`/orders/${id}/return/reject`, { reason })
    return { order: data.data?.order || data.order, message: data.message, duration }
  },

  async submitReturnLogistics(id, logisticsData) {
    const { data, duration } = await apiService.put(`/orders/${id}/return/logistics`, {
      logisticsCompany: logisticsData.logisticsCompany,
      logisticsNumber: logisticsData.logisticsNumber
    })
    return { order: data.data?.order || data.order, message: data.message, duration }
  },

  async getBuyerOrders() {
    const { data, duration } = await apiService.get('/orders/buyer/orders')
    return { orders: data.data?.orders || data.orders || [], duration }
  },

  async getMerchantOrders() {
    const { data, duration } = await apiService.get('/orders/merchant/orders')
    return { orders: data.data?.orders || data.orders || [], duration }
  },

  async getStatistics() {
    const { data, duration } = await apiService.get('/orders/statistics')
    return { statistics: data.data, duration }
  }
}
