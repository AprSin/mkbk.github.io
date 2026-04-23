<template>
  <div class="guide-container">
    <h1>交易指南</h1>
    <div class="guide-content">
      <div class="guide-sidebar">
        <ul>
          <li @click="activeTab = 'process'" :class="{ active: activeTab === 'process' }">交易流程</li>
          <li @click="activeTab = 'policy'" :class="{ active: activeTab === 'policy' }">政策法规</li>
          <li @click="activeTab = 'faq'" :class="{ active: activeTab === 'faq' }">常见问题</li>
        </ul>
      </div>
      <div class="guide-main">
        <div v-if="activeTab === 'process'">
          <h2>交易流程</h2>
          <div class="process-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>注册登录</h3>
                <p>在平台注册账号并登录</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>发布或浏览项目</h3>
                <p>发布农村产权交易项目或浏览现有项目</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>申请交易</h3>
                <p>对感兴趣的项目提交交易申请</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>审核确认</h3>
                <p>平台审核交易申请，确认交易资格</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">5</div>
              <div class="step-content">
                <h3>签订合同</h3>
                <p>交易双方签订交易合同</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">6</div>
              <div class="step-content">
                <h3>完成交易</h3>
                <p>按照合同约定完成交易</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'policy'">
          <h2>政策法规</h2>
          <div class="policy-list">
            <div class="policy-item">
              <h3>中华人民共和国农村土地承包法</h3>
              <p>为稳定和完善以家庭承包经营为基础、统分结合的双层经营体制，赋予农民长期而有保障的土地使用权，维护农村土地承包当事人的合法权益，促进农业、农村经济发展和农村社会稳定，根据宪法，制定本法。</p>
              <button class="btn btn-secondary" @click="viewPolicyDetail('land-contract')">查看详情</button>
            </div>
            <div class="policy-item">
              <h3>中华人民共和国物权法</h3>
              <p>为了维护国家基本经济制度，维护社会主义市场经济秩序，明确物的归属，发挥物的效用，保护权利人的物权，根据宪法，制定本法。</p>
              <button class="btn btn-secondary" @click="viewPolicyDetail('property-law')">查看详情</button>
            </div>
            <div class="policy-item">
              <h3>商丘市梁园区农村产权流转交易运营管理办法（试行）</h3>
              <p>为规范农村产权流转交易行为，维护交易秩序，保障交易双方合法权益，促进农村产权流转交易市场健康发展，结合我区实际，制定本办法。</p>
              <button class="btn btn-secondary" @click="viewPolicyDetail('local-methods')">查看详情</button>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'faq'">
          <h2>常见问题</h2>
          <div class="faq-list">
            <div class="faq-item">
              <h3>1. 农村产权交易的范围包括哪些？</h3>
              <p>农村产权交易的范围包括：农村土地承包经营权、农村集体经营性建设用地使用权、农村集体资产所有权、农村集体资产使用权、农村房屋所有权、农村林权、农村小型水利设施使用权、农村集体养殖水面经营权等。</p>
            </div>
            <div class="faq-item">
              <h3>2. 如何申请农村产权交易？</h3>
              <p>申请人需要在平台注册账号，然后按照平台要求提交交易申请，包括项目信息、交易条件等。平台会对申请进行审核，审核通过后发布交易信息。</p>
            </div>
            <div class="faq-item">
              <h3>3. 农村产权交易的流程是什么？</h3>
              <p>农村产权交易的流程包括：注册登录、发布或浏览项目、申请交易、审核确认、签订合同、完成交易等步骤。</p>
            </div>
            <div class="faq-item">
              <h3>4. 农村产权交易需要哪些材料？</h3>
              <p>农村产权交易需要的材料包括：交易申请书、产权证明、身份证明、评估报告、集体经济组织决议等。具体材料要求会根据交易类型和项目情况有所不同。</p>
            </div>
            <div class="faq-item">
              <h3>5. 农村产权交易的收费标准是什么？</h3>
              <p>农村产权交易的收费标准根据交易类型和交易金额确定，具体收费标准可以在平台查询或咨询平台工作人员。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Guide',
  data() {
    return {
      activeTab: 'process'
    }
  },
  methods: {
    viewPolicyDetail(policyId) {
      this.$router.push(`/policy/detail/${policyId}`)
    }
  }
}
</script>

<style scoped>
.guide-container {
  padding: 20px;
}

.guide-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
  margin-top: 30px;
}

.guide-sidebar {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.guide-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-sidebar li {
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.guide-sidebar li:hover {
  background-color: #f5f5f5;
  color: #4CAF50;
}

.guide-sidebar li.active {
  background-color: #4CAF50;
  color: white;
}

.guide-main {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.guide-main h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 5px 0;
  color: #333;
}

.step-content p {
  margin: 0;
  color: #666;
}

.policy-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.policy-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.policy-item h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 10px 0;
  color: #333;
}

.policy-item p {
  margin: 0 0 15px 0;
  color: #666;
  line-height: 1.5;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.faq-item h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 10px 0;
  color: #333;
}

.faq-item p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .guide-content {
    grid-template-columns: 1fr;
  }

  .guide-sidebar {
    order: 2;
  }

  .guide-main {
    order: 1;
  }

  .guide-sidebar ul {
    display: flex;
    overflow-x: auto;
    gap: 10px;
  }

  .guide-sidebar li {
    white-space: nowrap;
    margin-bottom: 0;
  }
}
</style>