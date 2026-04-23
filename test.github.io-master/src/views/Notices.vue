<template>
  <div class="notices-container">
    <h1>通知公告</h1>
    <div class="filter-section">
      <div class="filter-item">
        <label>公告类型</label>
        <select v-model="filter.type">
          <option value="">全部</option>
          <option value="政策法规">政策法规</option>
          <option value="通知">通知</option>
          <option value="公告">公告</option>
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
    
    <div class="notice-list">
      <div v-for="notice in filteredNotices" :key="notice.id" class="notice-card">
        <div class="notice-header">
          <h2 class="notice-title">{{ notice.title }}</h2>
          <div class="notice-tags">
            <span v-if="notice.isImportant" class="tag tag-important">重要</span>
          </div>
        </div>
        <div class="notice-content">
          <p class="notice-summary">{{ notice.summary }}</p>
          <div class="notice-meta">
            <span class="meta-item">发布日期: {{ notice.date }}</span>
            <span class="meta-item">发布单位: {{ notice.organization }}</span>
          </div>
        </div>
        <div class="notice-footer">
          <router-link :to="`/notice/detail/${notice.id}`" class="btn btn-primary">查看详情</router-link>
        </div>
      </div>
    </div>
    
    <div v-if="filteredNotices.length === 0" class="empty-state">
      没有更多了哦
    </div>
    
    <div class="pagination">
      <button class="btn btn-secondary" @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button class="btn btn-secondary" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Notices',
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      filter: {
        type: '',
        date: ''
      },
      notices: [
        {
          id: '1',
          title: '商丘市梁园区人民政府 关于印发《商丘市梁园区农村产权交易市场体系建设方案》《商丘市梁园区农村产权流转交易运营管理办法（试行）》的通知',
          summary: '为规范农村产权交易行为，保障交易双方合法权益，促进农村产权流转交易市场健康发展，特制定本方案和管理办法。',
          content: '为规范农村产权交易行为，保障交易双方合法权益，促进农村产权流转交易市场健康发展，特制定本方案和管理办法。本方案和管理办法自发布之日起施行。',
          date: '2024-06-01',
          organization: '商丘市梁园区人民政府',
          isImportant: true
        },
        {
          id: '2',
          title: '商丘市梁园区农村产权流转交易运营管理办法（试行）',
          summary: '本办法旨在规范农村产权流转交易行为，维护交易秩序，保障交易双方合法权益，促进农村产权流转交易市场健康发展。',
          content: '本办法旨在规范农村产权流转交易行为，维护交易秩序，保障交易双方合法权益，促进农村产权流转交易市场健康发展。办法共分为总则、交易范围、交易程序、交易规范、监督管理、附则等六章，对农村产权交易的各个环节进行了详细规定。',
          date: '2024-05-01',
          organization: '商丘市梁园区农业农村局',
          isImportant: false
        },
        {
          id: '3',
          title: '关于进一步规范农村产权交易行为的通知',
          summary: '为进一步规范农村产权交易行为，提高交易效率，保障交易安全，现对农村产权交易有关事项通知如下。',
          content: '为进一步规范农村产权交易行为，提高交易效率，保障交易安全，现对农村产权交易有关事项通知如下：1. 严格执行交易程序；2. 加强交易信息公开；3. 规范交易合同管理；4. 强化交易监督检查。',
          date: '2024-04-15',
          organization: '商丘市梁园区农村产权交易中心',
          isImportant: false
        },
        {
          id: '4',
          title: '2024年农村产权交易平台操作培训通知',
          summary: '为提高农村产权交易平台使用效率，现组织开展2024年农村产权交易平台操作培训，具体事项通知如下。',
          content: '为提高农村产权交易平台使用效率，现组织开展2024年农村产权交易平台操作培训，具体事项通知如下：培训时间：2024年4月20日；培训地点：商丘市梁园区农村产权交易中心；培训内容：平台操作流程、交易规则解读、案例分析等。',
          date: '2024-03-20',
          organization: '商丘市梁园区农村产权交易中心',
          isImportant: false
        },
        {
          id: '5',
          title: '关于农村产权交易项目信息发布的通知',
          summary: '为规范农村产权交易项目信息发布行为，提高信息透明度，现对项目信息发布有关事项通知如下。',
          content: '为规范农村产权交易项目信息发布行为，提高信息透明度，现对项目信息发布有关事项通知如下：1. 信息发布内容必须真实、准确、完整；2. 信息发布格式必须规范；3. 信息发布时间必须符合规定；4. 信息发布渠道必须合法。',
          date: '2024-03-01',
          organization: '商丘市梁园区农村产权交易中心',
          isImportant: false
        },
        {
          id: '6',
          title: '农村产权交易常见问题解答',
          summary: '为方便广大用户了解农村产权交易相关知识，现整理了常见问题解答，供大家参考。',
          content: '为方便广大用户了解农村产权交易相关知识，现整理了常见问题解答，供大家参考：1. 农村产权交易的范围包括哪些？2. 如何申请农村产权交易？3. 农村产权交易的流程是什么？4. 农村产权交易需要哪些材料？5. 农村产权交易的收费标准是什么？',
          date: '2024-02-15',
          organization: '商丘市梁园区农村产权交易中心',
          isImportant: false
        },
        {
          id: '7',
          title: '关于加强农村产权交易档案管理的通知',
          summary: '为加强农村产权交易档案管理，保障交易档案的完整性和安全性，现对档案管理有关事项通知如下。',
          content: '为加强农村产权交易档案管理，保障交易档案的完整性和安全性，现对档案管理有关事项通知如下：1. 建立健全档案管理制度；2. 规范档案收集、整理、归档流程；3. 加强档案安全管理；4. 提高档案利用效率。',
          date: '2024-02-01',
          organization: '商丘市梁园区农村产权交易中心',
          isImportant: false
        },
        {
          id: '8',
          title: '农村产权交易平台系统升级公告',
          summary: '为提高平台服务质量，农村产权交易平台将于近期进行系统升级，具体事项公告如下。',
          content: '为提高平台服务质量，农村产权交易平台将于2024年1月20日至2024年1月22日进行系统升级，期间平台将暂停服务。升级后，平台将新增多项功能，包括在线支付、电子合同签署、交易数据分析等。',
          date: '2024-01-15',
          organization: '商丘市梁园区农村产权交易中心',
          isImportant: true
        }
      ]
    }
  },
  computed: {
    filteredNotices() {
      let filtered = this.notices
      
      if (this.filter.type) {
        filtered = filtered.filter(notice => notice.title.includes(this.filter.type))
      }
      
      if (this.filter.date) {
        filtered = filtered.filter(notice => notice.date === this.filter.date)
      }
      
      // 按日期降序排序
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      // 分页
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return filtered.slice(start, end)
    },
    totalPages() {
      let filtered = this.notices
      
      if (this.filter.type) {
        filtered = filtered.filter(notice => notice.title.includes(this.filter.type))
      }
      
      if (this.filter.date) {
        filtered = filtered.filter(notice => notice.date === this.filter.date)
      }
      
      return Math.ceil(filtered.length / this.pageSize)
    }
  },
  methods: {
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
        date: ''
      }
      this.currentPage = 1
    }
  }
}
</script>

<style scoped>
.notices-container {
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

.notice-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.notice-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.notice-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.notice-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  color: #333;
  flex: 1;
}

.notice-content {
  padding: 20px;
}

.notice-summary {
  margin-bottom: 15px;
  color: #666;
  line-height: 1.5;
}

.notice-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 14px;
  color: #999;
}

.notice-footer {
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
  
  .notice-list {
    grid-template-columns: 1fr;
  }
  
  .notice-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .notice-title {
    font-size: 14px;
  }
}
</style>