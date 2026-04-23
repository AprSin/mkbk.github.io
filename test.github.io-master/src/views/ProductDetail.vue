<template>
  <div class="product-detail-container">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">加载中...</div>
    </div>
    <h1>农产品详情</h1>
    <div class="product-detail" v-if="product.id">
      <div class="product-header">
        <h2>{{ product.name }}</h2>
        <div class="product-tags">
          <span v-if="product.isHot" class="tag tag-hot">热销</span>
          <span v-if="product.isNew" class="tag tag-new">新品</span>
          <span v-if="product.category" class="tag tag-category">{{ product.category }}</span>
        </div>
      </div>
      <div class="product-content">
        <div class="product-image">
          <img :src="product.image" :alt="product.name">
        </div>
        <div class="product-info">
          <div class="info-item">
            <span class="info-label">价格:</span>
            <span class="info-value price">¥{{ product.price }}/斤</span>
          </div>
          <div class="info-item">
            <span class="info-label">产地:</span>
            <span class="info-value">{{ product.origin || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">库存:</span>
            <span class="info-value">{{ product.stock }}斤</span>
          </div>
          <div class="info-item">
            <span class="info-label">销量:</span>
            <span class="info-value">{{ product.salesCount || 0 }}斤</span>
          </div>
          <div class="info-item">
            <span class="info-label">浏览量:</span>
            <span class="info-value">{{ product.viewCount || 0 }}次</span>
          </div>
          <div class="info-item">
            <span class="info-label">发布时间:</span>
            <span class="info-value">{{ formatDateTime(product.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">更新时间:</span>
            <span class="info-value">{{ formatDateTime(product.updatedAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">产品状态:</span>
            <span :class="['status-badge', product.statusClass]">{{ product.statusText }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发货时间:</span>
            <span class="info-value shipping-time" :class="'shipping-' + (product.shippingTime || '24小时内发货').replace(/[^\w\u4e00-\u9fa5]/g, '')">{{ product.shippingTime || '24小时内发货' }}</span>
          </div>
        </div>
      </div>
      <div class="product-section">
        <h3>卖家信息</h3>
        <div class="seller-info-grid">
          <div class="info-item">
            <span class="info-label">商户名称:</span>
            <span class="info-value">{{ product.sellerName || '未知商户' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系人:</span>
            <span class="info-value">{{ product.sellerPhone || '暂无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话:</span>
            <span class="info-value">{{ product.sellerPhone || '暂无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">公司名称:</span>
            <span class="info-value">{{ product.companyName || '暂无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">公司地址:</span>
            <span class="info-value">{{ product.companyAddress || '暂无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">经营范围:</span>
            <span class="info-value">{{ product.businessScope || '暂无' }}</span>
          </div>
        </div>
      </div>
      <div class="product-description">
        <h3>产品描述</h3>
        <p>{{ product.description || '暂无产品描述' }}</p>
      </div>
      <div class="product-actions">
        <div class="quantity-control">
          <button @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
          <input type="number" v-model="quantity" min="1" :max="product.stock">
          <button @click="increaseQuantity" :disabled="quantity >= product.stock">+</button>
          <span class="quantity-hint">斤</span>
        </div>
        <button class="btn btn-primary" @click="handleBuyNow">立即购买</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../store/modules/user'
import { useMarketStore } from '../store/modules/market'
import { productAPI } from '../utils/productAPI'

export default {
  name: 'ProductDetail',
  setup() {
    const userStore = useUserStore()
    const marketStore = useMarketStore()
    return { userStore, marketStore }
  },
  data() {
    return {
      quantity: 1,
      loading: false,
      product: {
        id: '',
        name: '',
        price: 0,
        description: '',
        origin: '',
        stock: 0,
        salesCount: 0,
        viewCount: 0,
        category: '',
        status: '',
        statusText: '',
        statusClass: '',
        image: '',
        isHot: false,
        isNew: false,
        createdAt: '',
        updatedAt: '',
        sellerName: '',
        sellerPhone: '',
        companyName: '',
        companyAddress: '',
        businessScope: ''
      }
    }
  },
  async mounted() {
    await this.loadProduct()
  },
  methods: {
    formatDateTime(dateString) {
      if (!dateString) return '未知时间'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '时间格式错误'
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    getRelativeTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diff = now - date
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (days > 0) return `${days}天前`
      if (hours > 0) return `${hours}小时前`
      if (minutes > 0) return `${minutes}分钟前`
      return '刚刚'
    },
    getStatusClass(status) {
      const statusMap = {
        '在售': 'success',
        '已售罄': 'warning',
        '下架': 'danger'
      }
      return statusMap[status] || 'default'
    },
    async loadProduct() {
      const productId = this.$route.params.id
      if (!productId) return

      this.loading = true
      try {
        const result = await productAPI.getProduct(productId)
        if (result.product) {
          const status = result.product.status || '在售'
          this.product = {
            id: result.product.id,
            name: result.product.name,
            price: parseFloat(result.product.price),
            description: result.product.description || '暂无描述',
            origin: result.product.origin || '未知',
            stock: result.product.stock || 0,
            salesCount: result.product.salesCount || 0,
            viewCount: result.product.viewCount || 0,
            category: result.product.category || '',
            status: status,
            statusText: status,
            statusClass: this.getStatusClass(status),
            image: result.product.image || 'https://via.placeholder.com/400x300?text=No+Image',
            isHot: result.product.isHot || false,
            isNew: result.product.isNew || false,
            createdAt: result.product.createdAt || '',
            updatedAt: result.product.updatedAt || '',
            sellerName: result.product.seller?.name || result.product.seller?.username || '未知商户',
            sellerPhone: result.product.seller?.phone || '暂无',
            companyName: result.product.seller?.companyName || '暂无',
            companyAddress: result.product.seller?.companyAddress || '暂无',
            businessScope: result.product.seller?.businessScope || '暂无'
          }
        }
      } catch (error) {
        console.error('Failed to load product:', error)
        const storeProduct = this.marketStore.products.find(p => p.id == productId)
        if (storeProduct) {
          this.product = { ...this.product, ...storeProduct }
        }
      } finally {
        this.loading = false
      }
    },
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--
      }
    },
    increaseQuantity() {
      if (this.quantity < this.product.stock) {
        this.quantity++
      }
    },
    handleBuyNow() {
      if (!this.userStore.isLoggedIn) {
        this.$root.showLoginDialog = true
        return
      }
      if (this.product.stock <= 0) {
        alert('该商品已售罄，无法购买')
        return
      }
      this.$router.push(`/buy/${this.product.id}`)
    }
  },
  beforeUnmount() {
    this.loading = false
  }
}
</script>

<style scoped>
.product-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.product-detail {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.product-header {
  padding: 30px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.product-header h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #333;
  flex: 1;
}

.product-content {
  padding: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  border-bottom: 1px solid #eee;
}

.product-image {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  min-height: 300px;
}

.product-image img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  flex: 1;
  word-break: break-all;
}

.info-value.price {
  font-size: 28px;
  font-weight: bold;
  color: #e74c3c;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.warning {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.danger {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.default {
  background-color: #e2e3e5;
  color: #383d41;
}

.product-section {
  padding: 30px;
  border-bottom: 1px solid #eee;
  background-color: #fafafa;
}

.product-section h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 15px 0;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 2px solid #4CAF50;
  display: inline-block;
}

.seller-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.product-description {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.product-description h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 10px 0;
  color: #333;
}

.product-description p {
  margin: 0;
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
}

.product-actions {
  padding: 30px;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: flex-end;
  background-color: #f9f9f9;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.quantity-control button {
  width: 36px;
  height: 36px;
  border: none;
  background-color: #f5f5f5;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.quantity-control button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.quantity-control button:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #ccc;
}

.quantity-control input {
  width: 50px;
  height: 36px;
  border: none;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  text-align: center;
  font-size: 14px;
}

.quantity-hint {
  margin-left: 10px;
  color: #666;
  font-size: 14px;
}

.product-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag-hot {
  background-color: #ff4757;
  color: white;
}

.tag-new {
  background-color: #2ed573;
  color: white;
}

.tag-category {
  background-color: #3498db;
  color: white;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .product-content {
    grid-template-columns: 1fr;
  }
  
  .seller-info-grid {
    grid-template-columns: 1fr;
  }
  
  .product-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quantity-control {
    justify-content: center;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .info-label {
    width: auto;
  }
}
</style>