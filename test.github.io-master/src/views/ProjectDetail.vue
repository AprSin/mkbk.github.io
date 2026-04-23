<template>
  <div class="project-detail-container">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">加载中...</div>
    </div>
    <h1>项目详情</h1>
    <div class="project-detail" v-if="project.id">
      <div class="project-header">
        <h2>{{ project.title }}</h2>
        <div class="project-tags">
          <span v-if="project.isHot" class="tag tag-hot">热门</span>
          <span v-if="project.isNew" class="tag tag-new">新发布</span>
          <span v-if="project.type" class="tag tag-type">{{ project.type }}</span>
        </div>
      </div>
      
      <div class="project-content">
        <!-- 项目基本信息 -->
        <div class="info-section">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">项目编号:</span>
              <span class="info-value">{{ project.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">项目类型:</span>
              <span class="info-value">{{ project.type || '未分类' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所在地区:</span>
              <span class="info-value">{{ project.location || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">面积:</span>
              <span class="info-value">{{ project.area || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预算价格:</span>
              <span class="info-value price">¥{{ project.price || '0' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">浏览量:</span>
              <span class="info-value">{{ project.viewCount || 0 }} 次</span>
            </div>
            <div class="info-item">
              <span class="info-label">投标人数:</span>
              <span class="info-value">{{ project.bidCount || 0 }} 人</span>
            </div>
            <div class="info-item">
              <span class="info-label">项目状态:</span>
              <span :class="['status-badge', project.statusClass]">{{ project.statusText }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">发布时间:</span>
              <span class="info-value">
                {{ formatDateTime(project.createdAt) }}
                <span class="relative-time">({{ getRelativeTime(project.createdAt) }})</span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">更新时间:</span>
              <span class="info-value">
                {{ formatDateTime(project.updatedAt) }}
                <span class="relative-time">({{ getRelativeTime(project.updatedAt) }})</span>
              </span>
            </div>
            <div class="info-item" v-if="project.bidEndDate">
              <span class="info-label">投标截止:</span>
              <span class="info-value deadline">{{ formatDateTime(project.bidEndDate) }}</span>
            </div>
          </div>
        </div>

        <!-- 发布者信息 -->
        <div class="info-section seller-section">
          <h3>发布者信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">商户名称:</span>
              <span class="info-value">{{ project.merchantName || '未知商户' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系人:</span>
              <span class="info-value">{{ project.contactPerson || '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系电话:</span>
              <span class="info-value">{{ project.contactInfo || '暂无' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">公司地址:</span>
              <span class="info-value">{{ project.companyAddress || '暂无' }}</span>
            </div>
          </div>
        </div>

        <!-- 项目详细信息 -->
        <div class="info-section">
          <h3>项目详情</h3>
          <div class="project-details-content">
            <p>{{ project.description || '暂无项目描述' }}</p>
          </div>
        </div>

        <!-- 投标信息 -->
        <div class="info-section" v-if="project.bids && project.bids.length > 0">
          <h3>投标记录</h3>
          <div class="bid-list">
            <div v-for="(bid, index) in project.bids.slice(0, 5)" :key="bid.id" class="bid-item">
              <div class="bid-info">
                <span class="bid-rank">#{{ index + 1 }}</span>
                <span class="bid-amount">¥{{ bid.amount || '待报价' }}</span>
                <span :class="['bid-status', bid.status]">{{ bid.status || '待处理' }}</span>
              </div>
              <span class="bid-date">{{ formatDateTime(bid.bidDate) }}</span>
            </div>
            <div v-if="project.bids.length > 5" class="bid-more">
              共 {{ project.bids.length }} 条投标记录
            </div>
          </div>
        </div>

        <!-- 项目统计 -->
        <div class="info-section">
          <h3>项目统计</h3>
          <div class="info-grid stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ project.viewCount || 0 }}</div>
              <div class="stat-label">浏览次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ project.bidCount || 0 }}</div>
              <div class="stat-label">投标人数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ project.bids?.length || 0 }}</div>
              <div class="stat-label">投标记录</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ getDaysSincePublish() }}</div>
              <div class="stat-label">发布天数</div>
            </div>
          </div>
        </div>

        <!-- 相关附件 -->
        <div class="project-attachments" v-if="project.attachments && project.attachments.length > 0">
          <h3>相关附件</h3>
          <div class="attachment-list">
            <div v-for="(attachment, index) in project.attachments" :key="index" class="attachment-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>
              <span>{{ attachment.name }}</span>
              <button @click="downloadAttachment(attachment, index)" class="btn btn-secondary">下载</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="project-actions">
        <button 
          class="btn btn-primary" 
          @click="handleBid" 
          :disabled="!canBid"
          :class="{ 'btn-disabled': !canBid }"
        >
          {{ bidButtonText }}
        </button>
        <button class="btn btn-secondary" @click="shareProject">分享项目</button>
        <button class="btn btn-secondary" @click="saveProject">收藏项目</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../store/modules/user'
import { useMarketStore } from '../store/modules/market'
import { projectAPI } from '../utils/projectAPI'

export default {
  name: 'ProjectDetail',
  setup() {
    const userStore = useUserStore()
    const marketStore = useMarketStore()
    return { userStore, marketStore }
  },
  data() {
    return {
      loading: false,
      project: {
        id: '',
        title: '',
        description: '',
        details: '',
        area: '',
        date: '',
        contactPerson: '',
        contactInfo: '',
        status: '',
        statusText: '',
        isHot: false,
        isNew: false,
        merchantName: '',
        bids: [],
        viewCount: 0,
        bidCount: 0,
        createdAt: null,
        bidEndDate: null
      }
    }
  },
  computed: {
    // 判断项目是否已截止
    isProjectExpired() {
      if (!this.project.bidEndDate) return false
      const now = new Date()
      const endDate = new Date(this.project.bidEndDate)
      return now > endDate
    },
    // 判断项目是否可以投标
    canBid() {
      // 项目状态必须是"交易中"且未过截止日期
      return this.project.statusText === '交易中' && !this.isProjectExpired
    },
    // 按钮显示文本
    bidButtonText() {
      if (this.isProjectExpired) {
        return '已截止'
      }
      if (this.project.statusText !== '交易中') {
        return '已结束'
      }
      return '参与投标'
    }
  },
  async mounted() {
    await this.loadProject()
  },
  methods: {
    async loadProject() {
      const projectId = this.$route.params.id
      if (!projectId) return

      this.loading = true
      try {
        const result = await projectAPI.getProject(projectId)
        if (result.project) {
          const p = result.project
          this.project = {
            id: p.id,
            title: p.name || p.title || '未知项目',
            description: p.description || '暂无描述',
            details: p.details || p.description || '暂无详细信息',
            area: p.area || '未知',
            date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            contactPerson: p.contactPerson || p.owner?.name || p.owner?.username || '未知商户',
            contactInfo: p.contactInfo || p.owner?.phone || '暂无联系方式',
            status: p.status === '交易中' ? 'processing' : 'warning',
            statusText: p.status || '交易中',
            isHot: p.isHot || false,
            isNew: p.isNew || false,
            merchantName: p.owner?.name || p.owner?.username || '未知商户',
            type: p.type,
            location: p.location,
            bidEndDate: p.bidEndDate,
            attachments: p.attachments || [],
            bids: p.bids || [],
            viewCount: p.viewCount || 0,
            bidCount: p.bidCount || 0,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            price: p.price,
            userId: p.userId,
            owner: p.owner
          }
        }
      } catch (error) {
        console.error('Failed to load project:', error)
        const storeProject = this.marketStore.projects.find(p => p.id === projectId)
        if (storeProject) {
          this.project = {
            ...this.project,
            ...storeProject,
            title: storeProject.name || this.project.title,
            area: storeProject.area || this.project.area
          }
        }
      } finally {
        this.loading = false
      }
    },
    formatDateTime(date) {
      if (!date) return '暂无'
      const d = new Date(date)
      if (isNaN(d.getTime())) return '无效日期'
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    getRelativeTime(date) {
      if (!date) return ''
      const now = new Date()
      const d = new Date(date)
      const diff = now - d
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days < 30) return `${days}天前`
      return this.formatDateTime(date)
    },
    getDaysSincePublish() {
      if (!this.project.createdAt) return 0
      const now = new Date()
      const created = new Date(this.project.createdAt)
      const diff = now - created
      return Math.floor(diff / 86400000)
    },
    handleBid() {
      if (!this.userStore.isLoggedIn) {
        this.$root.showLoginDialog = true
        return
      }
      this.$router.push(`/bid/${this.project.id}`)
    },
    shareProject() {
      alert('项目链接已复制到剪贴板！');
    },
    saveProject() {
      if (!this.userStore.isLoggedIn) {
        this.$root.showLoginDialog = true
        return
      }
      alert('项目已收藏！');
    },
    downloadAttachment(attachment, index) {
      if (attachment.url) {
        const link = document.createElement('a')
        link.href = attachment.url
        link.download = attachment.name || `附件${index + 1}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (attachment.content) {
        const blob = new Blob([attachment.content], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = attachment.name || `附件${index + 1}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        alert('附件无法下载')
      }
    }
  }
}
</script>

<style scoped>
.project-detail-container {
  padding: 20px;
}

.project-detail {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.project-header {
  padding: 30px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-header h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #333;
  flex: 1;
}

.project-content {
  padding: 30px;
}

.project-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}

.info-label {
  font-weight: 500;
  color: #333;
  width: 100px;
}

.info-value {
  color: #666;
  flex: 1;
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

.project-description {
  margin-bottom: 30px;
}

.project-description h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 10px 0;
  color: #333;
}

.project-description p {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
}

.project-attachments {
  margin-bottom: 30px;
}

.project-attachments h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 15px 0;
  color: #333;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.attachment-item svg {
  flex-shrink: 0;
}

.attachment-item span {
  flex: 1;
  color: #333;
}

.project-actions {
  padding: 20px 30px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

/* 信息区块样式 */
.info-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.info-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.info-value {
  color: #333;
  flex: 1;
}

.info-value.price {
  color: #ff6b6b;
  font-weight: 600;
  font-size: 16px;
}

.info-value.deadline {
  color: #ff6b6b;
  font-weight: 500;
}

.relative-time {
  color: #999;
  font-size: 12px;
  margin-left: 5px;
}

/* 项目标签 */
.project-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-hot {
  background-color: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.tag-new {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.tag-type {
  background-color: rgba(33, 150, 243, 0.1);
  color: #2196F3;
}

/* 投标记录样式 */
.bid-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bid-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.bid-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.bid-rank {
  font-weight: 600;
  color: #666;
  min-width: 30px;
}

.bid-amount {
  font-weight: 600;
  color: #ff6b6b;
  font-size: 16px;
}

.bid-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.bid-status.pending {
  background-color: rgba(255, 193, 7, 0.1);
  color: #FFC107;
}

.bid-status.accepted {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.bid-status.rejected {
  background-color: rgba(244, 67, 54, 0.1);
  color: #F44336;
}

.bid-date {
  color: #999;
  font-size: 13px;
}

.bid-more {
  text-align: center;
  padding: 10px;
  color: #666;
  font-size: 14px;
  background-color: white;
  border-radius: 6px;
  border: 1px dashed #ddd;
}

/* 统计样式 */
.stats-grid {
  grid-template-columns: repeat(4, 1fr);
}

.stat-item {
  text-align: center;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #4CAF50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

/* 项目详情内容 */
.project-details-content {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.project-details-content p {
  margin: 0;
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .project-header {
    flex-direction: column;
    gap: 15px;
  }

  .project-header h2 {
    font-size: 20px;
  }

  .project-content {
    padding: 20px;
  }

  .project-info {
    flex-direction: column;
    gap: 15px;
  }

  .info-item {
    min-width: 100%;
  }

  .project-actions {
    flex-direction: column;
  }

  .project-actions button,
  .project-actions a {
    width: 100%;
  }
}
</style>