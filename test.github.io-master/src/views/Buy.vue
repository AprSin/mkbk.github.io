<template>
  <div class="buy-container">
    <h1>立即购买</h1>
    <div class="buy-content">
      <div class="product-info">
        <div class="product-image">
          <img :src="product.image" :alt="product.name">
        </div>
        <h2>{{ product.name }}</h2>
        <div class="info-item">
          <span class="info-label">价格:</span>
          <span class="info-value price">{{ product.price }}元/斤</span>
        </div>
        <div class="info-item">
          <span class="info-label">产地:</span>
          <span class="info-value">{{ product.origin }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">库存:</span>
          <span class="info-value">{{ product.stock }}斤</span>
        </div>
        <div class="info-item">
          <span class="info-label">销量:</span>
          <span class="info-value">{{ product.sales }}斤</span>
        </div>
      </div>
      <div class="buy-form">
        <h3>购买信息</h3>
        <form @submit.prevent="submitBuy">
          <div class="form-group">
            <label>购买数量 (斤)</label>
            <div class="quantity-control">
              <button type="button" @click="decreaseQuantity" :disabled="quantity <= 1">-</button>
              <input type="number" v-model="quantity" min="1" :max="product.stock">
              <button type="button" @click="increaseQuantity" :disabled="quantity >= product.stock">+</button>
            </div>
          </div>
          <div class="form-group">
            <label>总价格</label>
            <input type="text" :value="totalPrice" readonly class="readonly">
          </div>
          <div class="form-group">
            <label>收货人</label>
            <input type="text" v-model="buyer.name" required>
          </div>
          <div class="form-group">
            <label>联系电话</label>
            <input type="tel" v-model="buyer.phone" required>
          </div>
          <div class="form-group">
            <label>收货地址</label>
            <textarea v-model="buyer.address" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label>支付方式</label>
            <select v-model="buyer.paymentMethod" required>
              <option value="wechat">微信支付</option>
              <option value="alipay">支付宝</option>
              <option value="bank">银行转账</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">提交订单</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../store/modules/user'
import { useOrderStore } from '../store/modules/order'
import { productAPI } from '../utils/productAPI'

export default {
  name: 'Buy',
  setup() {
    const userStore = useUserStore()
    const orderStore = useOrderStore()
    return { userStore, orderStore }
  },
  data() {
    return {
      quantity: 1,
      product: {
        id: '',
        name: '',
        price: 0,
        origin: '',
        stock: 0,
        sales: 0,
        image: ''
      },
      loading: false,
      buyer: {
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'wechat'
      }
    }
  },
  computed: {
    totalPrice() {
      return (this.quantity * this.product.price).toFixed(2) + '元';
    }
  },
  async mounted() {
    console.log('[Buy.vue] mounted, 登录状态:', this.userStore.isLoggedIn)
    if (!this.userStore.isLoggedIn) {
      this.$root.showLoginDialog = true
      return
    }
    console.log('[Buy.vue] 开始加载商品, ID:', this.$route.params.id)
    await this.loadProduct()
    if (this.userStore.userInfo) {
      this.buyer.name = this.userStore.userInfo.name || ''
      this.buyer.phone = this.userStore.userInfo.phone || ''
      this.buyer.address = this.userStore.userInfo.address || ''
    }
  },
  methods: {
    async loadProduct() {
      const productId = this.$route.params.id
      if (!productId) return
      this.loading = true
      console.log('[Buy.vue] loadProduct 开始, productId:', productId)
      try {
        console.log('[Buy.vue] 调用 productAPI.getProduct')
        const result = await productAPI.getProduct(productId)
        console.log('[Buy.vue] productAPI.getProduct 返回:', result)
        if (result.product) {
          this.product = {
            id: result.product.id,
            name: result.product.name,
            price: parseFloat(result.product.price),
            origin: result.product.origin || '商丘市梁园区',
            stock: result.product.stock || 0,
            sales: result.product.salesCount || 0,
            image: result.product.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20farm%20products&image_size=square',
            sellerId: result.product.userId,
            merchantName: result.product.seller?.name || result.product.seller?.username || '平台自营'
          }
        }
      } catch (error) {
        console.error('[Buy.vue] 加载产品失败:', error)
        console.error('[Buy.vue] 错误详情:', error.message, error.code)
        alert('加载产品信息失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    increaseQuantity() {
      if (this.quantity < this.product.stock) {
        this.quantity++;
      }
    },
    async submitBuy() {
      if (this.loading) return
      if (!this.buyer.name || !this.buyer.phone || !this.buyer.address) {
        alert('请填写完整的收货信息')
        return
      }
      if (this.quantity > this.product.stock) {
        alert('购买数量超过库存')
        return
      }
      this.loading = true
      try {
        const result = await this.orderStore.addShoppingOrder({
          productId: this.product.id,
          productName: this.product.name,
          quantity: this.quantity,
          totalPrice: this.quantity * this.product.price,
          buyerName: this.userStore.userInfo.username,
          merchantName: this.product.merchantName,
          sellerId: this.product.sellerId,
          status: '已支付',
          paymentStatus: '已支付',
          returnStatus: '无退货'
        })
        if (result.success) {
          alert('订单提交成功！我们会尽快为您发货。')
          this.$router.push('/user')
        } else {
          alert('订单提交失败：' + (result.error || '未知错误'))
        }
      } catch (error) {
        console.error('Failed to submit order:', error)
        alert('订单提交失败：' + error.message)
      } finally {
        this.loading = false
      }
    }
  },
  beforeUnmount() {
    this.loading = false
  }
}
</script>

<style scoped>
.buy-container {
  padding: 20px;
}

.buy-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-image {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 10px;
}

.product-image img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
}

.product-info h2 {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.info-item {
  display: flex;
  gap: 15px;
}

.info-label {
  font-weight: 500;
  color: #333;
  width: 80px;
}

.info-value {
  color: #666;
  flex: 1;
}

.info-value.price {
  font-size: 20px;
  font-weight: bold;
  color: #F44336;
}

.buy-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.buy-form h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 10px 0;
  color: #333;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-group input.readonly {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.quantity-control button {
  width: 40px;
  height: 40px;
  border: none;
  background-color: #f5f5f5;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.quantity-control button:hover {
  background-color: #e0e0e0;
}

.quantity-control button:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
  color: #999;
}

.quantity-control input {
  width: 60px;
  height: 40px;
  border: none;
  text-align: center;
  font-size: 14px;
  outline: none;
}

@media (max-width: 768px) {
  .buy-content {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .product-info h2 {
    font-size: 18px;
  }
}
</style>