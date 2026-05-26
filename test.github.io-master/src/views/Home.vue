<template>
  <div class="home-container">
    <!-- 轮播图 -->
    <div class="carousel" ref="carousel">
      <div class="carousel-inner" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
        <div class="carousel-item">
          <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20rural%20economic%20digital%20platform%20banner%20with%20AIOT%20technology%20elements&image_size=landscape_16_9" alt="轮播图1">
          <div class="carousel-caption">
            <h3>云上共富</h3>
            <p>基于AIOT的农村集体经济数字化平台</p>
            <router-link to="/projects" class="btn btn-primary">立即交易</router-link>
          </div>
        </div>
        <div class="carousel-item">
          <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20agriculture%20technology%20in%20rural%20area%20with%20digital%20dashboard&image_size=landscape_16_9" alt="轮播图2">
          <div class="carousel-caption">
            <h3>数据驱动</h3>
            <p>AIOT技术助力农村经济数字化转型</p>
            <router-link to="/data" class="btn btn-primary">查看数据</router-link>
          </div>
        </div>
        <div class="carousel-item">
          <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rural%20revitalization%20through%20digital%20technology%20with%20modern%20village%20scene&image_size=landscape_16_9" alt="轮播图3">
          <div class="carousel-caption">
            <h3>数字化赋能</h3>
            <p>推动农村集体经济高质量发展</p>
            <router-link to="/guide" class="btn btn-primary">了解更多</router-link>
          </div>
        </div>
      </div>
      <div class="carousel-controls">
        <div class="carousel-control" @click="prevSlide">&lt;</div>
        <div class="carousel-control" @click="nextSlide">&gt;</div>
      </div>
      <div class="carousel-indicators">
        <div 
          v-for="index in slideCount" 
          :key="index" 
          :class="['indicator', { active: currentSlide === index - 1 }]"
          @click="goToSlide(index - 1)"
        ></div>
      </div>
    </div>

    <!-- 交易数据概览 - 对称布局 -->
    <section class="data-overview symmetric-section">
      <div class="section-header">
        <h2>交易数据概览</h2>
        <p class="section-subtitle">实时数据展示，助力精准决策</p>
      </div>
      <div v-if="isLoadingStats" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载数据中...</p>
      </div>
      <div v-else-if="statsError" class="error-state">
        <p>{{ statsError }}</p>
        <button @click="loadStatistics" class="btn btn-primary">重新加载</button>
      </div>
      <div v-else class="stat-grid symmetric-grid">
        <div class="stat-card" v-for="(stat, index) in statistics" :key="index" :class="stat.type">
          <div class="stat-icon">
            <svg v-if="stat.type === 'projects'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <svg v-else-if="stat.type === 'amount'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <svg v-else-if="stat.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <svg v-else-if="stat.type === 'users'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="stat-content">
            <div class="stat-number" :class="{ 'animate-count': stat.animate }">
              {{ stat.type === 'success' ? stat.value : formatNumber(stat.value) }}
              <span v-if="stat.type === 'success'" class="unit">%</span>
            </div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-trend" v-if="stat.trend">
              <span :class="['trend-value', stat.trend > 0 ? 'up' : 'down']">
                {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
              </span>
              <span class="trend-label">较上月</span>
            </div>
          </div>
        </div>
      </div>
      <div class="data-actions">
        <router-link to="/data" class="btn btn-primary view-data-btn">
          <span>查看详细数据</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </router-link>
      </div>
    </section>

    <!-- 平台优势 - 对称布局 -->
    <section class="platform-advantages symmetric-section">
      <div class="section-header">
        <h2>平台优势</h2>
        <p class="section-subtitle">我们致力于为农村集体经济提供全方位数字化解决方案</p>
      </div>
      <div class="advantages-grid symmetric-grid">
        <div class="advantage-card" v-for="(advantage, index) in advantages" :key="index">
          <div class="advantage-icon-wrapper">
            <div class="advantage-icon" v-html="advantage.icon"></div>
          </div>
          <h3 class="advantage-title">{{ advantage.title }}</h3>
          <p class="advantage-content">{{ advantage.content }}</p>
        </div>
      </div>
    </section>

    <!-- 最新动态 - 三列对称布局 -->
    <section class="latest-updates symmetric-section">
      <div class="section-header">
        <h2>最新动态</h2>
        <p class="section-subtitle">掌握最新交易信息与公告</p>
      </div>
      <div class="updates-grid symmetric-grid">
        <!-- 交易项目 -->
        <div class="update-column">
          <div class="column-header">
            <div class="column-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3>交易项目</h3>
          </div>
          <div class="column-content">
            <div v-for="project in projects" :key="project.id" class="update-item">
              <div class="item-tags">
                <span v-if="project.isHot" class="tag tag-hot">热门</span>
                <span v-if="project.isNew" class="tag tag-new">新发布</span>
              </div>
              <h4 class="item-title">{{ project.title }}</h4>
              <p class="item-desc">{{ project.description }}</p>
              <div class="item-meta">
                <span class="meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {{ project.date }}
                </span>
              </div>
              <router-link :to="`/project/detail/${project.id}`" class="item-link">查看详情 →</router-link>
            </div>
          </div>
          <router-link to="/projects" class="column-more">查看更多</router-link>
        </div>

        <!-- 农产品交易 -->
        <div class="update-column">
          <div class="column-header">
            <div class="column-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path></svg>
            </div>
            <h3>农产品交易</h3>
          </div>
          <div class="column-content">
            <div v-for="product in products" :key="product.id" class="update-item product-item">
              <div class="product-image-wrapper">
                <img :src="product.image" :alt="product.name" class="product-image">
              </div>
              <div class="product-info">
                <h4 class="item-title">{{ product.name }}</h4>
                <p class="product-price">¥{{ product.price }}/斤</p>
                <p class="item-desc">{{ product.description }}</p>
                <router-link :to="`/product/detail/${product.id}`" class="item-link">立即购买 →</router-link>
              </div>
            </div>
          </div>
          <router-link to="/products" class="column-more">查看更多</router-link>
        </div>

        <!-- 通知公告 -->
        <div class="update-column">
          <div class="column-header">
            <div class="column-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <h3>通知公告</h3>
          </div>
          <div class="column-content">
            <div v-for="notice in notices" :key="notice.id" class="update-item">
              <div class="item-tags">
                <span v-if="notice.isImportant" class="tag tag-important">重要</span>
              </div>
              <h4 class="item-title">{{ notice.title }}</h4>
              <div class="item-meta">
                <span class="meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {{ notice.date }}
                </span>
              </div>
              <p class="item-desc">{{ notice.content }}</p>
              <router-link :to="`/notice/detail/${notice.id}`" class="item-link">查看详情 →</router-link>
            </div>
          </div>
          <router-link to="/notices" class="column-more">查看更多</router-link>
        </div>
      </div>
    </section>

    <!-- 服务承诺 - 对称布局 -->
    <section class="service-promises symmetric-section">
      <div class="section-header">
        <h2>服务承诺</h2>
        <p class="section-subtitle">专业服务，值得信赖</p>
      </div>
      <div class="promises-grid symmetric-grid">
        <div class="promise-card" v-for="(promise, index) in promises" :key="index">
          <div class="promise-icon-wrapper">
            <div class="promise-icon" v-html="promise.icon"></div>
          </div>
          <h3 class="promise-title">{{ promise.title }}</h3>
          <p class="promise-description">{{ promise.description }}</p>
        </div>
      </div>
    </section>

    <!-- 合作伙伴 - 对称布局 -->
    <section class="partners symmetric-section">
      <div class="section-header">
        <h2>合作伙伴</h2>
        <p class="section-subtitle">携手共建农村经济发展新格局</p>
      </div>
      <div class="partners-grid symmetric-grid">
        <div class="partner-logo" v-for="(partner, index) in partners" :key="index">
          <img :src="partner.logo" :alt="partner.name">
          <span class="partner-name">{{ partner.name }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { projectAPI } from '../utils/projectAPI'
import { productAPI } from '../utils/productAPI'
import { chartAPI } from '../utils/chartAPI'

export default {
  name: 'Home',
  setup() {
    // 轮播图状态
    const currentSlide = ref(0)
    const slideCount = 3
    let autoSlideInterval = null

    // 统计数据 - 响应式，与 Data.vue 保持联动
    const statistics = reactive([
      { type: 'projects', label: '累计交易项目', value: 0, unit: '个', trend: 0, animate: false },
      { type: 'amount', label: '累计交易金额', value: 0, unit: '元', trend: 0, animate: false },
      { type: 'success', label: '交易成功率', value: 0, unit: '%', trend: 0, animate: false },
      { type: 'users', label: '活跃用户数', value: 0, unit: '人', trend: 0, animate: false }
    ])
    
    // 数据加载状态
    const isLoadingStats = ref(false)
    const statsError = ref(null)

    // 平台优势数据
    const advantages = [
      {
        title: 'AIOT技术',
        content: '运用人工智能和物联网技术，实现农村资产智能化管理和实时监控',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      },
      {
        title: '安全可靠',
        content: '多重安全保障，区块链技术确保交易过程安全透明可追溯',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>'
      },
      {
        title: '高效便捷',
        content: '在线交易，智能匹配，大幅提高交易效率和成功率',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
      },
      {
        title: '数据驱动',
        content: '大数据分析，为决策提供科学依据，优化资源配置',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>'
      }
    ]

    // 动态数据
    const projects = ref([])
    const products = ref([])
    const notices = ref([])

    // 服务承诺数据
    const promises = [
      {
        title: '专业服务',
        description: '提供专业的农村产权交易服务，确保交易过程规范透明',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      },
      {
        title: '高效响应',
        description: '7*24小时在线服务，快速响应客户需求',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
      },
      {
        title: '安全保障',
        description: '多重安全措施，保障交易资金和信息安全',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9"></path><path d="M14 17H5"></path><path d="M20 17h-9"></path><path d="M14 7H5"></path><path d="M12 12h.01"></path></svg>'
      }
    ]

    // 合作伙伴数据
    const partners = [
      { name: '农业科技公司', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20company%20logo%20for%20rural%20economic%20development&image_size=square' },
      { name: '智慧农业集团', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20company%20logo%20for%20agriculture%20technology&image_size=square' },
      { name: '数字平台科技', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20company%20logo%20for%20digital%20platform&image_size=square' },
      { name: '金融服务集团', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20company%20logo%20for%20financial%20services&image_size=square' },
      { name: '乡村振兴基金', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20company%20logo%20for%20rural%20revitalization&image_size=square' },
      { name: '智慧农业研究院', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20company%20logo%20for%20smart%20agriculture&image_size=square' }
    ]

    // 轮播图方法
    const nextSlide = () => {
      currentSlide.value = (currentSlide.value + 1) % slideCount
    }

    const prevSlide = () => {
      currentSlide.value = (currentSlide.value - 1 + slideCount) % slideCount
    }

    const goToSlide = (index) => {
      currentSlide.value = index
    }

    const startAutoSlide = () => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval)
      }
      autoSlideInterval = setInterval(() => {
        nextSlide()
      }, 5000)
    }

    // 数字格式化
    const formatNumber = (num) => {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万'
      }
      return num.toLocaleString()
    }

    // 数字动画
    const animateNumber = (target, duration = 1500) => {
      statistics.forEach((stat, index) => {
        setTimeout(() => {
          stat.animate = true
          const start = 0
          const end = target[index]
          const startTime = performance.now()

          const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeProgress = 1 - Math.pow(1 - progress, 3) // easeOutCubic
            stat.value = Math.floor(start + (end - start) * easeProgress)

            if (progress < 1) {
              requestAnimationFrame(updateNumber)
            } else {
              stat.value = end
              stat.animate = false
            }
          }

          requestAnimationFrame(updateNumber)
        }, index * 150)
      })
    }

    // 加载统计数据 - 使用与交易大数据页面相同的数据源
    const loadStatistics = async () => {
      isLoadingStats.value = true
      statsError.value = null
      try {
        // 使用 chartAPI.getFullStatistics 与 Data.vue 保持一致
        const result = await chartAPI.getFullStatistics('year')
        if (result.overview) {
          const targetValues = [
            result.overview.totalProjects || 0,
            Math.round((result.overview.totalAmount || 0)), // 已经是万元
            result.overview.successRate || 0,
            result.overview.activeUsers || 0
          ]
          // 更新趋势数据（可以从后端获取或计算）
          statistics[0].trend = result.overview.totalProjectsTrend || 0
          statistics[1].trend = result.overview.totalAmountTrend || 0
          statistics[2].trend = result.overview.successRateTrend || 0
          statistics[3].trend = result.overview.activeUsersTrend || 0
          animateNumber(targetValues)
        } else {
          statsError.value = '数据格式错误'
          animateNumber([0, 0, 0, 0])
        }
      } catch (error) {
        console.error('Failed to load statistics:', error)
        statsError.value = '加载失败'
        // 出错时显示0，不显示硬编码数据
        animateNumber([0, 0, 0, 0])
      } finally {
        isLoadingStats.value = false
      }
    }

    // 加载项目数据
    const loadProjects = async () => {
      try {
        const result = await projectAPI.getProjects({ limit: 4 })
        if (result.projects && result.projects.length > 0) {
          projects.value = result.projects.slice(0, 4).map((p, index) => ({
            id: p.id,
            title: p.name || p.title,
            description: p.description || '暂无描述',
            date: p.publishDate || p.createdAt,
            isHot: index === 0,
            isNew: index === 3
          }))
        } else {
          // 使用默认数据
          projects.value = [
            { id: 'SQ2026001', title: '商丘市梁园区谢集镇杨波村宅基地出租项目', description: '本项目为商丘市梁园区谢集镇杨波村宅基地出租项目，适合建设农村住房或相关配套设施。', date: '2024-12-15', isHot: true, isNew: false },
            { id: 'SQ2026002', title: '商丘市梁园区谢集镇东街村村中心广场西侧厂房出租项目', description: '本项目为商丘市梁园区谢集镇东街村村中心广场西侧厂房出租项目，适合兴办小型加工企业。', date: '2024-12-10', isHot: false, isNew: false },
            { id: 'SQ2026003', title: '商丘市梁园区谢集镇常庄村村部北侧厂房出租项目', description: '本项目为商丘市梁园区谢集镇常庄村村部北侧厂房出租项目，适合仓储或小型加工。', date: '2024-12-05', isHot: false, isNew: false },
            { id: 'SQ2026004', title: '商丘市梁园区谢集镇王步口村闲置厂房出租项目', description: '本项目为商丘市梁园区谢集镇王步口村闲置厂房出租项目，适合规模化生产加工。', date: '2024-12-01', isHot: false, isNew: true }
          ]
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }

    // 加载产品数据
    const loadProducts = async () => {
      try {
        const result = await productAPI.getProducts({ limit: 4 })
        if (result.products && result.products.length > 0) {
          products.value = result.products.slice(0, 4).map(p => ({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price),
            description: p.description || '暂无描述',
            image: p.image || 'https://via.placeholder.com/300x200?text=农产品'
          }))
        } else {
          // 使用默认数据
          products.value = [
            { id: '1', name: '商丘市梁园区优质小麦', price: 2.5, description: '商丘市梁园区优质小麦，颗粒饱满，品质优良，适合制作各种面食。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=high%20quality%20wheat%20grains%20in%20farm&image_size=square' },
            { id: '2', name: '商丘市梁园区绿色蔬菜', price: 3.0, description: '商丘市梁园区绿色蔬菜，无农药残留，新鲜健康，营养丰富。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20green%20vegetables%20in%20farm&image_size=square' },
            { id: '3', name: '商丘市梁园区特色水果', price: 5.0, description: '商丘市梁园区特色水果，口感甜美，品质上乘，深受消费者喜爱。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20fruits%20in%20farm&image_size=square' },
            { id: '4', name: '商丘市梁园区优质玉米', price: 1.8, description: '商丘市梁园区优质玉米，颗粒饱满，淀粉含量高，适合饲料和食品加工。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=high%20quality%20corn%20cobs%20in%20farm&image_size=square' }
          ]
        }
      } catch (error) {
        console.error('Failed to load products:', error)
      }
    }

    // 加载公告数据
    const loadNotices = async () => {
      // 这里可以接入公告API
      notices.value = [
        { id: '1', title: '商丘市梁园区人民政府 关于印发《商丘市梁园区农村产权交易市场体系建设方案》的通知', content: '为规范农村产权交易行为，保障交易双方合法权益，促进农村产权流转交易市场健康发展，特制定本方案和管理办法。', date: '2024-06-01', isImportant: true },
        { id: '2', title: '商丘市梁园区农村产权流转交易运营管理办法（试行）', content: '本办法旨在规范农村产权流转交易行为，维护交易秩序，保障交易双方合法权益，促进农村产权流转交易市场健康发展。', date: '2024-05-01', isImportant: false },
        { id: '3', title: '关于进一步规范农村产权交易行为的通知', content: '为进一步规范农村产权交易行为，提高交易效率，保障交易安全，现对农村产权交易有关事项通知如下。', date: '2024-04-15', isImportant: false },
        { id: '4', title: '2024年农村产权交易平台操作培训通知', content: '为提高农村产权交易平台使用效率，现组织开展2024年农村产权交易平台操作培训，具体事项通知如下。', date: '2024-03-20', isImportant: false }
      ]
    }

    // 加载所有数据
    const loadAllData = async () => {
      await Promise.all([
        loadStatistics(),
        loadProjects(),
        loadProducts(),
        loadNotices()
      ])
    }

    onMounted(() => {
      startAutoSlide()
      loadAllData()
    })

    onUnmounted(() => {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval)
      }
    })

    return {
      currentSlide,
      slideCount,
      statistics,
      isLoadingStats,
      statsError,
      advantages,
      projects,
      products,
      notices,
      promises,
      partners,
      nextSlide,
      prevSlide,
      goToSlide,
      formatNumber,
      loadStatistics
    }
  }
}
</script>

<style scoped>
/* 基础容器 */
.home-container {
  --primary-color: #4CAF50;
  --primary-light: #81C784;
  --primary-dark: #388E3C;
  --secondary-color: #2196F3;
  --accent-color: #FF9800;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --bg-light: #f8f9fa;
  --bg-white: #ffffff;
  --border-color: #e0e0e0;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  --spacing-xxl: 64px;
  
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-sm);
}

/* 对称区块样式 */
.symmetric-section {
  padding: var(--spacing-xxl) 0;
  position: relative;
}

.symmetric-section:nth-child(even) {
  background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-white) 100%);
}

