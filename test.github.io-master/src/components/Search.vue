<template>
  <div class="search-container">
    <div class="search-box">
      <input 
        type="text" 
        v-model="searchQuery" 
        @input="handleSearch"
        @focus="showResults = true"
        @blur="hideResults"
        placeholder="搜索项目、农产品..."
        class="search-input"
      >
      <button class="search-btn" @click="doSearch">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </div>
    <div v-if="showResults && searchQuery && (projectResults.length > 0 || productResults.length > 0)" class="search-results">
      <div v-if="projectResults.length > 0" class="result-section">
        <h4>交易项目</h4>
        <div v-for="project in projectResults" :key="project.id" class="result-item" @mousedown="goToProject(project.id)">
          <span class="result-title">{{ project.title }}</span>
          <span class="result-meta">{{ project.area }}</span>
        </div>
      </div>
      <div v-if="productResults.length > 0" class="result-section">
        <h4>农产品</h4>
        <div v-for="product in productResults" :key="product.id" class="result-item" @mousedown="goToProduct(product.id)">
          <span class="result-title">{{ product.name }}</span>
          <span class="result-meta">¥{{ product.price }}/斤</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Search',
  data() {
    return {
      searchQuery: '',
      showResults: false,
      debounceTimer: null,
      projects: [
        { id: 'SQ2026001', title: '商丘市梁园区谢集镇杨波村宅基地出租', area: '商丘市梁园区谢集镇' },
        { id: 'SQ2026002', title: '商丘市梁园区谢集镇东街村村中心广场西侧厂房出租', area: '商丘市梁园区谢集镇' },
        { id: 'SQ2026003', title: '商丘市民权县龙塘镇汤庄村委伏店村临路宅基地出租', area: '商丘市民权县龙塘镇' },
        { id: 'SQ2026004', title: '商丘市梁园区谢集镇王步口村闲置厂房出租', area: '商丘市梁园区谢集镇' }
      ],
      products: [
        { id: '1', name: '商丘市梁园区优质小麦', price: 2.5 },
        { id: '2', name: '商丘市梁园区绿色蔬菜', price: 3.0 },
        { id: '3', name: '商丘市梁园区特色水果', price: 5.0 },
        { id: '4', name: '商丘市梁园区优质玉米', price: 1.8 }
      ]
    }
  },
  computed: {
    projectResults() {
      if (!this.searchQuery) return []
      const query = this.searchQuery.toLowerCase()
      return this.projects.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.area.toLowerCase().includes(query)
      ).slice(0, 3)
    },
    productResults() {
      if (!this.searchQuery) return []
      const query = this.searchQuery.toLowerCase()
      return this.products.filter(p =>
        p.name.toLowerCase().includes(query)
      ).slice(0, 3)
    }
  },
  methods: {
    handleSearch() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      this.debounceTimer = setTimeout(() => {
        this.showResults = true
      }, 150)
    },
    hideResults() {
      setTimeout(() => {
        this.showResults = false
      }, 200)
    },
    goToProject(id) {
      this.$router.push(`/project/detail/${id}`)
      this.searchQuery = ''
      this.showResults = false
    },
    goToProduct(id) {
      this.$router.push(`/product/detail/${id}`)
      this.searchQuery = ''
      this.showResults = false
    },
    doSearch() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      if (this.projectResults.length > 0) {
        this.goToProject(this.projectResults[0].id)
      } else if (this.productResults.length > 0) {
        this.goToProduct(this.productResults[0].id)
      }
    }
  },
  beforeUnmount() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }
}
</script>

<style scoped>
.search-container {
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 5px 15px;
  width: 300px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: white;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  opacity: 0.8;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 10px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.result-section {
  padding: 10px 0;
}

.result-section h4 {
  font-size: 12px;
  color: #999;
  padding: 0 15px;
  margin: 0 0 8px 0;
}

.result-section:first-child {
  border-bottom: 1px solid #f0f0f0;
}

.result-item {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-item:hover {
  background-color: #f5f5f5;
}

.result-title {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
}

@media (max-width: 768px) {
  .search-box {
    width: 200px;
  }
}

@media (max-width: 480px) {
  .search-box {
    width: 150px;
  }
}
</style>