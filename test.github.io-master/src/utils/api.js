const API_BASE_URL = '/api'
const REQUEST_TIMEOUT = 30000
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

let activeRequests = 0
let requestIdCounter = 0

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('token') || ''
    this.pendingControllers = new Map()
  }

  setToken(token) {
    this.token = token
  }

  clearToken() {
    this.token = ''
  }

  cancelPendingRequests() {
    this.pendingControllers.forEach(controller => {
      try {
        controller.abort()
      } catch (e) {}
    })
    this.pendingControllers.clear()
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async requestWithRetry(url, options = {}, retries = MAX_RETRIES) {
    const startTime = Date.now()
    const requestId = ++requestIdCounter
    console.log(`[API] 请求开始 #${requestId}: ${options.method || 'GET'} ${url}, 超时设置: ${REQUEST_TIMEOUT}ms`)
    
    const controller = new AbortController()
    this.pendingControllers.set(requestId, controller)

    const timeoutId = setTimeout(() => {
      if (this.pendingControllers.has(requestId)) {
        const elapsed = Date.now() - startTime
        console.log(`[API] 请求超时 #${requestId}, 已耗时: ${elapsed}ms, 正在取消`)
        controller.abort()
      }
    }, REQUEST_TIMEOUT)

    try {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, {
            ...options,
            headers: { ...this.getHeaders(), ...options.headers },
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          const data = await response.json()
          const endTime = Date.now()
          const duration = endTime - startTime

          if (!response.ok) {
            if (response.status === 401 && attempt < retries) {
              this.handleTokenExpiry()
              await this.delay(RETRY_DELAY * attempt)
              continue
            }
            throw new ApiError(
              data.error?.message || '请求失败',
              response.status,
              data.error?.code,
              { duration, requestId: data.error?.requestId }
            )
          }

          console.log(`[API] 请求成功 #${requestId}: ${url}, 耗时: ${duration}ms`)
          return { data, duration, status: response.status }
        } catch (error) {
          if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
            console.log(`[API] 请求被取消 #${requestId}: ${url}`)
            throw new ApiError('请求已被取消', 0, 'CANCELLED')
          }
          
          if (attempt === retries) {
            throw new ApiError(`请求失败: ${error.message}`, 500, 'UNKNOWN_ERROR')
          }

          if (attempt < retries && error.name !== 'AbortError') {
            await this.delay(RETRY_DELAY * attempt)
          }
        }
      }
    } finally {
      clearTimeout(timeoutId)
      this.pendingControllers.delete(requestId)
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  handleTokenExpiry() {
    this.clearToken()
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    window.dispatchEvent(new CustomEvent('token-expired'))
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${this.baseURL}${endpoint}?${queryString}` : `${this.baseURL}${endpoint}`
    return this.requestWithRetry(url, { method: 'GET' })
  }

  async post(endpoint, data = {}) {
    return this.requestWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint, data = {}) {
    return this.requestWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint) {
    return this.requestWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'DELETE'
    })
  }

  async upload(endpoint, formData) {
    const startTime = Date.now()
    const requestId = ++requestIdCounter
    const controller = new AbortController()
    this.pendingControllers.set(requestId, controller)

    const timeoutId = setTimeout(() => {
      if (this.pendingControllers.has(requestId)) {
        controller.abort()
      }
    }, REQUEST_TIMEOUT * 10)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      const endTime = Date.now()
      const duration = endTime - startTime

      if (!response.ok) {
        throw new ApiError(
          data.error?.message || '上传失败',
          response.status,
          data.error?.code,
          { duration, requestId: data.error?.requestId }
        )
      }

      return { data, duration, status: response.status }
    } catch (error) {
      if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new ApiError('上传已被取消', 0, 'CANCELLED')
      }
      throw new ApiError(`上传失败: ${error.message}`, 500, 'UNKNOWN_ERROR')
    } finally {
      clearTimeout(timeoutId)
      this.pendingControllers.delete(requestId)
    }
  }

  getConnectionStatus() {
    return {
      serverUrl: this.baseURL,
      configured: true,
      tokenPresent: !!this.token
    }
  }
}

class ApiError extends Error {
  constructor(message, statusCode, code, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

const apiService = new ApiService()

// 农产品修改申请API
export const productUpdateAPI = {
  async createRequest(data) {
    const response = await apiService.post('/product-update-requests', data)
    return response.data
  },
  async getMyRequests() {
    const response = await apiService.get('/product-update-requests/my')
    return response.data
  },
  async getRequest(id) {
    const response = await apiService.get(`/product-update-requests/${id}`)
    return response.data
  }
}

export { apiService, ApiError, API_BASE_URL }
