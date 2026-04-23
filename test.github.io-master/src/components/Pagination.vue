<template>
  <div class="pagination-container">
    <div class="pagination-info">
      共 <span class="total-count">{{ total }}</span> 条记录
      <span v-if="totalPages > 0">，第 {{ currentPage }} / {{ totalPages }} 页</span>
    </div>
    <div class="pagination-controls">
      <button 
        class="btn btn-page" 
        :disabled="currentPage <= 1 || loading"
        @click="goToPage(currentPage - 1)"
      >
        上一页
      </button>
      
      <div class="page-numbers">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          class="btn btn-page-number"
          :class="{ active: page === currentPage }"
          :disabled="loading"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <button 
        class="btn btn-page" 
        :disabled="currentPage >= totalPages || loading"
        @click="goToPage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
    <div v-if="loading" class="loading-indicator">
      <span class="loading-spinner"></span>
      加载中...
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 10
    },
    total: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.pageSize)
    },
    visiblePages() {
      const pages = []
      const maxVisible = 5
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2))
      let end = Math.min(this.totalPages, start + maxVisible - 1)
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    }
  },
  methods: {
    goToPage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage || this.loading) {
        return
      }
      this.$emit('page-change', page)
    }
  }
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 15px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

.total-count {
  font-weight: bold;
  color: #4CAF50;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #4CAF50;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-page-number {
  min-width: 36px;
  padding: 8px 12px;
}

.btn-page-number.active {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
