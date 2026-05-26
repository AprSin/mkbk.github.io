<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <!-- 平台昵称和Logo -->
      <div class="top-bar">
        <div class="top-container">
          <div class="logo-section">
            <router-link to="/">
              <img src="https://i.postimg.cc/YCfLYWDq/9b4d50260b05d6441d441d5a9b346550.png" alt="云上共富" class="logo-image">
            </router-link>
            <div class="platform-info">
              <h1 class="platform-name">云上共富</h1>
              <p class="platform-subtitle">基于AIOT的农村集体经济数字化平台</p>
            </div>
          </div>
          <Search />
          <div class="user-section">
            <div v-if="userStore.isLoggedIn" class="user-info" @click="goToUserCenter">
              <span class="user-name">
                {{ userStore.userInfo.name || userStore.userInfo.username }}
                <span v-if="userStore.isAdmin" class="account-type-tag admin">管理员</span>
                <span v-else-if="userStore.isMerchant" class="account-type-tag">商户</span>
                <span v-else class="account-type-tag buyer">买家</span>
              </span>
              <button class="logout-btn" @click.stop="handleLogout">退出</button>
            </div>
            <div v-else class="login-btn" @click="showLoginDialog = true">
              <div class="avatar-placeholder">
                <span>登录</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 导航菜单 - 桌面端 -->
      <div class="nav-container desktop-nav">
        <nav class="nav">
          <div class="nav-grid">
            <router-link to="/" class="nav-item">
              <span class="nav-text">首页</span>
            </router-link>
            <router-link to="/projects" class="nav-item">
              <span class="nav-text">交易项目</span>
            </router-link>
            <router-link to="/products" class="nav-item">
              <span class="nav-text">农产品交易</span>
            </router-link>
            <router-link to="/notices" class="nav-item">
              <span class="nav-text">通知公告</span>
            </router-link>
            <router-link to="/data" class="nav-item">
              <span class="nav-text">交易大数据</span>
            </router-link>
            <router-link to="/guide" class="nav-item">
              <span class="nav-text">交易指南</span>
            </router-link>
            <router-link to="/download" class="nav-item">
              <span class="nav-text">资料下载</span>
            </router-link>
            <router-link to="/contact" class="nav-item">
              <span class="nav-text">联系我们</span>
            </router-link>
          </div>
        </nav>
      </div>

      <!-- 导航菜单 - 手机端 (固定在底部) -->
      <nav class="mobile-nav">
        <router-link to="/" class="mobile-nav-item" :class="{ active: $route.path === '/' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>首页</span>
        </router-link>
        <router-link to="/projects" class="mobile-nav-item" :class="{ active: $route.path === '/projects' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>项目</span>
        </router-link>
        <router-link to="/products" class="mobile-nav-item" :class="{ active: $route.path === '/products' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>农产品</span>
        </router-link>
        <router-link to="/data" class="mobile-nav-item" :class="{ active: $route.path === '/data' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>数据</span>
        </router-link>
        <router-link to="/user" class="mobile-nav-item" :class="{ active: $route.path === '/user' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>我的</span>
        </router-link>
      </nav>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-logo">
          <img src="https://i.postimg.cc/YCfLYWDq/9b4d50260b05d6441d441d5a9b346550.png" alt="云上共富">
          <div class="footer-info">
            <h2>云上共富</h2>
            <p>基于AIOT的农村集体经济数字化平台</p>
          </div>
        </div>
        <div class="footer-links">
          <router-link to="/">首页</router-link>
          <router-link to="/projects">交易项目</router-link>
          <router-link to="/products">农产品交易</router-link>
          <router-link to="/notices">通知公告</router-link>
          <router-link to="/data">交易大数据</router-link>
          <router-link to="/guide">交易指南</router-link>
          <router-link to="/download">资料下载</router-link>
          <router-link to="/contact">联系我们</router-link>
        </div>
        <div class="footer-bottom">
          <p>赋能农村经济数字化</p>
          <p>由共富云创团队制</p>
          <p>Copyright © 2026 All Right Reserved</p>
        </div>
      </div>
    </footer>

    <!-- 登录弹窗 -->
    <div v-if="showLoginDialog" class="login-dialog-overlay" @click="closeLoginDialog">
      <div class="login-dialog" @click.stop>
        <div class="login-dialog-header">
          <div class="login-dialog-logo">
            <img src="https://i.postimg.cc/YCfLYWDq/9b4d50260b05d6441d441d5a9b346550.png" alt="云上共富">
            <h3>云上共富</h3>
          </div>
          <button class="login-dialog-close" @click="closeLoginDialog">×</button>
        </div>
        <div class="login-dialog-body">
          <!-- 账户类型选择标签 -->
          <div v-if="loginTab === 'login' || loginTab === 'register'" class="account-type-tabs">
            <button
              :class="{ active: selectedAccountType === 'buyer' }"
              @click="selectedAccountType = 'buyer'"
              type="button"
            >
              买家登录
            </button>
            <button
              :class="{ active: selectedAccountType === 'merchant' }"
              @click="selectedAccountType = 'merchant'"
              type="button"
            >
              商户登录
            </button>
            <button
              :class="{ active: selectedAccountType === 'admin' }"
              @click="selectedAccountType = 'admin'"
              type="button"
            >
              管理员登录
            </button>
          </div>

          <!-- 登录表单 -->
          <form v-if="loginTab === 'login'" class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="login-username">用户名/手机号</label>
              <input
                type="text"
                id="login-username"
                v-model="loginForm.username"
                class="form-input"
                placeholder="请输入用户名或手机号"
                required
                :disabled="loggingIn"
              >
            </div>
            <div class="form-group">
              <label for="login-password">密码</label>
              <input
                type="password"
                id="login-password"
                v-model="loginForm.password"
                class="form-input"
                placeholder="请输入密码"
                required
                :disabled="loggingIn"
              >
            </div>
            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" v-model="loginForm.rememberMe" :disabled="loggingIn">
                <span>记住我</span>
              </label>
              <a href="#" class="forgot-password" @click.prevent="showForgotPassword">忘记密码？</a>
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary login-btn" :disabled="loggingIn">
                {{ loggingIn ? '登录中...' : '登录' }}
              </button>
            </div>
            <div class="form-footer">
              <span>还没有账号？</span>
              <a href="#" @click.prevent="loginTab = 'register'">立即注册</a>
            </div>
          </form>

          <!-- 注册表单 -->
          <form v-else-if="loginTab === 'register'" class="login-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label>账户类型</label>
              <div class="account-type-radio">
                <label class="radio-label">
                  <input type="radio" v-model="registerForm.accountType" value="buyer" checked>
                  <span>买家账号</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="registerForm.accountType" value="merchant">
                  <span>商户账号</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label for="register-username">用户名</label>
              <input type="text" id="register-username" v-model="registerForm.username" class="form-input" placeholder="请输入用户名" required>
            </div>
            <div class="form-group">
              <label for="register-realname">真实姓名 <span class="required">*</span></label>
              <input type="text" id="register-realname" v-model="registerForm.realName" class="form-input" placeholder="请输入真实姓名" required>
            </div>
            <div class="form-group">
              <label for="register-idcard">身份证号 <span class="required">*</span></label>
              <input type="text" id="register-idcard" v-model="registerForm.idCard" class="form-input" placeholder="请输入身份证号" required pattern="^\d{17}[\dXx]$" title="请输入有效的18位身份证号码">
            </div>
            <div class="form-group">
              <label for="register-email">邮箱</label>
              <input type="email" id="register-email" v-model="registerForm.email" class="form-input" placeholder="请输入邮箱" required>
            </div>
            <div class="form-group">
              <label for="register-phone">手机号</label>
              <input type="tel" id="register-phone" v-model="registerForm.phone" class="form-input" placeholder="请输入手机号" required>
            </div>
            <div class="form-group">
              <label for="register-password">密码</label>
              <input type="password" id="register-password" v-model="registerForm.password" class="form-input" placeholder="请输入密码" required @input="checkPasswordStrength">
              <div v-if="registerForm.password" class="password-strength">
                <div class="strength-bar">
                  <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: passwordStrengthWidth }"></div>
                </div>
                <span class="strength-text" :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
              </div>
            </div>
            <div class="form-group">
              <label for="register-confirm">确认密码</label>
              <input type="password" id="register-confirm" v-model="registerForm.confirmPassword" class="form-input" placeholder="请确认密码" required>
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary login-btn" :disabled="registering">
                {{ registering ? '注册中...' : '注册' }}
              </button>
            </div>
            <div class="form-footer">
              <span>已有账号？</span>
              <a href="#" @click.prevent="loginTab = 'login'">立即登录</a>
            </div>
          </form>

          <!-- 忘记密码表单 -->
          <form v-else-if="loginTab === 'forgot'" class="login-form" @submit.prevent="handleForgotPassword">
            <div class="form-group">
              <label for="forgot-email">注册邮箱</label>
              <input type="email" id="forgot-email" v-model="forgotForm.email" class="form-input" placeholder="请输入注册邮箱" required>
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary login-btn">发送重置链接</button>
            </div>
            <div class="form-footer">
              <a href="#" @click.prevent="loginTab = 'login'">返回登录</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from './store/modules/user'
