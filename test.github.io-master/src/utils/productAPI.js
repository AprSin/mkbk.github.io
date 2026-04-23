import { apiService } from './api'

export const productAPI = {
  async getProducts(params = {}) {
    const { data, duration } = await apiService.get('/products', params)
    return {
      products: data.data?.products || data.products || [],
      pagination: data.data?.pagination,
      duration
    }
  },

  async getProduct(id) {
    console.log('[productAPI] getProduct 调用, id:', id)
    const { data, duration } = await apiService.get(`/products/${id}`)
    console.log('[productAPI] getProduct 响应:', data)
    return { product: data.data?.product || data.product, duration }
  },

  async createProduct(productData) {
    const { data, duration } = await apiService.post('/products', productData)
    if (data.success) {
      return { success: true, message: data.message, request: data.data?.request, product: data.data?.product, duration }
    }
    return { success: false, error: data.message || '创建农产品失败' }
  },

  async updateProduct(id, productData) {
    const { data, duration } = await apiService.put(`/products/${id}`, productData)
    return { product: data.data?.product || data.product, message: data.message, duration }
  },

  async deleteProduct(id) {
    const { data, duration } = await apiService.delete(`/products/${id}`)
    return { message: data.message, duration }
  },

  async getMerchantProducts() {
    const { data, duration } = await apiService.get('/products/merchant/products')
    return { products: data.data?.products || data.products || [], duration }
  }
}