.section-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.section-header h2 {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  position: relative;
  display: inline-block;
}

.section-header h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  border-radius: 2px;
}

.section-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: var(--spacing-md);
}

.symmetric-grid {
  display: grid;
  gap: var(--spacing-lg);
}

/* 轮播图样式 */
.carousel {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin: var(--spacing-lg) 0;
  box-shadow: var(--shadow-lg);
}

.carousel-inner {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.carousel-item {
  min-width: 100%;
  position: relative;
}

.carousel-item img {
  width: 100%;
  height: 450px;
  object-fit: cover;
}

.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-xl);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  text-align: center;
}

.carousel-caption h3 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.carousel-caption p {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.95;
}

.carousel-controls {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  pointer-events: none;
}

.carousel-control {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-primary);
  pointer-events: auto;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.carousel-control:hover {
  background: white;
  transform: scale(1.1);
  color: var(--primary-color);
}

.carousel-indicators {
  position: absolute;
  bottom: var(--spacing-md);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-xs);
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: white;
  width: 32px;
  border-radius: 6px;
}

/* 交易数据概览样式 */
.data-overview {
  background: linear-gradient(135deg, var(--bg-white) 0%, #f0f7f0 100%);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state p {
  margin-bottom: var(--spacing-md);
  color: #f44336;
}

.stat-grid {
  grid-template-columns: repeat(4, 1fr);
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  text-align: center;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-md);
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1;
}