import Search from './components/Search.vue'
import { onMounted } from 'vue'

export default {
  name: 'App',
  components: { Search },
  setup() {
    const userStore = useUserStore()

    onMounted(async () => {
      const result = await userStore.initAuth()
      console.log('[App] initAuth result:', result)
      // 确保初始化后强制更新UI
      if (!result.success) {
        // 如果初始化失败，确保清空用户信息
        await userStore.fetchCurrentUser()
      }
    })

    return { userStore }
  },
  data() {
    return {
      showLoginDialog: false,
      loginTab: 'login',
      selectedAccountType: 'buyer',
      pendingAction: null,
      mobileMenuOpen: false,
      loginForm: {
        username: '',
        password: '',
        rememberMe: false
      },
      registerForm: {
        username: '',
        realName: '',
        idCard: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        accountType: 'buyer'
      },
      forgotForm: {
        email: ''
      },
      passwordStrength: 0,
      loggingIn: false,
      registering: false,
      currentUser: null
    }
  },
  computed: {
    passwordStrengthClass() {
      if (this.passwordStrength === 0) return ''
      if (this.passwordStrength === 1) return 'weak'
      if (this.passwordStrength === 2) return 'medium'
      if (this.passwordStrength === 3) return 'strong'
      return 'very-strong'
    },
    passwordStrengthText() {
      if (this.passwordStrength === 0) return ''
      if (this.passwordStrength === 1) return '弱'
      if (this.passwordStrength === 2) return '中等'
      if (this.passwordStrength === 3) return '强'
      return '非常强'
    },
    passwordStrengthWidth() {
      if (this.passwordStrength === 0) return '0%'
      if (this.passwordStrength === 1) return '25%'
      if (this.passwordStrength === 2) return '50%'
      if (this.passwordStrength === 3) return '75%'
      return '100%'
    }
  },
  methods: {
    goToUserCenter() {
      if (this.userStore.isAdmin) {
        this.$router.push('/admin')
      } else {
        this.$router.push('/user')
      }
    },
    closeLoginDialog() {
      this.showLoginDialog = false
      this.loginTab = 'login'
      this.pendingAction = null
      this.loginForm = { username: '', password: '', rememberMe: false }
      this.registerForm = { username: '', realName: '', idCard: '', email: '', phone: '', password: '', confirmPassword: '', accountType: 'buyer' }
    },
    showForgotPassword() {
      this.loginTab = 'forgot'
    },
    requireAuth(action) {
      if (this.userStore.isLoggedIn) {
        if (action) action()
      } else {
        this.pendingAction = action
        this.showLoginDialog = true
        return false
      }
    },
    checkPasswordStrength() {
      const password = this.registerForm.password
      let strength = 0

      if (!password) {
        this.passwordStrength = 0
        return
      }

      if (password.length >= 8) strength++
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
      if (/\d/.test(password)) strength++
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

      this.passwordStrength = Math.min(strength, 4)
    },
    sanitizeInput(input) {
      if (typeof input !== 'string') return input
      return input.replace(/[<>]/g, '')
    },
    async handleLogin() {
      if (this.loggingIn) return
      const username = this.sanitizeInput(this.loginForm.username)
      const password = this.loginForm.password

      if (!username || !password) {
        alert('请输入用户名和密码')
        return
      }

      this.loggingIn = true
      try {
        const startTime = Date.now()
        const result = await this.userStore.login(username, password, this.selectedAccountType)
        const duration = Date.now() - startTime
        if (result.success) {
          this.loginForm = { username: '', password: '', rememberMe: false }
          this.showLoginDialog = false
          if (this.pendingAction) {
            const action = this.pendingAction
            this.pendingAction = null
            action()
          }
          console.log(`登录耗时: ${duration}ms`)
          console.log('UserInfo:', this.userStore.userInfo)
          console.log('accountType:', this.userStore.userInfo.accountType)
          console.log('isAdmin:', this.userStore.isAdmin)
          
          if (this.userStore.isAdmin) {
            alert(`登录成功！${username}，您是管理员`)
            this.$router.push('/admin')
          } else {
            const welcomeMessage = `登录成功！欢迎 ${this.userStore.isMerchant ? '商户' : '买家'} ${username}`
            alert(welcomeMessage)
          }
        } else {
          alert(result.error || '登录失败，请检查用户名和密码')
        }
      } catch (error) {
        console.error('Login error:', error)
        alert('登录失败：' + (error.message || '未知错误'))
      } finally {
        this.loggingIn = false
      }
    },
    async handleRegister() {
      if (this.registering) return
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        alert('两次密码输入不一致')
        return
      }

      if (this.registerForm.password.length < 8) {
        alert('密码长度至少为8位')
        return
      }

      if (this.passwordStrength < 2) {
        alert('密码强度太弱，请使用包含大小写字母、数字和特殊字符的密码')
        return
      }

      const username = this.sanitizeInput(this.registerForm.username)
      const email = this.sanitizeInput(this.registerForm.email)
      const phone = this.sanitizeInput(this.registerForm.phone)

      if (!username || !email || !phone || !this.registerForm.password) {
        alert('请填写所有必填项')
        return
      }

      this.registering = true
      try {
        const result = await this.userStore.register({
          username: username,
          name: username,
          realName: this.registerForm.realName,
          idCard: this.registerForm.idCard,
          email: email,
          phone: phone,
          password: this.registerForm.password,
          accountType: this.registerForm.accountType
        })

        if (result.success) {
          this.showLoginDialog = false
          this.registerForm = { username: '', email: '', phone: '', password: '', confirmPassword: '', accountType: 'buyer' }
          this.loginTab = 'login'
          this.passwordStrength = 0
          alert(`注册成功！您已注册为${this.registerForm.accountType === 'merchant' ? '商户' : '买家'}账号`)
        } else {
          alert(result.error || '注册失败')
        }
      } catch (error) {
        console.error('Register error:', error)
        alert('注册失败：' + (error.message || '未知错误'))
      } finally {
        this.registering = false
      }
    },
    handleForgotPassword() {
      if (this.forgotForm.email) {
        alert('密码重置链接已发送到您的邮箱，请查收。')
        this.loginTab = 'login'
        this.forgotForm = { email: '' }
      } else {
        alert('请输入注册邮箱')
      }
    },
    handleLogout() {
      if (confirm('确定要退出登录吗？')) {
        this.userStore.logout()
        alert('已退出登录')
        this.$router.push('/')
      }
    }
  },
  provide() {
    return {
      requireAuth: this.requireAuth
    }
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.top-bar {
  background-color: #4CAF50;
  color: white;
  padding: 10px 0;
}

.top-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  gap: 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-section a {
  display: flex;
  align-items: center;
}

.logo-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.platform-info {
  display: flex;
  flex-direction: column;
}

.platform-name {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.platform-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.user-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-type-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #8BC34A;
  color: white;
}

.account-type-tag.buyer {
  background-color: #2196F3;
}

.account-type-tag.admin {
  background: #f3e5f5;
  color: #7b1fa2;
}

.logout-btn {
  background: none;
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.2);
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #fff;
  color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s;
}

