import { apiService } from './api'

export const authAPI = {
  async register(userData) {
    const { data, duration } = await apiService.post('/auth/register', userData)
    if (data.token) {
      apiService.setToken(data.token)
    }
    return { user: data.data?.user || data.user, token: data.data?.token || data.token, duration }
  },

  async login(username, password, accountType) {
    const { data, duration } = await apiService.post('/auth/login', { username, password, accountType })
    if (data.token) {
      apiService.setToken(data.token)
    }
    return { user: data.data?.user || data.user, token: data.data?.token || data.token, duration }
  },

  async logout() {
    try {
      await apiService.post('/auth/logout')
    } finally {
      apiService.clearToken()
    }
  },

  async getCurrentUser() {
    const { data, duration } = await apiService.get('/auth/me')
    return { user: data.data?.user, duration }
  },

  async refreshToken() {
    const { data, duration } = await apiService.post('/auth/refresh-token')
    if (data.token) {
      apiService.setToken(data.token)
    }
    return { token: data.data?.token || data.token, duration }
  },

  async forgotPassword(email) {
    const { data, duration } = await apiService.post('/auth/forgot-password', { email })
    return { message: data.message, duration }
  },

  async updateProfile(profileData) {
    const { data, duration } = await apiService.put('/users/profile', profileData)
    return { user: data.data?.user || data.user, duration }
  },

  getStatus() {
    return apiService.getConnectionStatus()
  }
}
