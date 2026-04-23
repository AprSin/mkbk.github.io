<template>
  <div class="products-container">
    <h1>农产品交易</h1>
    <div class="filter-section">
      <div class="filter-item">
        <label>产品类型</label>
        <select v-model="filter.type">
          <option value="">全部</option>
          <option value="粮食">粮食</option>
          <option value="蔬菜">蔬菜</option>
          <option value="水果">水果</option>
        </select>
      </div>
      <div class="filter-item">
        <label>价格区间</label>
        <select v-model="filter.priceRange">
          <option value="">全部</option>
          <option value="0-5">0-5元/斤</option>
          <option value="5-10">5-10元/斤</option>
          <option value="10+">10元/斤以上</option>
        </select>
      </div>
      <div class="filter-item">
        <label>排序方式</label>
        <select v-model="sortBy">
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
          <option value="date-desc">最新发布</option>
        </select>
      </div>
      <div class="filter-item">
        <button class="btn btn-primary" @click="resetFilter">重置</button>
      </div>
    </div>

    <div class="product-list">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <div class="product-image-container">
          <img :src="product.image" :alt="product.name" class="product-image">
          <div v-if="product.isNew" class="product-tag tag-new">新品</div>
          <div v-if="product.isHot" class="product-tag tag-hot">热销</div>
          <div v-if="product.merchantName" class="product-tag tag-merchant">商户</div>
        </div>
        <div class="product-info">
          <h2 class="product-name">{{ product.name }}</h2>
          <p class="product-price">¥{{ product.price }}/斤</p>
          <p class="product-description">{{ product.description }}</p>
          <div class="product-meta">
            <span v-if="product.merchantName" class="meta-item merchant">发布商户: {{ product.merchantName }}</span>
            <span class="meta-item">产地: {{ product.origin }}</span>
            <span class="meta-item shipping-time" :class="'shipping-' + (product.shippingTime || '24小时内发货').replace(/[^\w\u4e00-\u9fa5]/g, '')">{{ product.shippingTime || '24小时内发货' }}</span>
            <span class="meta-item">发布日期: {{ product.date || product.publishDate }}</span>
          </div>
          <div class="product-actions">
            <button v-if="!userStore.isMerchant" class="btn btn-secondary" @click="handleBuyNow(product)">立即购买</button>
            <router-link :to="`/product/detail/${product.id}`" class="btn btn-secondary">查看详情</router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredProducts.length === 0" class="empty-state">
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
import { useUserStore } from '@/store/modules/user'

export default {
  name: 'Products',
  setup() {
    const userStore = useUserStore()
    const marketStore = useMarketStore()
    return { userStore, marketStore }
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      filter: {
        type: '',
        priceRange: ''
      },
      sortBy: 'date-desc',
      loading: false,
      error: null
    }
  },
  computed: {
    ...mapState(useMarketStore, ['products']),
    ...mapWritableState(useMarketStore, ['merchantProducts']),
    allProducts() {
      // 统一使用 API 数据，避免本地和远程数据冲突
      const apiProds = this.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description || '',
        origin: p.origin || '商丘市梁园区',
        date: p.date || p.publishDate || new Date().toLocaleDateString(),
        image: p.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20farm%20products&image_size=square',
        isHot: p.isHot || false,
        isNew: p.isNew || false,
        stock: p.stock || 0,
        merchantName: p.merchantName || p.seller?.name || p.seller?.username || '未知商户'
      }))
      return apiProds
    },
    baseFilteredProducts() {
      let filtered = this.allProducts

      if (this.filter.type) {
        filtered = filtered.filter(product => product.name.includes(this.filter.type))
      }

      if (this.filter.priceRange) {
        const [min, max] = this.filter.priceRange === '10+' 
          ? [10, Infinity]
          : this.filter.priceRange.split('-').map(Number)
        filtered = filtered.filter(product => {
          if (this.filter.priceRange === '10+') {
            return product.price > 10
          }
          return product.price >= min && product.price <= max
        })
      }

      switch (this.sortBy) {
        case 'price-asc':
          filtered = [...filtered].sort((a, b) => a.price - b.price)
          break
        case 'price-desc':
          filtered = [...filtered].sort((a, b) => b.price - a.price)
          break
        case 'date-desc':
          filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date))
          break
      }

      return filtered
    },
    filteredProducts() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.baseFilteredProducts.slice(start, end)
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.baseFilteredProducts.length / this.pageSize))
    }
  },
  async mounted() {
    await this.loadProducts()
  },
  methods: {
    async loadProducts() {
      try {
        await this.marketStore.fetchProductsFromAPI(true)
      } catch (error) {
        console.error('Failed to load products:', error)
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
        priceRange: ''
      }
      this.sortBy = 'date-desc'
      this.currentPage = 1
    },
    handleBuyNow(product) {
      if (!this.userStore.isLoggedIn) {
        this.$root.showLoginDialog = true
        return
      }
      if (this.userStore.isMerchant) {
        alert('商户无法购买农产品')
        return
      }
      this.$router.push(`/buy/${product.id}`)
    }
  }
}
</script>

<style scoped>
.products-container {
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

.filter-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-tag {
  position: absolute;
  top: 10px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-new {
  left: 10px;
  background-color: rgba(255, 193, 7, 0.9);
  color: white;
}

.tag-hot {
  right: 10px;
  background-color: rgba(244, 67, 54, 0.9);
  color: white;
}

.tag-merchant {
  right: 10px;
  top: auto;
  bottom: 10px;
  background-color: rgba(76, 175, 80, 0.9);
  color: white;
}

.product-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #333;
}

.product-price {
  font-size: 20px;
  font-weight: bold;
  color: #F44336;
  margin: 0 0 10px 0;
}

.product-description {
  color: #666;
  line-height: 1.5;
  margin: 0 0 15px 0;
  flex: 1;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #999;
}

.product-meta .merchant {
  color: #4CAF50;
  font-weight: 500;
}

.product-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

  .filter-item select {
    width: 100%;
  }

  .product-list {
    grid-template-columns: 1fr;
  }

  .product-actions {
    flex-direction: column;
  }

  .product-actions button,
  .product-actions a {
    width: 100%;
  }
}
</style>