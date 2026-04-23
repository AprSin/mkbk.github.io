<template>
  <div class="pagination-pro-container">
    <!-- 统计信息 -->
    <div class="pagination-stats">
      <span class="total-info">
        共 <strong>{{ total }}</strong> 条记录
        <template v-if="totalPages > 0">
          ，第 <strong>{{ currentPage }}</strong> / <strong>{{ totalPages }}</strong> 页
        </template>
      </span>
      
      <!-- 每页条数选择器 -->
      <div class="page-size-selector">
        <span>每页显示：</span>
        <select 
          :value="pageSize" 
          @change="handleSizeChange($event.target.value)"
          :disabled="loading"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}条
          </option>
        </select>
      </div>
    </div>

    <!-- 页码导航 -->
    <div class="pagination-nav" v-if="totalPages > 0">
      <!-- 首页 -->
      <button 
        class="btn btn-nav btn-first"
        :disabled="currentPage <= 1 || loading"
        @click="goToPage(1)"
        title="首页"
      >
        首页
      </button>
      
      <!-- 上一页 -->
      <button 
        class="btn btn-nav btn-prev"
        :disabled="currentPage <= 1 || loading"
        @click="goToPage(currentPage - 1)"
        title="上一页"
      >
        <span class="nav-icon">‹</span>
        上一页
      </button>
      
      <!-- 页码 -->
      <div class="page-numbers">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          class="btn btn-page"
          :class="{ 
            active: page === currentPage,
            'page-ellipsis': page === '...'
          }"
          :disabled="loading || page === '...'"
          @click="page !== '...' && goToPage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <!-- 下一页 -->
      <button 
        class="btn btn-nav btn-next"
        :disabled="currentPage >= totalPages || loading"
        @click="goToPage(currentPage + 1)"
        title="下一页"
      >
        下一页
        <span class="nav-icon">›</span>
      </button>
      
      <!-- 末页 -->
      <button 
        class="btn btn-nav btn-last"
        :disabled="currentPage >= totalPages || loading"
        @click="goToPage(totalPages)"
        title="末页"
      >
        末页
      </button>
    </div>

    <!-- 快速跳转 -->
    <div class="quick-jump" v-if="totalPages > 1">
      <span>跳至</span>
      <input 
        type="number" 
        v-model.number="jumpPage"
        :min="1"
        :max="totalPages"
        @keyup.enter="handleJump"
        :disabled="loading"
      />
      <span>页</span>
      <button 
        class="btn btn-jump"
        @click="handleJump"
        :disabled="loading"
      >
        确定
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!loading && total === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>暂无数据</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'PaginationPro',
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
    },
    pageSizeOptions: {
      type: Array,
      default: () => [5, 10, 20, 50]
    },
    maxVisiblePages: {
      type: Number,
      default: 5
    }
  },
  emits: ['page-change', 'size-change'],
  setup(props, { emit }) {
    const jumpPage = ref('')

    const totalPages = computed(() => {
      return Math.ceil(props.total / props.pageSize)
    })

    // 计算可见页码
    const visiblePages = computed(() => {
      const pages = []
      const total = totalPages.value
      const current = props.currentPage
      const maxVisible = props.maxVisiblePages

      if (total <= maxVisible) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        const halfVisible = Math.floor(maxVisible / 2)
        let start = current - halfVisible
        let end = current + halfVisible

        if (start < 1) {
          start = 1
          end = maxVisible
        }
        if (end > total) {
          end = total
          start = total - maxVisible + 1
        }

        // 添加首页和省略号
        if (start > 1) {
          pages.push(1)
          if (start > 2) {
            pages.push('...')
          }
        }

        for (let i = start; i <= end; i++) {
          pages.push(i)
        }

        // 添加省略号和末页
        if (end < total) {
          if (end < total - 1) {
            pages.push('...')
          }
          pages.push(total)
        }
      }

      return pages
    })

    const goToPage = (page) => {
      if (page < 1 || page > totalPages.value || page === props.currentPage || props.loading) {
        return
      }
      emit('page-change', page)
    }

    const handleSizeChange = (size) => {
      const newSize = parseInt(size)
      if (newSize !== props.pageSize) {
        emit('size-change', newSize)
      }
    }

    const handleJump = () => {
      const page = parseInt(jumpPage.value)
      if (page && page >= 1 && page <= totalPages.value) {
        goToPage(page)
        jumpPage.value = ''
      } else {
        alert(`请输入1-${totalPages.value}之间的页码`)
      }
    }

    // 重置跳转页码当总页数变化时
    watch(totalPages, () => {
      jumpPage.value = ''
    })

    return {
      jumpPage,
      totalPages,
      visiblePages,
      goToPage,
      handleSizeChange,
      handleJump
    }
  }
}
</script>

<style scoped>
.pagination-pro-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  position: relative;
}

.pagination-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 10px;
}

.total-info {
  font-size: 14px;
  color: #666;
}

.total-info strong {
  color: #4CAF50;
  font-weight: 600;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.page-size-selector select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.page-size-selector select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #4CAF50;
  color: #4CAF50;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.btn-nav {
  padding: 8px 12px;
}

.nav-icon {
  font-size: 16px;
  font-weight: bold;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.btn-page {
  min-width: 36px;
  padding: 8px 12px;
  justify-content: center;
}

.btn-page.active {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.btn-page.page-ellipsis {
  cursor: default;
  border: none;
  background: transparent;
}

.quick-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.quick-jump input {
  width: 50px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.quick-jump input:disabled {
  opacity: 0.6;
  background: #f5f5f5;
}

.btn-jump {
  padding: 6px 12px;
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.btn-jump:hover:not(:disabled) {
  background: #45a049;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 8px;
  z-index: 10;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #ddd;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.empty-state p {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pagination-stats {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-nav {
    gap: 4px;
  }

  .btn-nav {
    padding: 6px 8px;
    font-size: 12px;
  }

  .btn-nav .nav-text {
    display: none;
  }

  .btn-page {
    min-width: 32px;
    padding: 6px 8px;
    font-size: 12px;
  }

  .quick-jump {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .pagination-pro-container {
    padding: 15px 10px;
  }

  .btn-first,
  .btn-last {
    display: none;
  }
}
</style>