.stat-number .unit {
  font-size: 1.5rem;
  font-weight: 500;
  margin-left: 2px;
}

.stat-number.animate-count {
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.85rem;
}

.trend-value {
  font-weight: 600;
}

.trend-value.up {
  color: var(--primary-color);
}

.trend-value.down {
  color: #f44336;
}

.trend-label {
  color: var(--text-muted);
}

.data-actions {
  text-align: center;
  margin-top: var(--spacing-xl);
}

.view-data-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.view-data-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 平台优势样式 */
.platform-advantages {
  background: var(--bg-white);
}

.advantages-grid {
  grid-template-columns: repeat(4, 1fr);
  max-width: 1200px;
  margin: 0 auto;
}

.advantage-card {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl) var(--spacing-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.advantage-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.advantage-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--spacing-md);
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.advantage-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.advantage-content {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 最新动态样式 */
.latest-updates {
  background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-white) 100%);
}

.updates-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

.update-column {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
}

.column-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.column-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.column-content {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
}

.update-item {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-color);
}

.update-item:last-child {
  border-bottom: none;
}

.item-tags {
  display: flex;
  gap: 6px;
  margin-bottom: var(--spacing-xs);
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-hot {
  background: #ffebee;
  color: #c62828;
}

.tag-new {
  background: #e3f2fd;
  color: #1565c0;
}

.tag-important {
  background: #fff3e0;
  color: #e65100;
}

.item-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: var(--spacing-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.item-link {
  font-size: 0.85rem;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.item-link:hover {
  text-decoration: underline;
}

.product-item {
  display: flex;
  gap: var(--spacing-sm);
}

.product-image-wrapper {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
}

.product-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e53935;
  margin-bottom: var(--spacing-xs);
}

.column-more {
  display: block;
  text-align: center;
  padding: var(--spacing-sm);
  background: var(--bg-light);
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.column-more:hover {
  background: #e8f5e9;
}

/* 服务承诺样式 */
.service-promises {
  background: var(--bg-white);
}

.promises-grid {
  grid-template-columns: repeat(3, 1fr);
  max-width: 900px;
  margin: 0 auto;
}

.promise-card {
  text-align: center;
  padding: var(--spacing-xl);
}

.promise-icon-wrapper {
  width: 72px;
  height: 72px;
  margin: 0 auto var(--spacing-md);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.promise-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.promise-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 合作伙伴样式 */
.partners {
  background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg-white) 100%);
  padding-bottom: var(--spacing-xxl);
}

.partners-grid {
  grid-template-columns: repeat(6, 1fr);
  gap: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.partner-logo {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.partner-logo:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.partner-logo img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.partner-name {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 按钮样式 */
.btn {
  display: inline-block;
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
  background: var(--bg-white);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-secondary:hover {
  background: var(--primary-color);
  color: white;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .advantages-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .partners-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .updates-grid {
    grid-template-columns: 1fr;
  }
  
  .promises-grid {
    grid-template-columns: 1fr;
  }
  
  .carousel-item img {
    height: 350px;
  }
  
  .carousel-caption h3 {
    font-size: 1.75rem;
  }
  
  .carousel-caption p {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .home-container {
    padding: 0 var(--spacing-sm);
  }
  
  .symmetric-section {
    padding: var(--spacing-xl) 0;
  }
  
  .section-header h2 {
    font-size: 1.75rem;
  }
  
  .stat-grid {
    grid-template-columns: 1fr;
  }
  
  .advantages-grid {
    grid-template-columns: 1fr;
  }
  
  .partners-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .carousel-item img {
    height: 280px;
  }
  
  .carousel-caption {
    padding: var(--spacing-md);
  }
  
  .carousel-caption h3 {
    font-size: 1.5rem;
  }
  
  .carousel-caption p {
    font-size: 0.9rem;
  }
  
  .carousel-control {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .carousel-item img {
    height: 220px;
  }
  
  .carousel-caption h3 {
    font-size: 1.25rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .partners-grid {
    grid-template-columns: 1fr;
  }
}
</style>
