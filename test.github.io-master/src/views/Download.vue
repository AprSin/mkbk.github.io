<template>
  <div class="download-container">
    <h1>资料下载</h1>
    <div class="download-categories">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="['category-btn', { active: selectedCategory === category.id }]"
        @click="selectedCategory = category.id"
      >
        {{ category.name }}
      </button>
    </div>

    <div class="download-list">
      <div v-for="file in filteredFiles" :key="file.id" class="download-card">
        <div class="file-info">
          <div class="file-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>
          </div>
          <div class="file-details">
            <h2 class="file-name">{{ file.name }}</h2>
            <p class="file-description">{{ file.description }}</p>
            <div class="file-meta">
              <span class="meta-item">文件大小: {{ file.size }}</span>
              <span class="meta-item">发布日期: {{ file.date }}</span>
            </div>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-primary" @click="handleDownload(file)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            下载
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredFiles.length === 0" class="empty-state">
      该分类下暂无资料
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../store/modules/user'

export default {
  name: 'Download',
  setup() {
    const userStore = useUserStore()
    return { userStore }
  },
  data() {
    return {
      selectedCategory: 'all',
      categories: [
        { id: 'all', name: '全部' },
        { id: 'policy', name: '政策法规' },
        { id: 'guide', name: '交易指南' },
        { id: 'form', name: '表格下载' },
        { id: 'other', name: '其他资料' }
      ],
      files: [
        {
          id: '1',
          name: '商丘市梁园区农村产权交易市场体系建设方案',
          description: '商丘市梁园区农村产权交易市场体系建设方案，包含市场体系建设的目标、任务和措施。',
          size: '2.5MB',
          date: '2024-06-01',
          category: 'policy',
          url: '#'
        },
        {
          id: '2',
          name: '商丘市梁园区农村产权流转交易运营管理办法（试行）',
          description: '商丘市梁园区农村产权流转交易运营管理办法，包含交易范围、程序和规范等内容。',
          size: '1.8MB',
          date: '2024-05-01',
          category: 'policy',
          url: '#'
        },
        {
          id: '3',
          name: '农村产权交易操作指南',
          description: '农村产权交易操作指南，包含交易流程、所需材料和注意事项等内容。',
          size: '1.2MB',
          date: '2024-04-15',
          category: 'guide',
          url: '#'
        },
        {
          id: '4',
          name: '农村产权交易申请表',
          description: '农村产权交易申请表，用于申请农村产权交易的表格。',
          size: '0.5MB',
          date: '2024-04-01',
          category: 'form',
          url: '#'
        },
        {
          id: '5',
          name: '农村产权交易合同模板',
          description: '农村产权交易合同模板，用于农村产权交易的合同范本。',
          size: '0.8MB',
          date: '2024-03-20',
          category: 'form',
          url: '#'
        },
        {
          id: '6',
          name: '农村产权交易常见问题解答',
          description: '农村产权交易常见问题解答，包含交易过程中常见问题的解答。',
          size: '1.0MB',
          date: '2024-03-10',
          category: 'guide',
          url: '#'
        },
        {
          id: '7',
          name: '农村产权交易平台操作手册',
          description: '农村产权交易平台操作手册，包含平台的使用方法和操作步骤。',
          size: '2.0MB',
          date: '2024-02-15',
          category: 'guide',
          url: '#'
        },
        {
          id: '8',
          name: '农村产权交易档案管理办法',
          description: '农村产权交易档案管理办法，包含档案的收集、整理和归档等内容。',
          size: '1.5MB',
          date: '2024-02-01',
          category: 'policy',
          url: '#'
        }
      ]
    }
  },
  computed: {
    filteredFiles() {
      if (this.selectedCategory === 'all') {
        return this.files
      }
      return this.files.filter(file => file.category === this.selectedCategory)
    }
  },
  methods: {
    handleDownload(file) {
      if (!this.userStore.isLoggedIn) {
        this.$root.showLoginDialog = true
        return
      }
      this.downloadFile(file)
    },
    downloadFile(file) {
      alert(`开始下载 ${file.name}...`)
      setTimeout(() => {
        alert(`下载成功！${file.name} 已保存到您的设备。`)
      }, 1000)
    }
  }
}
</script>

<style scoped>
.download-container {
  padding: 20px;
}

.download-categories {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.category-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.category-btn.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.download-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.download-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.file-info {
  display: flex;
  gap: 15px;
  flex: 1;
}

.file-icon {
  background-color: rgba(76, 175, 80, 0.1);
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #333;
}

.file-description {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.file-actions {
  display: flex;
  align-items: flex-start;
}

.file-actions button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .download-list {
    grid-template-columns: 1fr;
  }

  .download-card {
    flex-direction: column;
    gap: 15px;
  }

  .file-actions {
    align-items: flex-end;
  }
}
</style>