<template>
  <div class="projects-container">
    <h1>交易项目</h1>
    <div class="filter-section">
      <div class="filter-item">
        <label>项目类型</label>
        <select v-model="filter.type">
          <option value="">全部</option>
          <option value="宅基地">宅基地</option>
          <option value="厂房">厂房</option>
        </select>
      </div>
      <div class="filter-item">
        <label>所在地区</label>
        <select v-model="filter.area">
          <option value="">全部</option>
          <option value="谢集镇">谢集镇</option>
        </select>
      </div>
      <div class="filter-item">
        <label>发布时间</label>
        <input type="date" v-model="filter.date">
      </div>
      <div class="filter-item">
        <button class="btn btn-primary" @click="resetFilter">重置</button>
      </div>
    </div>
    
    <div class="project-list">
      <div v-for="project in filteredProjects" :key="project.id" class="project-card">
        <div class="project-header">
          <h2>{{ project.title || project.name }}</h2>
          <div class="project-tags">
            <span v-if="project.isHot" class="tag tag-hot">热门</span>
            <span v-if="project.isNew" class="tag tag-new">新发布</span>
            <span v-if="project.merchantName" class="tag tag-merchant">商户</span>
          </div>
        </div>
        <div class="project-content">
          <p class="project-description">{{ project.description }}</p>
          <div class="project-details">
            <div class="detail-item">
              <span class="detail-label">项目编号:</span>
              <span class="detail-value">{{ project.id }}</span>
            </div>
            <div class="detail-item" v-if="project.merchantName">
              <span class="detail-label">发布商户:</span>
              <span class="detail-value merchant-value">{{ project.merchantName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">所在地区:</span>
              <span class="detail-value">{{ project.area || project.location }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">发布日期:</span>
              <span class="detail-value">{{ project.date || project.publishDate }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系人:</span>
              <span class="detail-value">{{ project.contactPerson }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系方式:</span>
              <span class="detail-value">{{ project.contactInfo }}</span>
            </div>
          </div>
        </div>
        <div class="project-footer">
          <router-link :to="`/project/detail/${project.id}`" class="btn btn-primary">查看详情</router-link>
        </div>
      </div>
    </div>
    
    <div v-if="filteredProjects.length === 0" class="empty-state">
      没有更多了哦
    </div>
    
    <div class="pagination">
      <button class="btn btn-secondary" @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button class="btn btn-secondary" @click="nextPage" :disabled="currentPage >= totalPages">下一页</button>
    </div>
  </div>
</template>

<script>
import { mapState, mapWritableState } from 'pinia'
import { useMarketStore } from '@/store'

export default {
  name: 'Projects',
  setup() {
    const marketStore = useMarketStore()
    return { marketStore }
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      filter: {
        type: '',
        area: '',
        date: ''
      }
    }
  },
  computed: {
    ...mapState(useMarketStore, ['projects']),
    ...mapWritableState(useMarketStore, ['merchantProjects']),
    allProjects() {
      // 统一使用 API 数据，避免本地和远程数据冲突
      const apiProjs = this.projects.map(p => ({
        id: p.id,
        name: p.name,
        title: p.name,
        description: p.description || '',
        area: p.area || p.location || '',
        date: p.date || p.publishDate || new Date().toLocaleDateString(),
        contactPerson: p.contactPerson || p.merchantName || p.owner?.name || p.owner?.username || '未知',
        contactInfo: p.contactInfo || '',
        isHot: p.isHot || false,
        isNew: p.isNew || false,
        merchantName: p.merchantName || p.owner?.name || p.owner?.username || '未知商户'
      }))
      return apiProjs
    },
    filteredProjects() {
      let filtered = this.allProjects
      
      if (this.filter.type) {
        filtered = filtered.filter(project => 
          (project.title || project.name).includes(this.filter.type)
        )
      }
      
      if (this.filter.area) {
        filtered = filtered.filter(project => 
          (project.area || project.location || '').includes(this.filter.area)
        )
      }
      
      if (this.filter.date) {
        filtered = filtered.filter(project => 
          (project.date || project.publishDate) === this.filter.date
        )
      }
      
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return filtered.slice(start, end)
    },
    totalPages() {
      let filtered = this.allProjects
      
      if (this.filter.type) {
        filtered = filtered.filter(project => 
          (project.title || project.name).includes(this.filter.type)
        )
      }
      
      if (this.filter.area) {
        filtered = filtered.filter(project => 
          (project.area || project.location || '').includes(this.filter.area)
        )
      }
      
      if (this.filter.date) {
        filtered = filtered.filter(project => 
          (project.date || project.publishDate) === this.filter.date
        )
      }
      
      return Math.max(1, Math.ceil(filtered.length / this.pageSize))
    }
  },
  async mounted() {
    await this.loadProjects()
  },
  methods: {
    async loadProjects() {
      try {
        await this.marketStore.fetchProjectsFromAPI(true)
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    resetFilter() {
      this.filter = {
        type: '',
        area: '',
        date: ''
      }
      this.currentPage = 1
    }
  }
}
</script>

<style scoped>
.projects-container {
  padding: 20px;
}

.filter-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item label {
  font-size: 14px;
  color: #666;
}

.filter-item select,
.filter-item input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.project-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.project-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-header h2 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.project-tags {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-hot {
  background-color: #ffebee;
  color: #d32f2f;
}

.tag-new {
  background-color: #e3f2fd;
  color: #1976d2;
}

.tag-merchant {
  background-color: #e8f5e9;
  color: #388e3c;
}

.project-content {
  padding: 20px;
}

.project-description {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.5;
}

.project-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  gap: 10px;
}

.detail-label {
  font-weight: 500;
  color: #333;
  width: 100px;
}

.detail-value {
  color: #666;
  flex: 1;
}

.merchant-value {
  color: #4CAF50;
  font-weight: 500;
}

.project-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.page-info {
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
  }
  
  .filter-item select,
  .filter-item input {
    width: 100%;
  }
  
  .project-list {
    grid-template-columns: 1fr;
  }
  
  .project-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .project-header h2 {
    font-size: 16px;
  }
}
</style>