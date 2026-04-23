<template>
  <div class="contact-container">
    <h1>联系我们</h1>
    <div class="contact-content">
      <div class="contact-info">
        <h2>联系方式</h2>
        <div class="info-item">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div class="info-content">
            <h3>电话</h3>
            <p>13783766231</p>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <div class="info-content">
            <h3>邮箱</h3>
            <p>3368320196@qq.com</p>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div class="info-content">
            <h3>地址</h3>
            <p>河南省商丘市梁园区</p>
          </div>
        </div>
      </div>
      <div class="contact-form">
        <h2>留言咨询</h2>
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label>姓名</label>
            <input type="text" v-model="form.name" required>
          </div>
          <div class="form-group">
            <label>电话</label>
            <input type="tel" v-model="form.phone" required>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="form.email" required>
          </div>
          <div class="form-group">
            <label>留言内容</label>
            <textarea v-model="form.message" rows="5" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">提交留言</button>
        </form>
        <div v-if="showSuccess" class="success-message">
          提交成功！我们会尽快与您联系。
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Contact',
  data() {
    return {
      form: {
        name: '',
        phone: '',
        email: '',
        message: ''
      },
      showSuccess: false
    }
  },
  methods: {
    submitForm() {
      // 模拟表单提交
      setTimeout(() => {
        this.showSuccess = true
        // 重置表单
        this.form = {
          name: '',
          phone: '',
          email: '',
          message: ''
        }
        // 3秒后隐藏成功消息
        setTimeout(() => {
          this.showSuccess = false
        }, 3000)
      }, 500)
    }
  }
}
</script>

<style scoped>
.contact-container {
  padding: 20px;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 30px;
}

.contact-info {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.contact-info h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
}

.info-icon {
  background-color: rgba(76, 175, 80, 0.1);
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
}

.info-content h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 5px 0;
  color: #333;
}

.info-content p {
  margin: 0;
  color: #666;
}

.contact-form {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  position: relative;
}

.contact-form h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.success-message {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .contact-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .contact-info,
  .contact-form {
    padding: 20px;
  }
}
</style>