import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../../utils/authAPI'
import { apiService } from '../../utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
  const connectionStatus = ref({ configured: false, serverUrl: '', tokenPresent: false })

  // 初始化时同步 token 到 apiService
  if (token.value) {
    apiService.setToken(token.value)
  }

  async function initAuth() {
    if (!token.value) return { success: false, reason: 'no_token' }
    try {
      const result = await authAPI.getCurrentUser()
      userInfo.value = result.user
      localStorage.setItem('userInfo', JSON.stringify(result.user))
      return { success: true, user: result.user }
    } catch (error) {
      if (error.statusCode === 401) {
        token.value = ''
        userInfo.value = {}
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        apiService.clearToken()
        return { success: false, reason: 'invalid_token' }
      }
      return { success: false, error: error.message }
    }
  }

  const isLoggedIn = computed(() => !!token.value)
  const isMerchant = computed(() => userInfo.value.accountType === 'merchant')
  const isBuyer = computed(() => userInfo.value.accountType === 'buyer')
  const isAdmin = computed(() => userInfo.value.accountType === 'admin')

  function initConnectionStatus() {
    connectionStatus.value = authAPI.getStatus()
  }

  async function login(username, password, accountType) {
    try {
      const result = await authAPI.login(username, password, accountType)
      token.value = result.token
      userInfo.value = result.user
      localStorage.setItem('token', result.token)
      localStorage.setItem('userInfo', JSON.stringify(result.user))
      apiService.setToken(result.token)
      return { success: true, duration: result.duration }
    } catch (error) {
      return { success: false, error: error.message, code: error.code }
    }
  }

  async function register(userData) {
    try {
      const result = await authAPI.register(userData)
      token.value = result.token
      userInfo.value = result.user
      localStorage.setItem('token', result.token)
      localStorage.setItem('userInfo', JSON.stringify(result.user))
      apiService.setToken(result.token)
      return { success: true, duration: result.duration }
    } catch (error) {
      return { success: false, error: error.message, code: error.code }
    }
  }

  async function logout() {
    try {
      await authAPI.logout()
    } catch (error) {
      console.warn('Logout API call failed:', error.message)
    } finally {
      token.value = ''
      userInfo.value = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      apiService.clearToken()
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return { success: false }
    try {
      const result = await authAPI.getCurrentUser()
      userInfo.value = result.user
      localStorage.setItem('userInfo', JSON.stringify(result.user))
      return { success: true, user: result.user }
    } catch (error) {
      if (error.statusCode === 401) {
        logout()
      }
      return { success: false, error: error.message }
    }
  }

  function updateUserInfo(data) {
    userInfo.value = { ...userInfo.value, ...data }
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isMerchant,
    isBuyer,
    isAdmin,
    connectionStatus,
    initConnectionStatus,
    initAuth,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateUserInfo
  }
})