.avatar-placeholder:hover {
  transform: scale(1.05);
}

.nav-container {
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
}

/* 手机端底部导航 */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  text-decoration: none;
  color: #666;
  font-size: 11px;
  gap: 4px;
  transition: color 0.3s;
}

.mobile-nav-item svg {
  stroke: #666;
  transition: stroke 0.3s;
}

.mobile-nav-item.active,
.mobile-nav-item.router-link-active {
  color: #4CAF50;
}

.mobile-nav-item.active svg,
.mobile-nav-item.router-link-active svg {
  stroke: #4CAF50;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-grid {
  display: flex;
  list-style: none;
  gap: 10px;
  padding: 0;
  margin: 0;
}

.nav-item {
  flex: 1;
  text-align: center;
  text-decoration: none;
}

.nav-text {
  display: block;
  padding: 15px 10px;
  color: #333;
}

.nav-item:hover .nav-text {
  color: #4CAF50;
}

.nav-item.router-link-active .nav-text {
  color: #4CAF50;
  font-weight: bold;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
  width: 100%;
}

.footer {
  background-color: #333;
  color: white;
  padding: 30px 0;
  margin-top: 40px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.footer-logo img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.footer-info h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.footer-info p {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 20px;
}

.footer-links {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-links a {
  color: white;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #4CAF50;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 20px;
  width: 100%;
  text-align: center;
}

.footer-bottom p {
  font-size: 12px;
  opacity: 0.7;
  margin: 5px 0;
}

/* 登录弹窗样式 */
.login-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.login-dialog {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.login-dialog-body {
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

.login-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
  color: white;
}

.login-dialog-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-dialog-logo img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.login-dialog-logo h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.login-dialog-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: white;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.login-dialog-close:hover {
  opacity: 1;
}

.account-type-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
}

.account-type-tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.account-type-tabs button.active {
  background-color: white;
  color: #4CAF50;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-form .form-group {
  margin-bottom: 20px;
}

.login-form label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.login-form .form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.login-form .form-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.remember-me input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.forgot-password {
  font-size: 14px;
  color: #4CAF50;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.form-footer a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 500;
}

.form-footer a:hover {
  text-decoration: underline;
}

.account-type-radio {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
}

.strength-fill.weak { background-color: #f44336; width: 25%; }
.strength-fill.medium { background-color: #ff9800; width: 50%; }
.strength-fill.strong { background-color: #4CAF50; width: 75%; }
.strength-fill.very-strong { background-color: #8BC34A; width: 100%; }

.strength-text {
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.strength-text.weak { color: #f44336; }
.strength-text.medium { color: #ff9800; }
.strength-text.strong { color: #4CAF50; }
.strength-text.very-strong { color: #8BC34A; }

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .top-container {
    flex-wrap: wrap;
    padding: 0 10px;
  }

  .logo-image {
    width: 40px;
    height: 40px;
  }

  .platform-name {
    font-size: 16px;
  }

  .platform-subtitle {
    font-size: 11px;
  }

  .search-container {
    order: 3;
    width: 100%;
    margin-top: 8px;
  }

  /* 桌面端导航隐藏 */
  .desktop-nav {
    display: none;
  }

  /* 手机端底部导航显示 */
  .mobile-nav {
    display: flex;
  }

  .footer-links {
    flex-direction: column;
    gap: 10px;
  }

  /* 主内容区添加底部padding，避免被导航栏遮挡 */
  .main-content {
    padding: 0 15px 70px 15px;
    margin-top: 10px;
  }

  .user-section {
    gap: 8px;
  }

  .user-info {
    padding: 6px 10px;
    gap: 6px;
  }

  .user-name {
    font-size: 12px;
    gap: 4px;
  }

  .logout-btn {
    font-size: 11px;
    padding: 3px 6px;
  }

  /* 页脚添加底部padding */
  .footer {
    padding-bottom: 80px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0 10px;
  }
}
</style>