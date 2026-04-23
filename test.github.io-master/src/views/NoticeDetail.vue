<template>
  <div class="notice-detail-container">
    <h1>通知详情</h1>
    <div class="notice-detail">
      <div class="notice-header">
        <h2>{{ notice.title }}</h2>
        <div class="notice-meta">
          <span class="meta-item">发布日期: {{ notice.date }}</span>
          <span class="meta-item">发布单位: {{ notice.organization }}</span>
        </div>
      </div>
      <div class="notice-content">
        <p>{{ notice.content }}</p>
        <div v-if="notice.attachments && notice.attachments.length > 0" class="notice-attachments">
          <h3>相关附件</h3>
          <div class="attachment-list">
            <div v-for="(attachment, index) in notice.attachments" :key="index" class="attachment-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>
              <span>{{ attachment.name }}</span>
              <button class="btn btn-secondary" @click="handleDownload(attachment)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                下载
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="notice-actions">
        <button class="btn btn-secondary" @click="shareNotice">分享通知</button>
        <button class="btn btn-secondary" @click="printNotice">打印通知</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../store/modules/user'

export default {
  name: 'NoticeDetail',
  setup() {
    const userStore = useUserStore()
    return { userStore }
  },
  data() {
    return {
      pendingDownload: null,
      notice: {
        id: '1',
        title: '商丘市梁园区人民政府 关于印发《商丘市梁园区农村产权交易市场体系建设方案》《商丘市梁园区农村产权流转交易运营管理办法（试行）》的通知',
        content: '为规范农村产权交易行为，保障交易双方合法权益，促进农村产权流转交易市场健康发展，特制定本方案和管理办法。\n\n一、指导思想\n以习近平新时代中国特色社会主义思想为指导，全面贯彻党的二十大精神，坚持农业农村优先发展，深化农村改革，健全农村产权交易市场体系，促进农村资源要素有序流动，为乡村振兴提供有力支撑。\n\n二、工作目标\n到2025年，建立健全覆盖全区的农村产权交易市场体系，实现农村产权交易规范化、制度化、信息化，提高农村资源配置效率，促进农村集体经济发展。\n\n三、主要任务\n1. 建立健全农村产权交易市场体系\n2. 规范农村产权交易行为\n3. 加强农村产权交易平台建设\n4. 强化农村产权交易监督管理\n\n四、保障措施\n1. 加强组织领导\n2. 加大政策支持\n3. 强化宣传培训\n4. 严格监督考核\n\n本方案和管理办法自发布之日起施行。',
        date: '2024-06-01',
        organization: '商丘市梁园区人民政府',
        attachments: [
          {
            name: '商丘市梁园区农村产权交易市场体系建设方案.pdf',
            url: '#'
          },
          {
            name: '商丘市梁园区农村产权流转交易运营管理办法（试行）.pdf',
            url: '#'
          }
        ]
      }
    }
  },
  watch: {
    'userStore.isLoggedIn': {
      handler(newVal) {
        if (newVal && this.pendingDownload) {
          this.executeDownload(this.pendingDownload)
          this.pendingDownload = null
        }
      }
    }
  },
  methods: {
    handleDownload(attachment) {
      if (!this.userStore.isLoggedIn) {
        this.pendingDownload = attachment
        this.$root.showLoginDialog = true
        return
      }
      this.executeDownload(attachment)
    },
    executeDownload(attachment) {
      alert(`开始下载: ${attachment.name}`)
      setTimeout(() => {
        alert(`下载成功！${attachment.name} 已保存到您的设备。`)
      }, 1000)
    },
    shareNotice() {
      alert('通知链接已复制到剪贴板！');
    },
    printNotice() {
      window.print();
    }
  }
}
</script>

<style scoped>
.notice-detail-container {
  padding: 20px;
}

.notice-detail {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.notice-header {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.notice-header h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 15px 0;
  color: #333;
}

.notice-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 14px;
  color: #999;
}

.notice-content {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.notice-content p {
  margin: 0 0 20px 0;
  color: #333;
  line-height: 1.6;
  white-space: pre-line;
}

.notice-attachments {
  margin-top: 30px;
}

.notice-attachments h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 15px 0;
  color: #333;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.attachment-item svg {
  flex-shrink: 0;
}

.attachment-item span {
  flex: 1;
  color: #333;
}

.notice-actions {
  padding: 20px 30px;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .notice-header {
    padding: 20px;
  }

  .notice-header h2 {
    font-size: 20px;
  }

  .notice-content {
    padding: 20px;
  }

  .notice-actions {
    flex-direction: column;
    padding: 20px;
  }

  .notice-actions button {
    width: 100%;
  }
}
</style>