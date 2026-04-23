<template>
  <div class="user-container">
    <!-- 消息提示组件 -->
    <transition name="fade">
      <div v-if="showToast" class="toast-message" :class="'toast-' + toastType">
        {{ toastMessage }}
      </div>
    </transition>
    <h1>个人中心</h1>
    <div class="user-content">
      <div class="user-sidebar">
        <div class="user-info">
          <div class="avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <h2>{{ userStore.isAdmin ? '管理员中心' : (userStore.isMerchant ? '商户中心' : '买家中心') }}</h2>
          <p>{{ userStore.isAdmin ? '管理员账号' : (userStore.isMerchant ? '商户账号' : '买家账号') }}</p>
          <p class="user-detail">{{ userStore.userInfo.name || userStore.userInfo.username }}</p>
        </div>
        <ul class="user-menu">
          <li @click="activeTab = 'profile'" :class="{ active: activeTab === 'profile' }">个人信息</li>
          <li v-if="userStore.isMerchant" @click="activeTab = 'projects'" :class="{ active: activeTab === 'projects' }">我的项目</li>
          <li v-if="userStore.isMerchant" @click="activeTab = 'products'" :class="{ active: activeTab === 'products' }">我的农产品</li>
          <li @click="activeTab = 'shoppingOrders'" :class="{ active: activeTab === 'shoppingOrders' }">
            {{ userStore.isMerchant ? '购物订单管理' : '我的购物订单' }}
          </li>
          <li @click="activeTab = 'bidOrders'" :class="{ active: activeTab === 'bidOrders' }">
            {{ userStore.isMerchant ? '投标订单管理' : '我的投标订单' }}
          </li>
          <li @click="activeTab = 'settings'" :class="{ active: activeTab === 'settings' }">账号设置</li>
          <li @click="switchToMessages" :class="{ active: activeTab === 'messages' }">
            我的消息 <span v-if="unreadMessageCount > 0" class="badge">{{ unreadMessageCount }}</span>
          </li>
        </ul>
      </div>
      <div class="user-main">
        <!-- 个人信息 -->
        <div v-if="activeTab === 'profile'">
          <h2>个人信息</h2>
          <form class="profile-form" @submit.prevent="handleProfileSubmit">
            <div class="form-group">
              <label>姓名 <span class="required">*</span></label>
              <input type="text" v-model="userInfo.name" placeholder="请输入姓名" required>
            </div>
            <div class="form-group">
              <label>真实姓名 <span class="required">*</span></label>
              <input type="text" v-model="userInfo.realName" placeholder="请输入真实姓名" required>
            </div>
            <div class="form-group">
              <label>身份证号 <span class="required">*</span></label>
              <input type="text" v-model="userInfo.idCard" placeholder="请输入身份证号" required pattern="^\d{17}[\dXx]$" title="请输入有效的18位身份证号码">
            </div>
            <div class="form-group">
              <label>电话 <span class="required">*</span></label>
              <input type="tel" v-model="userInfo.phone" placeholder="请输入电话" required pattern="^1[3-9]\d{9}$" title="请输入有效的11位手机号码">
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input type="email" v-model="userInfo.email" placeholder="请输入邮箱" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" title="请输入有效的邮箱地址">
            </div>
            <div class="form-group">
              <label>地址</label>
              <input type="text" v-model="userInfo.address" placeholder="请输入地址">
            </div>
            <template v-if="userStore.isMerchant">
              <div class="form-divider">
                <span>商户信息</span>
              </div>
              <div class="form-group">
                <label>营业执照编号 <span class="required">*</span></label>
                <input type="text" v-model="userInfo.businessLicense" placeholder="请输入营业执照编号" required>
              </div>
              <div class="form-group">
                <label>经营范围 <span class="required">*</span></label>
                <textarea v-model="userInfo.businessScope" placeholder="请输入经营范围" required></textarea>
              </div>
              <div class="form-group">
                <label>企业联系电话 <span class="required">*</span></label>
                <input type="tel" v-model="userInfo.companyPhone" placeholder="请输入企业联系电话" required pattern="^[\d\-\(\)\s]+$" title="请输入有效的电话号码">
              </div>
              <div class="form-group">
                <label>企业地址 <span class="required">*</span></label>
                <input type="text" v-model="userInfo.companyAddress" placeholder="请输入企业地址" required>
              </div>
            </template>
            <div class="form-notice">
              <p class="notice-text">
                <span class="notice-icon">ℹ️</span>
                修改个人信息需要管理员审核，提交后请耐心等待审核结果
              </p>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="savingProfile">
              {{ savingProfile ? '提交中...' : '提交修改申请' }}
            </button>
          </form>

          <!-- 我的修改申请记录 -->
          <div class="update-requests-section" v-if="userUpdateRequests.length > 0">
            <h3>我的修改申请记录</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>申请时间</th>
                  <th>修改字段</th>
                  <th>状态</th>
                  <th>审核备注</th>
                  <th>审核时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in userUpdateRequests" :key="request.id">
                  <td>{{ formatDate(request.createdAt) }}</td>
                  <td>{{ getChangedFieldsText(request.changedFields) }}</td>
                  <td>
                    <span :class="'status-badge status-' + request.status">
                      {{ request.status === 'pending' ? '待审核' : request.status === 'approved' ? '已通过' : '已驳回' }}
                    </span>
                  </td>
                  <td>{{ request.reviewComment || '-' }}</td>
                  <td>{{ request.reviewedAt ? formatDate(request.reviewedAt) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 商户 - 我的项目 -->
        <div v-if="activeTab === 'projects' && userStore.isMerchant">
          <h2>我的项目</h2>
          <button class="btn btn-primary" @click="showProjectPublish = true" style="margin-bottom: 20px;">
            发布新项目
          </button>
          <div class="project-list">
            <div class="project-item" v-for="project in paginatedMerchantProjects" :key="project.id">
              <div class="project-header">
                <h3>{{ project.name }}</h3>
                <span class="status-tag" :class="'status-' + project.status">{{ project.status }}</span>
              </div>
              <p class="project-merchant">发布商户: {{ project.merchantName }}</p>
              <p>项目编号: {{ project.id }}</p>
              <p>发布日期: {{ project.publishDate }}</p>
              <p>价格: ¥{{ project.price.toLocaleString() }}</p>
              <div class="project-actions">
                <button class="btn btn-secondary" @click="viewProjectDetail(project.id)">查看详情</button>
                <button class="btn btn-primary" @click="manageProject(project)">管理</button>
              </div>
            </div>
            <Pagination
              v-if="merchantProjects.length > 0"
              :current-page="pagination.projects.page"
              :page-size="pagination.projects.pageSize"
              :total="pagination.projects.total"
              @page-change="handleProjectPageChange"
            />
          </div>
        </div>

        <!-- 商户 - 我的农产品 -->
        <div v-if="activeTab === 'products' && userStore.isMerchant">
          <h2>我的农产品</h2>
          <button class="btn btn-primary" @click="showProductPublish = true" style="margin-bottom: 20px;">
            发布新农产品
          </button>
          <div class="product-list">
            <div class="product-item" v-for="product in paginatedMerchantProducts" :key="product.id">
              <div class="product-header">
                <h3>{{ product.name }}</h3>
                <span class="status-tag" :class="'status-' + product.status">{{ product.status }}</span>
              </div>
              <p class="product-merchant">发布商户: {{ product.merchantName }}</p>
              <p>价格: ¥{{ product.price }}/斤</p>
              <p>库存: {{ product.stock }}斤</p>
              <p>产地: {{ product.origin }}</p>
              <div class="product-actions">
                <button class="btn btn-secondary" @click="viewProductDetail(product.id)">查看详情</button>
                <button class="btn btn-primary" @click="manageProduct(product)">管理</button>
              </div>
            </div>
            <Pagination
              v-if="merchantProducts.length > 0"
              :current-page="pagination.products.page"
              :page-size="pagination.products.pageSize"
              :total="pagination.products.total"
              @page-change="handleProductPageChange"
            />
          </div>

          <!-- 我的农产品修改申请记录 -->
          <div class="update-requests-section" v-if="productUpdateRequests.length > 0">
            <h3>我的农产品修改申请记录</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>申请时间</th>
                  <th>产品名称</th>
                  <th>修改字段</th>
                  <th>状态</th>
                  <th>审核备注</th>
                  <th>审核时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in productUpdateRequests" :key="request.id">
                  <td>{{ formatDate(request.createdAt) }}</td>
                  <td>{{ request.product?.name || '-' }}</td>
                  <td>{{ getProductChangedFieldsText(request.changedFields) }}</td>
                  <td>
                    <span :class="'status-badge status-' + request.status">
                      {{ request.status === 'pending' ? '待审核' : request.status === 'approved' ? '已通过' : '已驳回' }}
                    </span>
                  </td>
                  <td>{{ request.reviewComment || '-' }}</td>
                  <td>{{ request.reviewedAt ? formatDate(request.reviewedAt) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 购物订单 -->
        <div v-if="activeTab === 'shoppingOrders'">
          <h2>{{ userStore.isMerchant ? '购物订单管理' : '我的购物订单' }}</h2>
          <div class="order-list">
            <div v-if="displayShoppingOrders.length === 0" class="empty-order">
              暂无订单
            </div>
            <div class="order-item" v-for="order in paginatedShoppingOrders" :key="order.id">
              <div class="order-header">
                <h3>订单编号: {{ order.id }}</h3>
                <span class="status-tag" :class="'status-' + order.status">{{ order.status }}</span>
              </div>
              <p>商品: {{ order.productName }}</p>
              <p>数量: {{ order.quantity }}斤</p>
              <p>总价: ¥{{ order.totalPrice.toFixed(2) }}</p>
              <p class="order-party">买家: {{ order.buyerName }}</p>
              <p class="order-party">卖家: {{ order.merchantName || '平台自营' }}</p>
              <p>下单日期: {{ order.orderDate }}</p>
              <div v-if="showLogistics(order.status)" class="order-logistics">
                <p>物流公司: {{ order.logisticsCompany || '未填写' }}</p>
                <p>运单号: {{ order.trackingNumber || '未填写' }}</p>
              </div>
              <div v-if="order.returnReason" class="order-return">
                <p class="return-reason">退货原因: {{ order.returnReason }}</p>
                <p v-if="order.returnQuantity">退货数量: {{ order.returnQuantity }}斤</p>
              </div>
              <div class="order-actions">
                <button class="btn btn-secondary" @click="viewOrderDetail(order.serverId || order.id)">查看详情</button>
                <template v-if="userStore.isBuyer">
                  <button v-if="order.status === '待收货'" class="btn btn-success" @click="confirmReceiptFromList(order)">确认收货</button>
                  <button v-else-if="canRequestReturn(order)" class="btn btn-warning" @click="showReturnDialog(order)">申请退货</button>
                </template>
                <template v-else-if="userStore.isMerchant">
                  <button v-if="order.returnStatus === '申请中' && isOrderMerchant(order)" class="btn btn-primary" @click="handleReturnRequest(order)">审批退货</button>
                  <button v-if="(order.status === '已支付' || order.status === '待发货') && isOrderMerchant(order)" class="btn btn-primary" @click="manageOrder(order)">发货</button>
                  <button v-if="order.status === '待收货' && isOrderMerchant(order)" class="btn btn-secondary" @click="manageOrder(order)">查看物流</button>
                </template>
              </div>
            </div>
            <Pagination
              v-if="displayShoppingOrders.length > 0"
              :current-page="pagination.orders.page"
              :page-size="pagination.orders.pageSize"
              :total="pagination.orders.total"
              @page-change="handleOrderPageChange"
            />
          </div>
        </div>

        <!-- 投标订单 -->
        <div v-if="activeTab === 'bidOrders'">
          <h2>{{ userStore.isMerchant ? '投标订单管理' : '我的投标订单' }}</h2>
          <div v-if="userStore.isBuyer" class="order-list">
            <!-- 使用分页加载的投标订单 -->
            <div v-if="orderStore.bidPagination.loading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>
            <div v-else-if="displayBidOrders.length === 0" class="empty-order">
              <div class="empty-icon">📋</div>
              <p>暂无投标记录</p>
            </div>
            <template v-else>
              <div class="order-item" v-for="order in displayBidOrders" :key="order.id">
                <div class="order-header">
                  <h3>项目: {{ order.projectName }}</h3>
                  <span class="status-tag" :class="'status-' + order.status">{{ order.statusText }}</span>
                </div>
                <p class="order-party">发布商户: {{ order.merchantName }}</p>
                <p>投标金额: ¥{{ order.amount.toLocaleString() }}</p>
                <p>联系人: {{ order.contact }}</p>
                <p>联系电话: {{ order.phone }}</p>
                <p>投标时间: {{ order.bidDate }}</p>
                <div v-if="order.rejectReason" class="order-reject-reason">
                  <p>拒绝原因: {{ order.rejectReason }}</p>
                </div>
                <div class="order-actions">
                  <button class="btn btn-secondary" @click="viewBidDetail(order.id)">查看详情</button>
                </div>
              </div>
              <PaginationPro
                :current-page="orderStore.bidPagination.page"
                :page-size="orderStore.bidPagination.size"
                :total="orderStore.bidPagination.total"
                :loading="orderStore.bidPagination.loading"
                :page-size-options="[5, 10, 20, 50]"
                @page-change="handleBidPageChange"
                @size-change="handleBidSizeChange"
              />
            </template>
          </div>
          <div v-else class="bid-order-list">
            <!-- 加载状态 -->
            <div v-if="orderStore.bidPagination.loading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>
            <!-- 无数据状态 -->
            <div v-else-if="displayMerchantBidProjects.length === 0" class="empty-order">
              <div class="empty-icon">📋</div>
              <p>暂无投标记录</p>
            </div>
            <template v-else>
              <div class="bid-project-item" v-for="project in displayMerchantBidProjects" :key="project.projectId">
                <div class="bid-project-header">
                  <h3>{{ project.projectName }}</h3>
                  <span class="bid-count">投标人数: {{ project.orders.length }}</span>
                </div>
                <div class="bid-table">
                  <table>
                    <thead>
                      <tr>
                        <th>投标金额</th>
                        <th>买家</th>
                        <th>联系人</th>
                        <th>联系电话</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="bid in project.orders" :key="bid.id" :class="{'accepted-bid': bid.status === 'accepted'}">
                        <td>¥{{ bid.amount.toLocaleString() }}</td>
                        <td>{{ bid.buyerName }}</td>
                        <td>{{ bid.contact }}</td>
                        <td>{{ bid.phone }}</td>
                        <td>
                          <span v-if="bid.status === '已接受'" class="status-tag status-accepted">已接受</span>
                          <span v-else-if="bid.status === '已拒绝'" class="status-tag status-rejected">已拒绝</span>
                          <span v-else class="status-tag status-pending">待处理</span>
                        </td>
                        <td class="bid-actions">
                          <template v-if="bid.status === '待处理'">
                            <button 
                              class="btn btn-bid-action btn-success" 
                              @click="acceptBid(project.projectId, bid.id)"
                              :disabled="bid.processing"
                            >
                              <span v-if="bid.processing && bid.processingType === 'accept'">
                                <i class="loading-icon"></i>处理中...
                              </span>
                              <span v-else>接受</span>
                            </button>
                            <button 
                              class="btn btn-bid-action btn-danger" 
                              @click="showRejectDialog(project.projectId, bid.id)"
                              :disabled="bid.processing"
                            >
                              <span v-if="bid.processing && bid.processingType === 'reject'">
                                <i class="loading-icon"></i>处理中...
                              </span>
                              <span v-else>拒绝</span>
                            </button>
                          </template>
                          <span v-else class="bid-status-text">{{ bid.status }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <!-- 分页组件 -->
              <PaginationPro
                :current-page="orderStore.bidPagination.page"
                :page-size="orderStore.bidPagination.size"
                :total="orderStore.bidPagination.total"
                :loading="orderStore.bidPagination.loading"
                :page-size-options="[5, 10, 20, 50]"
                @page-change="handleBidPageChange"
                @size-change="handleBidSizeChange"
              />
            </template>
          </div>
        </div>

        <!-- 账号设置 -->
        <div v-if="activeTab === 'settings'">
          <h2>账号设置</h2>
          <form class="settings-form">
            <div class="form-group">
              <label>用户名</label>
              <input type="text" v-model="settings.username" placeholder="请输入用户名">
            </div>
            <div class="form-group">
              <label>密码</label>
              <input type="password" v-model="settings.password" placeholder="请输入密码">
            </div>
            <div class="form-group">
              <label>确认密码</label>
              <input type="password" v-model="settings.confirmPassword" placeholder="请确认密码">
            </div>
            <button type="submit" class="btn btn-primary">保存修改</button>
          </form>
        </div>

        <!-- 我的消息 -->
        <div v-if="activeTab === 'messages'">
          <h2>我的消息</h2>
          <div class="messages-toolbar">
            <button class="btn btn-secondary" @click="markAllMessagesRead" :disabled="unreadMessageCount === 0">
              全部标为已读
            </button>
          </div>
          <div v-if="messages.length === 0" class="empty-state">
            暂无消息
          </div>
          <div v-else class="messages-list">
            <div v-for="msg in messages" :key="msg.id"
              :class="['message-item', { unread: !msg.isRead }]"
              @click="viewMessage(msg)">
              <div class="message-header">
                <span class="message-title">{{ msg.title }}</span>
                <span class="message-time">{{ formatDate(msg.createdAt) }}</span>
              </div>
              <div class="message-content">{{ msg.content.substring(0, 50) }}{{ msg.content.length > 50 ? '...' : '' }}</div>
              <span v-if="!msg.isRead" class="unread-badge">未读</span>
            </div>
          </div>
        </div>

        <!-- 消息详情弹窗 -->
        <div v-if="showMessageDetail" class="modal-overlay" @click="closeMessageDetail">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>{{ currentMessage?.title }}</h3>
              <button class="modal-close" @click="closeMessageDetail">×</button>
            </div>
            <div class="modal-body">
              <p class="message-meta">发件人：{{ currentMessage?.senderName || '系统' }}</p>
              <p class="message-meta">时间：{{ formatDate(currentMessage?.createdAt) }}</p>
              <div class="message-body">{{ currentMessage?.content }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeMessageDetail">关闭</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目管理弹窗 -->
    <div v-if="showProjectManage" class="modal-overlay" @click="showProjectManage = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>项目管理</h3>
          <button class="modal-close" @click="showProjectManage = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group form-group-half">
              <label>项目名称 <span class="required">*</span></label>
              <input type="text" v-model="projectForm.name" placeholder="请输入项目名称" required>
            </div>
            <div class="form-group form-group-half">
              <label>项目类型</label>
              <select v-model="projectForm.type">
                <option value="">请选择类型</option>
                <option value="宅基地">宅基地</option>
                <option value="厂房">厂房</option>
                <option value="土地">土地</option>
                <option value="林地">林地</option>
                <option value="商铺">商铺</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label>价格 (元)</label>
              <input type="number" v-model="projectForm.price" placeholder="请输入价格" min="0">
            </div>
            <div class="form-group form-group-half">
              <label>面积</label>
              <input type="text" v-model="projectForm.area" placeholder="如：200平方米">
            </div>
          </div>
          <div class="form-group">
            <label>位置</label>
            <input type="text" v-model="projectForm.location" placeholder="请输入项目位置">
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label>联系人</label>
              <input type="text" v-model="projectForm.contactPerson" placeholder="请输入联系人">
            </div>
            <div class="form-group form-group-half">
              <label>联系方式</label>
              <input type="text" v-model="projectForm.contactInfo" placeholder="请输入联系方式">
            </div>
          </div>
          <div class="form-group">
            <label>投标截止日期</label>
            <input type="date" v-model="projectForm.bidEndDate">
          </div>
          <div class="form-group">
            <label>项目描述</label>
            <textarea v-model="projectForm.description" placeholder="请输入项目描述" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>项目状态</label>
            <select v-model="projectForm.status">
              <option value="交易中">交易中</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
            </select>
          </div>
          <div class="form-notice" v-if="currentProject && currentProject.id">
            <p class="notice-text">
              <span class="notice-icon">ℹ️</span>
              修改项目信息需要管理员审核，提交后请耐心等待审核结果
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProjectManage = false">取消</button>
          <button class="btn btn-primary" @click="saveProject">
            {{ currentProject && currentProject.id ? '提交修改申请' : '保存' }}
          </button>
          <button class="btn btn-danger" @click="deleteProject" v-if="currentProject && currentProject.id">删除</button>
        </div>
      </div>
    </div>

    <!-- 农产品管理弹窗 -->
    <div v-if="showProductManage" class="modal-overlay" @click="showProductManage = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>农产品管理</h3>
          <button class="modal-close" @click="showProductManage = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group form-group-half">
              <label>农产品名称 <span class="required">*</span></label>
              <input type="text" v-model="productForm.name" placeholder="请输入农产品名称" required>
            </div>
            <div class="form-group form-group-half">
              <label>分类</label>
              <select v-model="productForm.category">
                <option value="">请选择分类</option>
                <option value="蔬菜">蔬菜</option>
                <option value="水果">水果</option>
                <option value="粮食">粮食</option>
                <option value="禽蛋">禽蛋</option>
                <option value="水产">水产</option>
                <option value="干货">干货</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label>价格 (元/斤) <span class="required">*</span></label>
              <input type="number" v-model="productForm.price" placeholder="请输入价格" min="0" step="0.01" required>
            </div>
            <div class="form-group form-group-half">
              <label>库存 (斤) <span class="required">*</span></label>
              <input type="number" v-model="productForm.stock" placeholder="请输入库存" min="0" required>
            </div>
          </div>
          <div class="form-group">
            <label>产地</label>
            <input type="text" v-model="productForm.origin" placeholder="请输入产地">
          </div>
          <div class="form-group">
            <label>产品描述</label>
            <textarea v-model="productForm.description" placeholder="请输入产品描述" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>产品图片</label>
            <div class="image-upload">
              <input type="text" v-model="productForm.image" placeholder="请输入图片URL">
              <div v-if="productForm.image" class="image-preview">
                <img :src="productForm.image" alt="产品图片" style="max-width: 200px; max-height: 150px;">
              </div>
            </div>
            <div class="form-group" style="margin-top: 10px;">
              <label>上传PNG图片</label>
              <input type="file" accept=".png,image/png" @change="handleImageFileUpload" ref="imageFileInput">
              <div v-if="imageUploadProgress > 0 && imageUploadProgress < 100" class="upload-progress">
                上传中: {{ imageUploadProgress }}%
              </div>
              <div v-if="imageUploadError" class="upload-error">{{ imageUploadError }}</div>
            </div>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="productForm.status">
              <option value="在售">在售</option>
              <option value="已售罄">已售罄</option>
              <option value="下架">下架</option>
            </select>
          </div>
          <div class="form-notice" v-if="productForm.id">
            <p class="notice-text">
              <span class="notice-icon">ℹ️</span>
              修改农产品信息需要管理员审核，提交后请耐心等待审核结果
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProductManage = false">取消</button>
          <button class="btn btn-primary" @click="saveProduct">
            {{ productForm.id ? '提交修改申请' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 订单管理弹窗 -->
    <div v-if="showOrderManage" class="modal-overlay" @click="showOrderManage = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ userStore.isBuyer ? (['申请中', '已批准'].includes(currentOrder?.returnStatus) ? '退货进度' : '申请退货') : (currentOrder?.status === '已支付' || currentOrder?.status === '待发货' ? '填写物流信息' : '查看物流') }}</h3>
          <button class="modal-close" @click="showOrderManage = false">×</button>
        </div>
        <div class="modal-body">
          <!-- 买家退货申请/查看 -->
          <div v-if="userStore.isBuyer">
            <!-- 订单信息摘要 -->
            <div class="order-info-summary">
              <p><strong>订单编号：</strong>{{ currentOrder?.id }}</p>
              <p><strong>商品：</strong>{{ currentOrder?.productName }} × {{ currentOrder?.quantity }}斤</p>
              <p><strong>总价：</strong>¥{{ currentOrder?.totalPrice?.toFixed(2) }}</p>
              <p><strong>订单状态：</strong><span class="status-tag" :class="'status-' + currentOrder?.status">{{ currentOrder?.status }}</span></p>
            </div>

            <!-- 退货进度显示（申请中或已批准时显示，已拒绝时不显示） -->
            <div v-if="['申请中', '已批准'].includes(currentOrder?.returnStatus)" class="return-progress">
              <h4>退货进度</h4>
              <div class="progress-steps">
                <div class="step" :class="{ active: currentOrder?.returnStatus === '申请中', completed: ['已批准', '已拒绝'].includes(currentOrder?.returnStatus) }">
                  <div class="step-icon">1</div>
                  <div class="step-text">
                    <div class="step-title">提交申请</div>
                    <div class="step-time">{{ formatDate(currentOrder?.updatedAt) }}</div>
                  </div>
                </div>
                <div class="step-line" :class="{ completed: ['已批准', '已拒绝'].includes(currentOrder?.returnStatus) }"></div>
                <div class="step" :class="{ active: currentOrder?.returnStatus === '申请中', completed: ['已批准', '已拒绝'].includes(currentOrder?.returnStatus) }">
                  <div class="step-icon">2</div>
                  <div class="step-text">
                    <div class="step-title">商家审核</div>
                    <div class="step-status" :class="currentOrder?.returnStatus">{{ currentOrder?.returnStatus === '申请中' ? '审核中...' : currentOrder?.returnStatus }}</div>
                  </div>
                </div>
                <div class="step-line" :class="{ completed: ['已批准', '已拒绝'].includes(currentOrder?.returnStatus) }"></div>
                <div class="step" :class="{ completed: currentOrder?.returnStatus === '已批准', rejected: currentOrder?.returnStatus === '已拒绝' }">
                  <div class="step-icon">3</div>
                  <div class="step-text">
                    <div class="step-title">{{ currentOrder?.returnStatus === '已拒绝' ? '已拒绝' : '退款完成' }}</div>
                    <div class="step-status" v-if="currentOrder?.returnStatus === '已批准'">已退款</div>
                    <div class="step-status rejected" v-if="currentOrder?.returnStatus === '已拒绝'">商家已拒绝</div>
                  </div>
                </div>
              </div>

              <!-- 退货详情 -->
              <div class="return-details">
                <h4>退货详情</h4>
                <div class="detail-row">
                  <span class="detail-label">申请类型：</span>
                  <span class="detail-value">{{ currentOrder?.returnType || '退货退款' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">退货原因：</span>
                  <span class="detail-value">{{ currentOrder?.returnReason }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">退货数量：</span>
                  <span class="detail-value">{{ currentOrder?.returnQuantity }} 斤</span>
                </div>
                <div class="detail-row" v-if="currentOrder?.returnStatus === '已拒绝'">
                  <span class="detail-label">拒绝原因：</span>
                  <span class="detail-value text-danger">{{ currentOrder?.remark }}</span>
                </div>
                <div class="detail-row" v-if="currentOrder?.returnStatus === '已拒绝'">
                  <span class="detail-label">订单状态：</span>
                  <span class="detail-value">已恢复为{{ currentOrder?.status }}</span>
                </div>
              </div>

              <!-- 退货物流填写（商家批准后） -->
              <div v-if="currentOrder?.returnStatus === '已批准' && !currentOrder?.returnShipped" class="return-logistics-form">
                <h4>填写退货物流</h4>
                <div class="form-group">
                  <label>退货物流公司 <span class="required">*</span></label>
                  <select v-model="returnForm.logisticsCompany" required>
                    <option value="">请选择物流公司</option>
                    <option value="顺丰速运">顺丰速运</option>
                    <option value="中通快递">中通快递</option>
                    <option value="圆通速递">圆通速递</option>
                    <option value="韵达快递">韵达快递</option>
                    <option value="申通快递">申通快递</option>
                    <option value="极兔速递">极兔速递</option>
                    <option value="京东物流">京东物流</option>
                    <option value="邮政EMS">邮政EMS</option>
                    <option value="德邦快递">德邦快递</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>退货运单号 <span class="required">*</span></label>
                  <input type="text" v-model="returnForm.logisticsNumber" placeholder="请输入退货运单号" required>
                </div>
              </div>

              <!-- 已填写的退货物流 -->
              <div v-if="currentOrder?.returnShipped" class="return-logistics-info">
                <h4>退货物流信息</h4>
                <div class="detail-row">
                  <span class="detail-label">物流公司：</span>
                  <span class="detail-value">{{ currentOrder?.returnLogisticsCompany }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">运单号：</span>
                  <span class="detail-value">{{ currentOrder?.returnLogisticsNumber }}</span>
                  <button class="btn-copy" @click="copyTrackingNumber(currentOrder?.returnLogisticsNumber)">复制</button>
                </div>
              </div>
            </div>

            <!-- 退货申请表单 -->
            <div v-else class="return-application-form">
              <!-- 显示之前的拒绝记录（如果有） -->
              <div v-if="currentOrder?.returnStatus === '已拒绝'" class="previous-rejection-notice">
                <div class="notice-header">
                  <span class="notice-icon">⚠️</span>
                  <span class="notice-title">之前的退货申请已被拒绝</span>
                </div>
                <div class="notice-content">
                  <p><strong>拒绝原因：</strong>{{ currentOrder?.remark?.replace('退单拒绝原因: ', '') }}</p>
                  <p><strong>拒绝时间：</strong>{{ formatDate(currentOrder?.returnRejectedAt) }}</p>
                  <p class="notice-tip">您可以修改申请信息后重新提交</p>
                </div>
              </div>

              <div class="form-group">
                <label>申请类型 <span class="required">*</span></label>
                <div class="return-type-options">
                  <label class="radio-option" :class="{ active: returnForm.returnType === '退货退款' }">
                    <input type="radio" v-model="returnForm.returnType" value="退货退款" required>
                    <span class="radio-label">
                      <strong>退货退款</strong>
                      <small>退回商品并获得退款</small>
                    </span>
                  </label>
                  <label class="radio-option" :class="{ active: returnForm.returnType === '仅退款' }">
                    <input type="radio" v-model="returnForm.returnType" value="仅退款" required>
                    <span class="radio-label">
                      <strong>仅退款</strong>
                      <small>无需退回商品，直接获得退款</small>
                    </span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>退货原因 <span class="required">*</span></label>
                <select v-model="returnForm.reasonType" @change="handleReasonChange" required>
                  <option value="">请选择退货原因</option>
                  <option value="商品质量问题">商品质量问题</option>
                  <option value="商品与描述不符">商品与描述不符</option>
                  <option value="收到商品破损">收到商品破损</option>
                  <option value="商品过期/变质">商品过期/变质</option>
                  <option value="不喜欢/不想要">不喜欢/不想要</option>
                  <option value="拍错/多拍">拍错/多拍</option>
                  <option value="其他原因">其他原因</option>
                </select>
              </div>
              <div class="form-group" v-if="returnForm.reasonType === '其他原因'">
                <label>详细说明 <span class="required">*</span></label>
                <textarea v-model="returnForm.reasonDetail" placeholder="请详细描述退货原因" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>退货数量 (斤) <span class="required">*</span></label>
                <div class="quantity-selector">
                  <button class="btn-quantity" @click="decreaseReturnQuantity" :disabled="returnForm.quantity <= 1">-</button>
                  <input type="number" v-model.number="returnForm.quantity" :max="currentOrder?.quantity" min="1" required>
                  <button class="btn-quantity" @click="increaseReturnQuantity" :disabled="returnForm.quantity >= currentOrder?.quantity">+</button>
                </div>
                <span class="input-tip">最多可退 {{ currentOrder?.quantity }} 斤</span>
              </div>
              <div class="form-group">
                <label>退款方式 <span class="required">*</span></label>
                <div class="refund-method-options">
                  <label class="radio-option">
                    <input type="radio" v-model="returnForm.refundMethod" value="原路退回" checked>
                    <span class="radio-label">
                      <strong>原路退回</strong>
                      <small>退回至原支付账户，1-3个工作日到账</small>
                    </span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" v-model="returnForm.refundMethod" value="余额退款">
                    <span class="radio-label">
                      <strong>退至余额</strong>
                      <small>退回至平台余额，即时到账</small>
                    </span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>退款金额</label>
                <div class="refund-amount">
                  <span class="amount">¥{{ calculateRefundAmount().toFixed(2) }}</span>
                  <span class="tip">（按退货数量比例计算）</span>
                </div>
              </div>
              <div class="form-group">
                <label>上传凭证（选填）</label>
                <div class="upload-area" @click="triggerReturnImageUpload" @drop.prevent="handleReturnImageDrop" @dragover.prevent>
                  <div v-if="!returnForm.images || returnForm.images.length === 0" class="upload-placeholder">
                    <span class="upload-icon">📷</span>
                    <p>点击或拖拽上传图片</p>
                    <small>支持 JPG、PNG 格式，最多 5 张</small>
                  </div>
                  <div v-else class="upload-preview-list">
                    <div v-for="(img, index) in returnForm.images" :key="index" class="upload-preview-item">
                      <img :src="img" alt="凭证">
                      <button class="btn-remove" @click.stop="removeReturnImage(index)">×</button>
                    </div>
                    <div v-if="returnForm.images.length < 5" class="upload-add" @click.stop="triggerReturnImageUpload">+</div>
                  </div>
                </div>
                <input type="file" ref="returnImageInput" style="display: none" accept="image/*" multiple @change="handleReturnImageChange">
              </div>
            </div>
          </div>
          <div v-else>
            <div class="order-info-summary">
              <p><strong>订单编号：</strong>{{ currentOrder?.id }}</p>
              <p><strong>买家：</strong>{{ currentOrder?.buyerName }}</p>
              <p><strong>商品：</strong>{{ currentOrder?.productName }} × {{ currentOrder?.quantity }}斤</p>
              <p><strong>总价：</strong>¥{{ currentOrder?.totalPrice?.toFixed(2) }}</p>
              <p><strong>订单状态：</strong><span class="status-tag" :class="'status-' + currentOrder?.status">{{ currentOrder?.status }}</span></p>
            </div>

            <!-- 退货申请信息（退单中时显示） -->
            <template v-if="currentOrder?.status === '退单中' && currentOrder?.returnStatus === '申请中'">
              <div class="return-application-info">
                <h4>退货申请信息</h4>
                <div class="info-row">
                  <span class="info-label">申请类型：</span>
                  <span class="info-value">{{ currentOrder?.returnType || '退货退款' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">退货原因：</span>
                  <span class="info-value">{{ currentOrder?.returnReason }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">退货数量：</span>
                  <span class="info-value">{{ currentOrder?.returnQuantity }} 斤</span>
                </div>
                <div class="info-row">
                  <span class="info-label">申请时间：</span>
                  <span class="info-value">{{ formatDate(currentOrder?.returnRequestedAt) }}</span>
                </div>
                <div class="info-row" v-if="currentOrder?.returnImages">
                  <span class="info-label">凭证图片：</span>
                  <div class="image-list">
                    <img v-for="(img, index) in JSON.parse(currentOrder.returnImages)" :key="index" :src="img" class="return-image-thumbnail" @click="viewImage(img)">
                  </div>
                </div>
                <div class="action-buttons">
                  <button class="btn btn-success" @click="handleReturnRequest(currentOrder)">审批退货</button>
                </div>
              </div>
            </template>

            <!-- 只有已支付或待发货状态才显示物流信息填写 -->
            <template v-if="currentOrder?.status === '已支付' || currentOrder?.status === '待发货'">
              <div class="form-group">
                <label>物流公司 <span class="required">*</span></label>
                <select v-model="orderForm.logisticsCompany" @change="validateLogisticsForm" required>
                  <option value="">请选择物流公司</option>
                  <option value="顺丰速运">顺丰速运</option>
                  <option value="中通快递">中通快递</option>
                  <option value="圆通速递">圆通速递</option>
                  <option value="韵达快递">韵达快递</option>
                  <option value="申通快递">申通快递</option>
                  <option value="极兔速递">极兔速递</option>
                  <option value="京东物流">京东物流</option>
                  <option value="邮政EMS">邮政EMS</option>
                  <option value="德邦快递">德邦快递</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label>运单号 <span class="required">*</span></label>
                <input
                  type="text"
                  v-model="orderForm.trackingNumber"
                  @input="validateLogisticsForm"
                  @paste="handleTrackingPaste"
                  placeholder="请输入运单号"
                  :class="{'input-error': trackingNumberError}"
                >
                <span v-if="trackingNumberError" class="error-tip">{{ trackingNumberError }}</span>
                <span v-else class="input-tip">支持复制粘贴，可手动输入或粘贴运单号</span>
              </div>
              <div v-if="logisticsSubmitting" class="submit-progress">
                <span class="spinner"></span> 提交中...
              </div>
              <div v-if="logisticsSubmitSuccess" class="submit-success">
                ✓ 发货成功！订单状态已更新为"待收货"
              </div>
              <div v-if="logisticsSubmitError" class="submit-error">
                ✗ {{ logisticsSubmitError }} <button class="btn-link" @click="retryLogisticsSubmit">重试</button>
              </div>
            </template>

            <!-- 已发货后显示物流信息（仅查看） -->
            <template v-else-if="currentOrder?.status === '待收货' || currentOrder?.status === '已完成'">
              <div class="logistics-info-display">
                <div class="info-row">
                  <span class="info-label">物流公司：</span>
                  <span class="info-value">{{ currentOrder?.logisticsCompany || '未填写' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">运单号：</span>
                  <span class="info-value tracking-number">{{ currentOrder?.trackingNumber || '未填写' }}</span>
                  <button v-if="currentOrder?.trackingNumber" class="btn-copy" @click="copyTrackingNumber(currentOrder.trackingNumber)">复制</button>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showOrderManage = false">关闭</button>
          <!-- 买家操作 -->
          <template v-if="userStore.isBuyer">
            <!-- 待收货状态显示确认收货按钮 -->
            <button
              v-if="currentOrder?.status === '待收货'"
              class="btn btn-success"
              @click="confirmReceipt"
            >
              确认收货
            </button>
            <!-- 未申请退货或申请被拒绝时显示提交按钮 -->
            <button
              v-else-if="!currentOrder?.returnStatus || currentOrder?.returnStatus === '无' || currentOrder?.returnStatus === '已拒绝'"
              class="btn btn-primary"
              @click="submitReturnApplication"
              :disabled="!canSubmitReturn"
            >
              提交退货申请
            </button>
            <!-- 商家批准后填写退货物流 -->
            <button
              v-else-if="currentOrder?.returnStatus === '已批准' && !currentOrder?.returnShipped"
              class="btn btn-primary"
              @click="submitReturnLogistics"
              :disabled="!returnForm.logisticsCompany || !returnForm.logisticsNumber"
            >
              提交退货物流
            </button>
          </template>
          <!-- 商户发货 -->
          <button
            v-else-if="currentOrder?.status === '已支付' || currentOrder?.status === '待发货'"
            class="btn btn-primary"
            @click="submitLogistics"
            :disabled="!canSubmitLogistics || logisticsSubmitting"
          >
            {{ logisticsSubmitting ? '提交中...' : '确认发货' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 退货审批弹窗 -->
    <div v-if="showReturnApprove" class="modal-overlay" @click="showReturnApprove = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>退货审批</h3>
          <button class="modal-close" @click="showReturnApprove = false">×</button>
        </div>
        <div class="modal-body">
          <p class="return-info">买家申请退货</p>
          <p><strong>申请类型:</strong> {{ returnApprovalOrder?.returnType || '退货退款' }}</p>
          <p><strong>退单原因:</strong> {{ returnApprovalOrder?.returnReason }}</p>
          <p><strong>退单数量:</strong> {{ returnApprovalOrder?.returnQuantity }}斤</p>
          <p><strong>订单编号:</strong> {{ returnApprovalOrder?.id }}</p>
          <p><strong>申请时间:</strong> {{ formatDate(returnApprovalOrder?.returnRequestedAt) }}</p>
          <div class="form-group">
            <label>审批操作</label>
            <select v-model="returnApprovalForm.action">
              <option value="approve">批准退货</option>
              <option value="reject">拒绝退货</option>
            </select>
          </div>
          <div v-if="returnApprovalForm.action === 'reject'" class="form-group">
            <label>拒绝原因</label>
            <textarea v-model="returnApprovalForm.reason" placeholder="请输入拒绝原因"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showReturnApprove = false">取消</button>
          <button class="btn btn-primary" @click="submitReturnApproval">确认</button>
        </div>
      </div>
    </div>

    <!-- 拒绝投标弹窗 -->
    <div v-if="showRejectBid" class="modal-overlay" @click="showRejectBid = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>拒绝投标</h3>
          <button class="modal-close" @click="showRejectBid = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>拒绝原因 <span class="required">*</span></label>
            <textarea v-model="rejectBidForm.reason" placeholder="请输入拒绝原因" required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRejectBid = false" :disabled="processingBid">取消</button>
          <button class="btn btn-danger" @click="confirmRejectBid" :disabled="processingBid">
            {{ processingBid ? '处理中...' : '确认拒绝' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 接受投标确认弹窗 -->
    <div v-if="showBidAcceptConfirm" class="modal-overlay" @click="showBidAcceptConfirm = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>确认接受投标</h3>
          <button class="modal-close" @click="showBidAcceptConfirm = false">×</button>
        </div>
        <div class="modal-body" v-if="currentBidDetail">
          <div class="bid-confirm-info">
            <h4 style="color: #333; margin-bottom: 15px;">请确认以下投标信息：</h4>
            <div class="info-box" style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">投标单号:</span>
                  <span class="detail-value">{{ currentBidDetail.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">投标人:</span>
                  <span class="detail-value">{{ currentBidDetail.buyerName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">投标项目:</span>
                  <span class="detail-value">{{ currentBidDetail.projectName }}</span>
                </div>
                <div class="detail-item" v-if="currentBidDetail.projectLocation">
                  <span class="detail-label">项目位置:</span>
                  <span class="detail-value">{{ currentBidDetail.projectLocation }}</span>
                </div>
                <div class="detail-item" v-if="currentBidDetail.projectArea">
                  <span class="detail-label">项目面积:</span>
                  <span class="detail-value">{{ currentBidDetail.projectArea }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">投标金额:</span>
                  <span class="detail-value price" style="color: #e74c3c; font-size: 18px; font-weight: bold;">¥{{ currentBidDetail.amount?.toLocaleString() }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">联系人:</span>
                  <span class="detail-value">{{ currentBidDetail.contact }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">联系电话:</span>
                  <span class="detail-value">{{ currentBidDetail.phone }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">投标时间:</span>
                  <span class="detail-value">{{ currentBidDetail.bidDate }}</span>
                </div>
              </div>
            </div>
            <div class="warning-box" style="background: #fff3cd; padding: 12px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <p style="margin: 0 0 8px 0; color: #856404; font-weight: bold;">提示：接受此投标后，系统将自动执行以下操作：</p>
              <ul style="margin: 0; color: #856404; padding-left: 20px;">
                <li>拒绝该项目下的所有其他投标</li>
                <li>向投标成功的用户发送通知消息："我已接受你的投标，请尽快联系我"</li>
                <li>向所有其他参与投标但被拒绝的用户发送通知消息："不好意思，您的投标未被采纳"</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBidAcceptConfirm = false" :disabled="processingBid">取消</button>
          <button class="btn btn-success" @click="confirmAcceptBid" :disabled="processingBid">
            {{ processingBid ? '处理中...' : '确定接受' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <div v-if="showOrderDetail" class="modal-overlay" @click="showOrderDetail = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>订单详情</h3>
          <button class="modal-close" @click="showOrderDetail = false">×</button>
        </div>
        <div class="modal-body" v-if="currentOrderDetail">
          <div v-if="orderDetailLoading" class="loading-indicator">
            <span>加载中...</span>
          </div>
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">订单编号:</span>
                <span class="detail-value">{{ currentOrderDetail.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">订单状态:</span>
                <span class="detail-value status-tag" :class="'status-' + currentOrderDetail.status">{{ currentOrderDetail.status }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">支付状态:</span>
                <span class="detail-value status-tag" :class="'status-' + currentOrderDetail.paymentStatus">{{ currentOrderDetail.paymentStatus || '已支付' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">下单时间:</span>
                <span class="detail-value">{{ currentOrderDetail.orderDate }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">订单金额:</span>
                <span class="detail-value price">¥{{ currentOrderDetail.totalPrice?.toFixed(2) }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.paidAt">
                <span class="detail-label">支付时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.paidAt) }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.shippedAt">
                <span class="detail-label">发货时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.shippedAt) }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.completedAt">
                <span class="detail-label">完成时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.completedAt) }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.autoConfirmed">
                <span class="detail-label">确认方式:</span>
                <span class="detail-value">系统自动确认</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>商品信息</h4>
            <div class="product-info-detail">
              <img v-if="currentOrderDetail.productImage || currentOrderDetail.product?.image" :src="currentOrderDetail.productImage || currentOrderDetail.product?.image" class="product-image-detail" alt="商品图片">
              <div class="product-meta-detail">
                <p><strong>商品名称:</strong> {{ currentOrderDetail.productName || currentOrderDetail.product?.name }}</p>
                <p><strong>商品ID:</strong> {{ currentOrderDetail.productId || currentOrderDetail.product?.id }}</p>
                <p><strong>单价:</strong> ¥{{ currentOrderDetail.productPrice?.toFixed(2) || currentOrderDetail.product?.price }}</p>
                <p><strong>数量:</strong> {{ currentOrderDetail.quantity }} 斤</p>
                <p v-if="currentOrderDetail.product?.origin"><strong>产地:</strong> {{ currentOrderDetail.product.origin }}</p>
                <p v-if="currentOrderDetail.product?.category"><strong>分类:</strong> {{ currentOrderDetail.product.category }}</p>
                <p v-if="currentOrderDetail.product?.shippingTime"><strong>发货时间:</strong> <span class="shipping-time" :class="'shipping-' + currentOrderDetail.product.shippingTime.replace(/[^\w\u4e00-\u9fa5]/g, '')">{{ currentOrderDetail.product.shippingTime }}</span></p>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>交易双方</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">买家:</span>
                <span class="detail-value">{{ currentOrderDetail.buyerName || currentOrderDetail.buyer?.name || currentOrderDetail.buyer?.username }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.buyer?.phone">
                <span class="detail-label">买家电话:</span>
                <span class="detail-value">{{ currentOrderDetail.buyer.phone }}</span>
              </div>
              <div class="detail-item full-width" v-if="currentOrderDetail.buyer?.address">
                <span class="detail-label">买家地址:</span>
                <span class="detail-value">{{ currentOrderDetail.buyer.address }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">卖家:</span>
                <span class="detail-value">{{ currentOrderDetail.merchantName || currentOrderDetail.merchant?.name || currentOrderDetail.merchant?.username }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.merchant?.phone">
                <span class="detail-label">卖家电话:</span>
                <span class="detail-value">{{ currentOrderDetail.merchant.phone }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.merchant?.companyPhone">
                <span class="detail-label">公司电话:</span>
                <span class="detail-value">{{ currentOrderDetail.merchant.companyPhone }}</span>
              </div>
              <div class="detail-item full-width" v-if="currentOrderDetail.merchant?.companyAddress">
                <span class="detail-label">公司地址:</span>
                <span class="detail-value">{{ currentOrderDetail.merchant.companyAddress }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="currentOrderDetail.logisticsCompany || currentOrderDetail.trackingNumber || currentOrderDetail.status === '待发货' || currentOrderDetail.status === '待收货' || currentOrderDetail.status === '已完成'">
            <h4>物流信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">物流状态:</span>
                <span class="detail-value status-tag" :class="getLogisticsStatusClass(currentOrderDetail)">
                  {{ getLogisticsStatusText(currentOrderDetail) }}
                </span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.logisticsCompany">
                <span class="detail-label">物流公司:</span>
                <span class="detail-value">{{ currentOrderDetail.logisticsCompany }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.trackingNumber">
                <span class="detail-label">运单号:</span>
                <span class="detail-value">{{ currentOrderDetail.trackingNumber }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.shippedAt">
                <span class="detail-label">发货时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.shippedAt) }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.completedAt && currentOrderDetail.status === '已完成'">
                <span class="detail-label">签收时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.completedAt) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="currentOrderDetail.returnReason || currentOrderDetail.returnStatus !== '无'">
            <h4>退货信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">退货状态:</span>
                <span class="detail-value status-tag" :class="'status-' + currentOrderDetail.returnStatus">
                  {{ currentOrderDetail.returnStatus || '申请中' }}
                </span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnType">
                <span class="detail-label">退货类型:</span>
                <span class="detail-value">{{ currentOrderDetail.returnType }}</span>
              </div>
              <div class="detail-item full-width" v-if="currentOrderDetail.returnReason">
                <span class="detail-label">退货原因:</span>
                <span class="detail-value">{{ currentOrderDetail.returnReason }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnQuantity">
                <span class="detail-label">退货数量:</span>
                <span class="detail-value">{{ currentOrderDetail.returnQuantity }} 斤</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnRefundMethod">
                <span class="detail-label">退款方式:</span>
                <span class="detail-value">{{ currentOrderDetail.returnRefundMethod }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnRequestedAt">
                <span class="detail-label">申请时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.returnRequestedAt) }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnApprovedAt">
                <span class="detail-label">批准时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.returnApprovedAt) }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnRejectedAt">
                <span class="detail-label">拒绝时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.returnRejectedAt) }}</span>
              </div>
            </div>
            <div class="detail-grid" v-if="currentOrderDetail.returnLogisticsCompany || currentOrderDetail.returnLogisticsNumber">
              <h5 style="width: 100%; margin-top: 10px;">退货运单</h5>
              <div class="detail-item" v-if="currentOrderDetail.returnLogisticsCompany">
                <span class="detail-label">退货物流公司:</span>
                <span class="detail-value">{{ currentOrderDetail.returnLogisticsCompany }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnLogisticsNumber">
                <span class="detail-label">退货运单号:</span>
                <span class="detail-value">{{ currentOrderDetail.returnLogisticsNumber }}</span>
              </div>
              <div class="detail-item" v-if="currentOrderDetail.returnShippedAt">
                <span class="detail-label">退货发货时间:</span>
                <span class="detail-value">{{ formatDateTime(currentOrderDetail.returnShippedAt) }}</span>
              </div>
            </div>
            <div class="detail-images" v-if="currentOrderDetail.returnImages">
              <h5 style="width: 100%; margin-top: 10px;">退货凭证</h5>
              <div class="image-gallery">
                <img v-for="(img, index) in parseReturnImages(currentOrderDetail.returnImages)" :key="index" :src="img" class="return-image" @click="viewImage(img)">
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="currentOrderDetail.remark">
            <h4>备注</h4>
            <p class="detail-remark">{{ currentOrderDetail.remark }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showOrderDetail = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 投标详情弹窗 -->
    <div v-if="showBidDetail" class="modal-overlay" @click="showBidDetail = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>投标详情</h3>
          <button class="modal-close" @click="showBidDetail = false">×</button>
        </div>
        <div class="modal-body" v-if="currentBidDetail">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">投标编号:</span>
                <span class="detail-value">{{ currentBidDetail.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投标状态:</span>
                <span class="detail-value status-tag" :class="'status-' + currentBidDetail.status">{{ currentBidDetail.statusText || currentBidDetail.status }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投标时间:</span>
                <span class="detail-value">{{ currentBidDetail.bidDate }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投标金额:</span>
                <span class="detail-value price">¥{{ currentBidDetail.amount?.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>项目信息</h4>
            <div class="detail-grid">
              <div class="detail-item full-width">
                <span class="detail-label">项目名称:</span>
                <span class="detail-value">{{ currentBidDetail.projectName }}</span>
              </div>
              <div class="detail-item" v-if="currentBidDetail.projectLocation">
                <span class="detail-label">项目位置:</span>
                <span class="detail-value">{{ currentBidDetail.projectLocation }}</span>
              </div>
              <div class="detail-item" v-if="currentBidDetail.projectArea">
                <span class="detail-label">项目面积:</span>
                <span class="detail-value">{{ currentBidDetail.projectArea }}</span>
              </div>
              <div class="detail-item" v-if="currentBidDetail.projectPrice">
                <span class="detail-label">项目预算:</span>
                <span class="detail-value">¥{{ currentBidDetail.projectPrice?.toLocaleString() }}</span>
              </div>
            </div>
            <p v-if="currentBidDetail.projectDescription" class="detail-description">{{ currentBidDetail.projectDescription }}</p>
          </div>

          <div class="detail-section">
            <h4>投标方信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">投标人:</span>
                <span class="detail-value">{{ currentBidDetail.buyerName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">联系人:</span>
                <span class="detail-value">{{ currentBidDetail.contact }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">联系电话:</span>
                <span class="detail-value">{{ currentBidDetail.phone }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="currentBidDetail.description">
            <h4>投标说明</h4>
            <p class="detail-description">{{ currentBidDetail.description }}</p>
          </div>

          <div class="detail-section" v-if="currentBidDetail.rejectReason">
            <h4>拒绝原因</h4>
            <p class="detail-reject-reason">{{ currentBidDetail.rejectReason }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBidDetail = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 发布项目弹窗 -->
    <div v-if="showProjectPublish" class="modal-overlay" @click="showProjectPublish = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>发布新项目</h3>
          <button class="modal-close" @click="showProjectPublish = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>发布商家</label>
            <input type="text" :value="userStore.userInfo.name || userStore.userInfo.username" disabled class="form-input">
          </div>
          <div class="form-group">
            <label>项目名称 <span class="required">*</span></label>
            <input type="text" v-model="newProject.name" placeholder="请输入项目名称" required>
          </div>
          <div class="form-group">
            <label>项目类型</label>
            <select v-model="newProject.type">
              <option value="">请选择项目类型</option>
              <option value="宅基地">宅基地</option>
              <option value="厂房">厂房</option>
              <option value="土地">土地</option>
              <option value="林地">林地</option>
              <option value="水面">水面</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>项目描述</label>
            <textarea v-model="newProject.description" placeholder="请输入项目描述"></textarea>
          </div>
          <div class="form-group">
            <label>面积</label>
            <input type="text" v-model="newProject.area" placeholder="如：200平方米">
          </div>
          <div class="form-group">
            <label>价格 (元) <span class="required">*</span></label>
            <input type="number" v-model="newProject.price" placeholder="请输入价格" required>
          </div>
          <div class="form-group">
            <label>项目位置</label>
            <input type="text" v-model="newProject.location" placeholder="请输入项目详细位置">
          </div>
          <div class="form-group">
            <label>联系人</label>
            <input type="text" v-model="newProject.contactPerson" placeholder="请输入联系人姓名">
          </div>
          <div class="form-group">
            <label>联系方式</label>
            <input type="text" v-model="newProject.contactInfo" placeholder="请输入联系方式">
          </div>
          <div class="form-group">
            <label>投标截止日期</label>
            <input type="date" v-model="newProject.bidEndDate">
          </div>
          <div class="form-group">
            <label>相关附件</label>
            <input type="file" ref="projectAttachment" @change="handleProjectAttachment" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
            <p class="help-text">支持 PDF、Word、图片格式，最多5个文件</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProjectPublish = false">取消</button>
          <button class="btn btn-primary" @click="publishProject" :disabled="publishingProject">
            {{ publishingProject ? '发布中...' : '发布' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 发布农产品弹窗 -->
    <div v-if="showProductPublish" class="modal-overlay" @click="showProductPublish = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>发布新农产品</h3>
          <button class="modal-close" @click="showProductPublish = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>发布商家</label>
            <input type="text" :value="userStore.userInfo.name || userStore.userInfo.username" disabled class="form-input">
          </div>
          <div class="form-group">
            <label>农产品名称 <span class="required">*</span></label>
            <input type="text" v-model="newProduct.name" placeholder="请输入农产品名称" required>
          </div>
          <div class="form-group">
            <label>农产品类型</label>
            <select v-model="newProduct.type">
              <option value="">请选择农产品类型</option>
              <option value="粮食">粮食</option>
              <option value="蔬菜">蔬菜</option>
              <option value="水果">水果</option>
              <option value="肉类">肉类</option>
              <option value="禽蛋">禽蛋</option>
              <option value="水产">水产</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格 (元/斤) <span class="required">*</span></label>
            <input type="number" v-model="newProduct.price" placeholder="请输入价格" required>
          </div>
          <div class="form-group">
            <label>库存 (斤) <span class="required">*</span></label>
            <input type="number" v-model="newProduct.stock" placeholder="请输入库存" required>
          </div>
          <div class="form-group">
            <label>产地</label>
            <input type="text" v-model="newProduct.origin" placeholder="请输入产地">
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="newProduct.description" placeholder="请输入农产品描述"></textarea>
          </div>
          <div class="form-group">
            <label>发货时间</label>
            <select v-model="newProduct.shippingTime">
              <option value="24小时内发货">24小时内发货</option>
              <option value="3天内发货">3天内发货</option>
              <option value="15天内发货">15天内发货</option>
              <option value="预售">预售</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProductPublish = false">取消</button>
          <button class="btn btn-primary" @click="publishProduct" :disabled="publishingProduct">
            {{ publishingProduct ? '发布中...' : '发布' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store/modules/user'
import { useMarketStore } from '@/store'
import { useOrderStore } from '@/store/modules/order'
import { authAPI } from '@/utils/authAPI'
import { apiService } from '@/utils/api'
import Pagination from '@/components/Pagination.vue'
import PaginationPro from '@/components/PaginationPro.vue'

export default {
  name: 'User',
  components: {
    Pagination,
    PaginationPro
  },
  setup() {
    const userStore = useUserStore()
    const marketStore = useMarketStore()
    const orderStore = useOrderStore()
    return { userStore, marketStore, orderStore }
  },
  data() {
    return {
      activeTab: 'profile',
      userInfo: {},
      settings: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      showProjectManage: false,
      showProductManage: false,
      showOrderManage: false,
      showProjectPublish: false,
      showProductPublish: false,
      showReturnApprove: false,
      showRejectBid: false,
      showOrderDetail: false,
      showBidDetail: false,
      showBidAcceptConfirm: false,
      processingBid: false,
      // 消息提示
      toastMessage: '',
      toastType: 'info',
      showToast: false,
      // 分页配置
      pagination: {
        orders: { page: 1, pageSize: 10, total: 0 },
        products: { page: 1, pageSize: 10, total: 0 },
        projects: { page: 1, pageSize: 10, total: 0 },
        bidOrders: { page: 1, pageSize: 10, total: 0 }
      },
      currentOrderDetail: null,
      currentBidDetail: null,
      orderDetailLoading: false,
      messages: [],
      unreadMessageCount: 0,
      showMessageDetail: false,
      currentMessage: null,
      projectForm: {
        name: '',
        type: '',
        status: '交易中',
        description: '',
        price: '',
        area: '',
        location: '',
        contactPerson: '',
        contactInfo: '',
        bidEndDate: ''
      },
      productForm: {
        name: '',
        price: '',
        stock: '',
        status: '在售'
      },
      orderForm: {
        status: '已完成',
        logisticsCompany: '',
        trackingNumber: '',
        remark: ''
      },
      returnForm: {
        returnType: '',
        reasonType: '',
        reasonDetail: '',
        quantity: 1,
        refundMethod: '原路退回',
        images: [],
        logisticsCompany: '',
        logisticsNumber: ''
      },
      returnApprovalForm: {
        action: 'approve',
        reason: ''
      },
      rejectBidForm: {
        reason: ''
      },
      newProject: {
        name: '',
        type: '',
        description: '',
        area: '',
        expectedYield: '',
        price: '',
        location: '',
        contactPerson: '',
        contactInfo: '',
        image: ''
      },
      trackingNumberError: '',
      logisticsSubmitting: false,
      logisticsSubmitSuccess: false,
      logisticsSubmitError: '',
      newProduct: {
        name: '',
        type: '',
        price: '',
        stock: '',
        origin: '',
        description: '',
        category: '',
        image: ''
      },
      projectAttachments: [],
      loadingProjects: false,
      loadingProducts: false,
      publishingProject: false,
      publishingProduct: false,
      savingProfile: false,
      currentProject: null,
      currentProduct: null,
      currentOrder: null,
      returnApprovalOrder: null,
      rejectingBid: null,
      rejectingProject: null,
      // 商户数据
      merchantProjects: [],
      merchantProducts: [],
      // 用户信息修改申请
      userUpdateRequests: [],
      // 农产品修改申请
      productUpdateRequests: [],
      // 图片上传相关
      imageUploadProgress: 0,
      imageUploadError: '',
      imageFileInput: null
    }
  },
  computed: {
    displayShoppingOrders() {
      // 后端已经根据用户类型过滤了订单，直接使用所有订单
      return this.orderStore.shoppingOrders
    },
    displayBidOrders() {
      if (this.userStore.isMerchant) {
        return []
      }
      // 直接使用从服务器分页加载的 bidOrders
      return this.orderStore.bidOrders.map(order => ({
        ...order,
        statusText: order.status === 'accepted' ? '已接受' :
                   order.status === 'rejected' ? '商家拒绝了这个投标' :
                   order.status === 'pending' ? '待处理' : order.status
      }))
    },
    displayMerchantBidProjects() {
      if (!this.userStore.isMerchant) return []
      return this.orderStore.merchantBidProjects
    },
    // 分页后的购物订单
    paginatedShoppingOrders() {
      const { page, pageSize } = this.pagination.orders
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return this.displayShoppingOrders.slice(start, end)
    },
    // 分页后的投标订单
    paginatedBidOrders() {
      const { page, pageSize } = this.pagination.bidOrders
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return this.displayBidOrders.slice(start, end)
    },
    // 分页后的商户项目
    paginatedMerchantProjects() {
      const { page, pageSize } = this.pagination.projects
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return this.merchantProjects.slice(start, end)
    },
    // 分页后的商户农产品
    paginatedMerchantProducts() {
      const { page, pageSize } = this.pagination.products
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return this.merchantProducts.slice(start, end)
    },
    canSubmitReturn() {
      if (!this.returnForm.returnType) return false
      if (!this.returnForm.reasonType) return false
      if (this.returnForm.reasonType === '其他原因' && !this.returnForm.reasonDetail) return false
      if (!this.returnForm.quantity || this.returnForm.quantity < 1) return false
      return true
    }
  },
  watch: {
    activeTab: {
      immediate: false,
      handler(newTab) {
        if (newTab === 'projects' && this.userStore.isMerchant) {
          this.loadMerchantProjects()
        } else if (newTab === 'products' && this.userStore.isMerchant) {
          this.loadMerchantProducts()
        } else if (newTab === 'profile') {
          this.loadUserUpdateRequests()
        }
      }
    },
    // 监听数据变化，更新分页总数
    displayShoppingOrders: {
      handler(orders) {
        this.pagination.orders.total = orders.length
      },
      immediate: true
    },
    displayBidOrders: {
      handler(orders) {
        this.pagination.bidOrders.total = orders.length
      },
      immediate: true
    },
    // 监听 store 中的商户数据变化
    'marketStore.merchantProjects': {
      handler(projects) {
        this.merchantProjects = projects || []
        this.pagination.projects.total = (projects || []).length
      },
      immediate: true
    },
    'marketStore.merchantProducts': {
      handler(products) {
        this.merchantProducts = products || []
        this.pagination.products.total = (products || []).length
      },
      immediate: true
    }
  },
  created() {
    // 初始化用户信息
    this.userInfo = this.getUserInfoFromStore()
    // 同步商户数据到本地
    this.merchantProjects = this.marketStore.merchantProjects || []
    this.merchantProducts = this.marketStore.merchantProducts || []
  },
  mounted() {
    this.syncUserInfo()
    // 同步订单数据，确保从服务器获取最新数据
    this.orderStore.syncOrdersFromServer()
    // 使用分页加载投标订单
    this.orderStore.loadBidsWithPagination(1, 10)
    this.loadUnreadCount()
    if (this.userStore.isMerchant) {
      this.loadMerchantProjects()
      this.loadMerchantProducts()
      this.loadProductUpdateRequests()
    }
    this.loadUserUpdateRequests()
  },
  methods: {
    // 消息提示方法
    showMessage(message, type = 'info') {
      this.toastMessage = message
      this.toastType = type
      this.showToast = true
      setTimeout(() => {
        this.showToast = false
      }, 3000)
    },
    // 分页方法
    handleOrderPageChange(page) {
      this.pagination.orders.page = page
    },
    handleBidOrderPageChange(page) {
      this.pagination.bidOrders.page = page
    },
    handleProjectPageChange(page) {
      this.pagination.projects.page = page
    },
    handleProductPageChange(page) {
      this.pagination.products.page = page
    },
    // 投标订单分页方法
    async handleBidPageChange(page) {
      this.orderStore.setBidPagination(page)
      await this.orderStore.loadBidsWithPagination(page, this.orderStore.bidPagination.size)
    },
    async handleBidSizeChange(size) {
      this.orderStore.setBidPagination(1, size)
      await this.orderStore.loadBidsWithPagination(1, size)
    },
    getUserInfoFromStore() {
      const storeUser = this.userStore.userInfo || {}
      return {
        name: storeUser.name || '',
        realName: storeUser.realName || '',
        idCard: storeUser.idCard || '',
        phone: storeUser.phone || '',
        email: storeUser.email || '',
        address: storeUser.address || '',
        businessLicense: storeUser.businessLicense || '',
        businessScope: storeUser.businessScope || '',
        companyPhone: storeUser.companyPhone || '',
        companyAddress: storeUser.companyAddress || ''
      }
    },
    async syncUserInfo() {
      try {
        const result = await this.userStore.fetchCurrentUser()
        if (result.success) {
          this.userInfo = this.getUserInfoFromStore()
        }
      } catch (error) {
        console.error('同步用户信息失败:', error)
        this.userInfo = this.getUserInfoFromStore()
      }
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleString('zh-CN')
    },
    async loadMessages() {
      if (!this.userStore.isLoggedIn) return
      try {
        const { data } = await apiService.get('/messages')
        console.log('[loadMessages] API返回数据:', JSON.stringify(data))
        if (data.success) {
          this.messages = data.data?.messages || []
          console.log('[loadMessages] 加载消息成功:', this.messages.length, '条')
        }
      } catch (error) {
        console.error('加载消息失败:', error)
      }
    },
    async loadUnreadCount() {
      if (!this.userStore.isLoggedIn) return
      try {
        const { data } = await apiService.get('/messages/unread-count')
        if (data.success) {
          this.unreadMessageCount = data.data?.count || 0
        }
      } catch (error) {
        console.error('获取未读消息数失败:', error)
      }
    },
    async markAllMessagesRead() {
      try {
        await apiService.put('/messages/read-all')
        this.unreadMessageCount = 0
        this.messages.forEach(m => m.isRead = true)
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    },
    async viewMessage(msg) {
      this.currentMessage = msg
      this.showMessageDetail = true
      if (!msg.isRead) {
        try {
          await apiService.put(`/messages/${msg.id}/read`)
          msg.isRead = true
          this.unreadMessageCount = Math.max(0, this.unreadMessageCount - 1)
        } catch (error) {
          console.error('标记消息已读失败:', error)
        }
      }
    },
    closeMessageDetail() {
      this.showMessageDetail = false
      this.currentMessage = null
    },
    async switchToMessages() {
      this.activeTab = 'messages'
      await this.loadMessages()
    },
    async loadMerchantProjects() {
      if (!this.userStore.isLoggedIn) return
      this.loadingProjects = true
      try {
        await this.marketStore.fetchMerchantProjects()
        // 同步到本地数据
        this.merchantProjects = this.marketStore.merchantProjects || []
      } catch (error) {
        console.error('Failed to load merchant projects:', error)
        alert('加载项目列表失败：' + error.message)
      } finally {
        this.loadingProjects = false
      }
    },
    async loadMerchantProducts() {
      if (!this.userStore.isLoggedIn) return
      this.loadingProducts = true
      try {
        await this.marketStore.fetchMerchantProducts()
        // 同步到本地数据
        this.merchantProducts = this.marketStore.merchantProducts || []
      } catch (error) {
        console.error('Failed to load merchant products:', error)
        alert('加载农产品列表失败：' + error.message)
      } finally {
        this.loadingProducts = false
      }
    },
    async handleProfileSubmit() {
      if (this.savingProfile) return

      // 表单验证
      if (!this.validateProfileForm()) {
        return
      }

      this.savingProfile = true
      try {
        // 获取原始数据
        const originalData = this.getUserInfoFromStore()

        // 构建申请数据
        const requestedData = {
          name: this.userInfo.name,
          realName: this.userInfo.realName,
          idCard: this.userInfo.idCard,
          phone: this.userInfo.phone,
          email: this.userInfo.email,
          address: this.userInfo.address
        }

        // 只有商户用户才提交企业相关字段
        if (this.userStore.isMerchant) {
          requestedData.businessLicense = this.userInfo.businessLicense
          requestedData.businessScope = this.userInfo.businessScope
          requestedData.companyPhone = this.userInfo.companyPhone
          requestedData.companyAddress = this.userInfo.companyAddress
        }

        // 检测变更的字段
        const changedFields = []
        for (const key in requestedData) {
          if (requestedData[key] !== originalData[key]) {
            changedFields.push(key)
          }
        }

        if (changedFields.length === 0) {
          alert('没有需要修改的信息')
          this.savingProfile = false
          return
        }

        // 提交修改申请
        const res = await apiService.post('/user-update-requests', {
          requestedData,
          originalData,
          changedFields
        })

        if (res.data && res.data.success) {
          alert('修改申请已提交，请等待管理员审核')
          this.loadUserUpdateRequests()
          // 重置表单为原始数据
          this.syncUserInfo()
        }
      } catch (error) {
        console.error('Failed to submit update request:', error)
        alert('提交失败：' + (error.response?.data?.error?.message || error.message || '未知错误'))
      } finally {
        this.savingProfile = false
      }
    },

    // 表单验证
    validateProfileForm() {
      const errors = []

      if (!this.userInfo.name || this.userInfo.name.trim().length < 2) {
        errors.push('姓名至少需要2个字符')
      }

      if (!this.userInfo.phone || !/^1[3-9]\d{9}$/.test(this.userInfo.phone)) {
        errors.push('请输入有效的11位手机号码')
      }

      if (this.userInfo.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.userInfo.email)) {
        errors.push('请输入有效的邮箱地址')
      }

      if (this.userStore.isMerchant) {
        if (!this.userInfo.businessLicense || this.userInfo.businessLicense.trim().length < 5) {
          errors.push('营业执照编号至少需要5个字符')
        }
        if (!this.userInfo.businessScope || this.userInfo.businessScope.trim().length < 5) {
          errors.push('经营范围至少需要5个字符')
        }
        if (!this.userInfo.companyPhone || !/^[\d\-\(\)\s]+$/.test(this.userInfo.companyPhone)) {
          errors.push('请输入有效的企业联系电话')
        }
        if (!this.userInfo.companyAddress || this.userInfo.companyAddress.trim().length < 5) {
          errors.push('企业地址至少需要5个字符')
        }
      }

      if (errors.length > 0) {
        alert('表单验证失败：\n' + errors.join('\n'))
        return false
      }

      return true
    },

    // 加载用户修改申请记录
    async loadUserUpdateRequests() {
      try {
        const res = await apiService.get('/user-update-requests/my')
        if (res.data && res.data.success) {
          this.userUpdateRequests = res.data.data.requests || []
        }
      } catch (error) {
        console.error('加载修改申请记录失败:', error)
      }
    },

    // 加载农产品修改申请记录
    async loadProductUpdateRequests() {
      try {
        const res = await apiService.get('/product-update-requests/my')
        if (res.data && res.data.success) {
          this.productUpdateRequests = res.data.data.requests || []
        }
      } catch (error) {
        console.error('加载农产品修改申请记录失败:', error)
      }
    },

    // 获取变更字段的文本描述
    getChangedFieldsText(fields) {
      if (!fields || fields.length === 0) return '-'
      const fieldNames = {
        name: '姓名',
        phone: '电话',
        email: '邮箱',
        address: '地址',
        businessLicense: '营业执照编号',
        businessScope: '经营范围',
        companyPhone: '企业联系电话',
        companyAddress: '企业地址',
        realName: '真实姓名',
        idCard: '身份证号'
      }
      return fields.map(f => fieldNames[f] || f).join('、')
    },

    // 获取农产品变更字段的文本描述
    getProductChangedFieldsText(fields) {
      if (!fields || fields.length === 0) return '-'
      const fieldNames = {
        name: '产品名称',
        price: '价格',
        stock: '库存',
        status: '状态',
        category: '分类',
        origin: '产地',
        description: '产品描述',
        image: '产品图片'
      }
      return fields.map(f => fieldNames[f] || f).join('、')
    },
    showLogistics(status) {
      return ['待收货', '已完成'].includes(status)
    },
    requiresLogistics(status) {
      return ['待收货', '已完成'].includes(status)
    },
    canRequestReturn(order) {
      // 已取消的订单不允许退货
      if (order.status === '已取消') return false
      // 退货申请中时不显示（包括二次申请已提交的情况）
      if (order.returnStatus === '申请中') return false
      // 已批准的退货申请不显示
      if (order.returnStatus === '已批准') return false
      // 订单状态为退单中时不显示（申请已提交等待审核）
      if (order.status === '退单中') return false
      // 其他情况都显示退货按钮（包括已拒绝的，允许重新申请）
      return true
    },
    isOrderMerchant(order) {
      const currentUserId = this.userStore.userInfo.id
      return order.merchantId === currentUserId
    },
    viewProjectDetail(projectId) {
      this.$router.push(`/project/detail/${projectId}`)
    },
    manageProject(project) {
      this.projectForm = {
        name: project.name,
        type: project.type || '',
        status: project.status,
        description: project.description || '',
        price: project.price || '',
        area: project.area || '',
        location: project.location || '',
        contactPerson: project.contactPerson || '',
        contactInfo: project.contactInfo || '',
        bidEndDate: project.bidEndDate ? project.bidEndDate.split('T')[0] : ''
      }
      this.currentProject = project
      this.showProjectManage = true
    },
    async saveProject() {
      if (this.currentProject && this.currentProject.id) {
        // 编辑现有项目，提交修改申请
        try {
          const originalData = { ...this.currentProject }
          const requestedData = {
            name: this.projectForm.name,
            type: this.projectForm.type,
            status: this.projectForm.status,
            description: this.projectForm.description,
            price: parseFloat(this.projectForm.price) || 0,
            area: this.projectForm.area,
            location: this.projectForm.location,
            contactPerson: this.projectForm.contactPerson,
            contactInfo: this.projectForm.contactInfo,
            bidEndDate: this.projectForm.bidEndDate
          }

          // 找出变更的字段
          const changedFields = []
          for (const key of Object.keys(requestedData)) {
            if (originalData[key] !== requestedData[key]) {
              changedFields.push(key)
            }
          }

          console.log('[ProjectUpdate] changedFields:', changedFields)
          console.log('[ProjectUpdate] requestedData:', requestedData)
          console.log('[ProjectUpdate] originalData:', originalData)
          console.log('[ProjectUpdate] currentProject:', this.currentProject)

          if (changedFields.length === 0) {
            alert('没有修改任何信息')
            return
          }

          // 提交项目修改申请 - 使用与农产品一致的字段名
          const { apiService } = await import('@/utils/api')
          await apiService.post(`/project-applications/${this.currentProject.id}/modify`, {
            projectName: this.projectForm.name,
            requestedData,
            originalData,
            changedFields
          })

          alert('项目修改申请已提交，请等待管理员审核')
          this.showProjectManage = false
          // 刷新项目列表
          this.loadMerchantProjects()
        } catch (error) {
          console.error('Failed to submit project update request:', error)
          alert('提交申请失败：' + (error.response?.data?.error?.message || error.message))
        }
      } else {
        // 新建项目（如果有需要）
        alert('项目信息已保存')
        this.showProjectManage = false
      }
    },
    async deleteProject() {
      if (confirm('确定要删除这个项目吗？')) {
        if (this.currentProject) {
          try {
            const result = await this.marketStore.deleteProject(this.currentProject.id)
            if (result.success) {
              alert('项目已删除')
              this.showProjectManage = false
              await this.loadMerchantProjects()
            } else {
              alert('删除失败：' + (result.error || '未知错误'))
            }
          } catch (error) {
            console.error('Failed to delete project:', error)
            alert('删除失败：' + error.message)
          }
        }
      }
    },
    viewProductDetail(productId) {
      this.$router.push(`/product/detail/${productId}`)
    },
    manageProduct(product) {
      this.productForm = {
        name: product.name,
        price: product.price,
        stock: product.stock,
        status: product.status,
        category: product.category || '',
        origin: product.origin || '',
        description: product.description || '',
        image: product.image || ''
      }
      this.currentProduct = product
      this.showProductManage = true
    },
    async handleImageFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      this.imageUploadError = ''
      this.imageUploadProgress = 0

      if (!file.type.includes('png')) {
        this.imageUploadError = '只能上传PNG格式的图片'
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        this.imageUploadError = '图片大小不能超过10MB'
        return
      }

      try {
        const { fileAPI } = await import('@/utils/fileAPI')
        const result = await fileAPI.uploadFile(file, 'products')

        if (result.url) {
          this.productForm.image = result.url
          this.imageUploadProgress = 100
        } else {
          this.imageUploadError = '上传失败，请重试'
        }
      } catch (error) {
        console.error('Image upload error:', error)
        this.imageUploadError = error.message || '图片上传失败'
      }
    },
    async saveProduct() {
      if (this.currentProduct) {
        // 编辑现有产品，提交修改申请
        try {
          const originalData = { ...this.currentProduct }
          const requestedData = {
            name: this.productForm.name,
            price: parseFloat(this.productForm.price),
            stock: parseInt(this.productForm.stock),
            status: this.productForm.status,
            category: this.productForm.category,
            origin: this.productForm.origin,
            description: this.productForm.description,
            image: this.productForm.image
          }

          // 找出变更的字段
          const changedFields = []
          for (const key of Object.keys(requestedData)) {
            if (String(originalData[key]) !== String(requestedData[key])) {
              changedFields.push(key)
            }
          }

          console.log('[ProductUpdate] changedFields:', changedFields)
          console.log('[ProductUpdate] requestedData:', requestedData)
          console.log('[ProductUpdate] originalData:', originalData)
          console.log('[ProductUpdate] currentProduct:', this.currentProduct)

          if (changedFields.length === 0) {
            alert('没有修改任何信息')
            return
          }

          const { productUpdateAPI } = await import('@/utils/api')
          const apiResult = await productUpdateAPI.createRequest({
            productId: this.currentProduct.id,
            originalData,
            requestedData,
            changedFields
          })
          console.log('[ProductUpdate] API result:', apiResult)

          alert('农产品修改申请已提交，请等待管理员审核')
          this.showProductManage = false
          // Update currentProduct with new data so subsequent edits use the new values
          Object.assign(this.currentProduct, requestedData)
          this.loadProductUpdateRequests()
        } catch (error) {
          console.error('Failed to submit product update request:', error)
          alert(error.message || '提交修改申请失败')
        }
      } else {
        // 创建新产品（发布功能）
        const productData = {
          name: this.productForm.name,
          price: parseFloat(this.productForm.price),
          stock: parseInt(this.productForm.stock),
          status: this.productForm.status,
          category: this.productForm.category || '',
          origin: this.productForm.origin || '',
          description: this.productForm.description || '',
          image: this.productForm.image || ''
        }

        if (this.marketStore.apiEnabled) {
          try {
            const { productAPI } = await import('@/utils/productAPI')
            await productAPI.createProduct(productData)
            alert('农产品发布成功')
            this.loadMerchantProducts()
          } catch (error) {
            console.error('Failed to create product:', error)
            alert(error.message || '农产品发布失败')
            return
          }
        } else {
          this.marketStore.updateProduct(this.currentProduct?.id, productData)
          alert('农产品信息已保存（本地模式）')
        }
        this.showProductManage = false
      }
    },
    async viewOrderDetail(orderId) {
      // 查找订单 - 优先通过 serverId 查找，否则通过 id (orderNo) 查找
      let order = this.displayShoppingOrders.find(o => o.serverId === orderId)
      if (!order) {
        order = this.displayShoppingOrders.find(o => o.id === orderId)
      }
      if (!order) {
        alert('订单不存在')
        return
      }

      // 先显示弹窗和本地数据，提升用户体验
      this.currentOrderDetail = order
      this.showOrderDetail = true
      this.orderDetailLoading = true

      // 如果API可用，异步从服务器获取最新数据
      if (this.orderStore.apiEnabled && order.serverId) {
        try {
          const { orderAPI } = await import('@/utils/orderAPI')
          const result = await orderAPI.getOrder(order.serverId)
          if (result.order) {
            this.currentOrderDetail = {
              ...order,
              ...result.order,
              id: order.id, // 保持 orderNo 作为显示ID
              serverId: order.serverId,
              productName: result.order.product?.name || order.productName,
              buyerName: result.order.buyer?.username || order.buyerName,
              merchantName: result.order.merchant?.name || result.order.merchant?.username || order.merchantName,
              orderDate: result.order.createdAt || order.orderDate,
              totalPrice: parseFloat(result.order.totalPrice) || order.totalPrice,
              status: result.order.status || order.status,
              paymentStatus: result.order.paymentStatus || order.paymentStatus,
              returnStatus: result.order.returnStatus || order.returnStatus,
              logisticsCompany: result.order.logisticsCompany || order.logisticsCompany,
              trackingNumber: result.order.trackingNumber || order.trackingNumber,
              returnReason: result.order.returnReason || order.returnReason,
              returnQuantity: result.order.returnQuantity || order.returnQuantity,
              returnApproved: result.order.returnApproved || order.returnApproved,
              returnRejected: result.order.returnRejected || order.returnRejected,
              remark: result.order.remark || order.remark,
              productImage: result.order.product?.image || order.productImage,
              productPrice: parseFloat(result.order.product?.price) || order.productPrice,
              shippingAddress: result.order.shippingAddress || order.shippingAddress,
              contactPhone: result.order.contactPhone || order.contactPhone
            }
          }
        } catch (error) {
          console.error('Failed to fetch order detail:', error)
          // 使用本地数据，不显示错误
        } finally {
          this.orderDetailLoading = false
        }
      } else {
        this.orderDetailLoading = false
      }
    },
    viewImage(imageUrl) {
      // 在新窗口中查看大图
      window.open(imageUrl, '_blank')
    },
    formatDateTime(date) {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    parseReturnImages(images) {
      if (!images) return []
      try {
        return JSON.parse(images)
      } catch (e) {
        return []
      }
    },
    getLogisticsStatusText(order) {
      if (order.status === '已完成') return '已签收'
      if (order.status === '待收货') return '已发货'
      if (order.logisticsCompany || order.trackingNumber) return '已发货'
      return '未发货'
    },
    getLogisticsStatusClass(order) {
      const status = this.getLogisticsStatusText(order)
      return 'status-' + status
    },
    showReturnDialog(order) {
      this.currentOrder = order
      this.returnForm = {
        returnType: '',
        reasonType: '',
        reasonDetail: '',
        quantity: order.quantity,
        refundMethod: '原路退回',
        images: [],
        logisticsCompany: '',
        logisticsNumber: ''
      }
      this.showOrderManage = true
    },
    handleReasonChange() {
      if (this.returnForm.reasonType !== '其他原因') {
        this.returnForm.reasonDetail = ''
      }
    },
    increaseReturnQuantity() {
      if (this.returnForm.quantity < this.currentOrder?.quantity) {
        this.returnForm.quantity++
      }
    },
    decreaseReturnQuantity() {
      if (this.returnForm.quantity > 1) {
        this.returnForm.quantity--
      }
    },
    calculateRefundAmount() {
      if (!this.currentOrder) return 0
      const unitPrice = this.currentOrder.totalPrice / this.currentOrder.quantity
      return unitPrice * this.returnForm.quantity
    },
    triggerReturnImageUpload() {
      this.$refs.returnImageInput?.click()
    },
    handleReturnImageChange(event) {
      const files = Array.from(event.target.files)
      this.processReturnImages(files)
    },
    handleReturnImageDrop(event) {
      const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'))
      this.processReturnImages(files)
    },
    processReturnImages(files) {
      const remainingSlots = 5 - (this.returnForm.images?.length || 0)
      const filesToProcess = files.slice(0, remainingSlots)
      
      filesToProcess.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (!this.returnForm.images) this.returnForm.images = []
          this.returnForm.images.push(e.target.result)
        }
        reader.readAsDataURL(file)
      })
    },
    removeReturnImage(index) {
      this.returnForm.images.splice(index, 1)
    },
    async submitReturnApplication() {
      if (!this.returnForm.returnType) {
        alert('请选择申请类型')
        return
      }
      if (!this.returnForm.reasonType) {
        alert('请选择退货原因')
        return
      }
      if (this.returnForm.reasonType === '其他原因' && !this.returnForm.reasonDetail) {
        alert('请填写详细退货原因')
        return
      }
      if (!this.returnForm.quantity || this.returnForm.quantity < 1) {
        alert('请填写退货数量')
        return
      }
      
      const reason = this.returnForm.reasonType === '其他原因' 
        ? this.returnForm.reasonDetail 
        : this.returnForm.reasonType
      
      try {
        await this.orderStore.requestReturn(this.currentOrder.id, {
          returnType: this.returnForm.returnType,
          reason: reason,
          quantity: this.returnForm.quantity,
          refundMethod: this.returnForm.refundMethod,
          images: this.returnForm.images
        })
        alert('退货申请已提交，请等待商家审核')
        this.showOrderManage = false
        // 刷新订单列表以更新按钮状态
        await this.orderStore.syncOrdersFromServer()
      } catch (error) {
        alert('提交失败：' + (error.message || '请稍后重试'))
      }
    },
    async submitReturnLogistics() {
      if (!this.returnForm.logisticsCompany || !this.returnForm.logisticsNumber) {
        alert('请填写完整的退货物流信息')
        return
      }

      try {
        await this.orderStore.submitReturnLogistics(this.currentOrder.id, {
          logisticsCompany: this.returnForm.logisticsCompany,
          logisticsNumber: this.returnForm.logisticsNumber
        })
        alert('退货物流信息已提交')
        this.showOrderManage = false
        // 刷新订单列表以更新状态
        await this.orderStore.syncOrdersFromServer()
      } catch (error) {
        alert('提交失败：' + (error.message || '请稍后重试'))
      }
    },
    async confirmReceipt() {
      if (!confirm('确认已收到商品？确认后订单将标记为已完成。')) {
        return
      }

      try {
        await this.orderStore.updateShoppingOrder(this.currentOrder.id, {
          status: '已完成'
        })
        alert('确认收货成功！订单已完成。')
        this.showOrderManage = false
        // 刷新订单列表以更新状态
        await this.orderStore.syncOrdersFromServer()
      } catch (error) {
        alert('确认收货失败：' + (error.message || '请稍后重试'))
      }
    },
    async confirmReceiptFromList(order) {
      if (!confirm(`确认已收到订单 ${order.id} 的商品？确认后订单将标记为已完成。`)) {
        return
      }

      try {
        await this.orderStore.updateShoppingOrder(order.id, {
          status: '已完成'
        })
        alert('确认收货成功！订单已完成。')
        // 刷新订单列表以更新状态
        await this.orderStore.syncOrdersFromServer()
      } catch (error) {
        alert('确认收货失败：' + (error.message || '请稍后重试'))
      }
    },
    manageOrder(order) {
      this.currentOrder = order
      this.orderForm = {
        status: order.status,
        logisticsCompany: order.logisticsCompany || '',
        trackingNumber: order.trackingNumber || '',
        remark: order.remark || ''
      }
      this.trackingNumberError = ''
      this.logisticsSubmitting = false
      this.logisticsSubmitSuccess = false
      this.logisticsSubmitError = ''
      this.showOrderManage = true
    },
    saveOrder() {
      if (this.userStore.isBuyer) {
        if (!this.returnForm.reason || !this.returnForm.quantity) {
          alert('请填写完整的退单信息')
          return
        }
        if (parseInt(this.returnForm.quantity) > this.currentOrder.quantity) {
          alert('退单数量不能大于购买数量')
          return
        }
        this.orderStore.updateShoppingOrder(this.currentOrder.id, {
          returnReason: this.returnForm.reason,
          returnQuantity: parseInt(this.returnForm.quantity),
          returnRequested: true
        })
        alert('退单申请已提交')
      } else {
        if (this.requiresLogistics(this.orderForm.status)) {
          if (!this.orderForm.logisticsCompany || !this.orderForm.trackingNumber) {
            alert('请填写完整的物流信息（物流公司和运单号）')
            return
          }
        }
        this.orderStore.updateShoppingOrder(this.currentOrder.id, {
          status: this.orderForm.status,
          logisticsCompany: this.orderForm.logisticsCompany,
          trackingNumber: this.orderForm.trackingNumber,
          remark: this.orderForm.remark
        })
        alert('订单信息已更新')
      }
      this.showOrderManage = false
    },
    handleReturnRequest(order) {
      this.returnApprovalOrder = order
      this.returnApprovalForm = { action: 'approve', reason: '' }
      this.showReturnApprove = true
    },
    async submitReturnApproval() {
      if (this.returnApprovalForm.action === 'reject' && !this.returnApprovalForm.reason) {
        alert('请填写拒绝原因')
        return
      }
      if (this.returnApprovalForm.action === 'approve') {
        await this.orderStore.approveReturn(this.returnApprovalOrder.id)
        alert('已批准退货申请，订单已取消')
      } else {
        await this.orderStore.rejectReturn(this.returnApprovalOrder.id, this.returnApprovalForm.reason)
        alert('已拒绝退货申请')
      }
      this.showReturnApprove = false
      // 刷新订单列表以更新状态
      await this.orderStore.syncOrdersFromServer()
    },
    validateLogisticsForm() {
      const num = this.orderForm.trackingNumber
      if (!num) {
        this.trackingNumberError = ''
        return false
      }
      const cleanNum = num.replace(/\s+/g, '')
      if (cleanNum.length < 6) {
        this.trackingNumberError = '运单号长度不能少于6位'
        return false
      }
      if (!/^[A-Za-z0-9]+$/.test(cleanNum)) {
        this.trackingNumberError = '运单号只能包含字母和数字'
        return false
      }
      this.trackingNumberError = ''
      return true
    },
    handleTrackingPaste(event) {
      setTimeout(() => {
        this.validateLogisticsForm()
      }, 0)
    },
    copyTrackingNumber(number) {
      navigator.clipboard.writeText(number).then(() => {
        alert('运单号已复制到剪贴板')
      }).catch(() => {
        const textarea = document.createElement('textarea')
        textarea.value = number
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        alert('运单号已复制到剪贴板')
      })
    },
    canSubmitLogistics() {
      return this.orderForm.logisticsCompany &&
             this.orderForm.trackingNumber &&
             !this.trackingNumberError &&
             this.orderForm.trackingNumber.length >= 6
    },
    async submitLogistics() {
      if (!this.validateLogisticsForm()) {
        return
      }
      if (!this.canSubmitLogistics()) {
        return
      }

      this.logisticsSubmitting = true
      this.logisticsSubmitSuccess = false
      this.logisticsSubmitError = ''

      try {
        const { orderAPI } = await import('@/utils/orderAPI')
        const serverId = this.currentOrder.serverId || this.currentOrder.id
        await orderAPI.shipOrder(serverId, {
          logisticsCompany: this.orderForm.logisticsCompany,
          trackingNumber: this.orderForm.trackingNumber
        })

        this.logisticsSubmitSuccess = true
        this.currentOrder.status = '待收货'
        this.currentOrder.logisticsCompany = this.orderForm.logisticsCompany
        this.currentOrder.trackingNumber = this.orderForm.trackingNumber

        await this.orderStore.syncOrdersFromServer()

        setTimeout(() => {
          this.showOrderManage = false
          this.logisticsSubmitSuccess = false
          this.logisticsSubmitting = false
        }, 2000)
      } catch (error) {
        console.error('发货失败:', error)
        this.logisticsSubmitError = error.message || '发货失败，请重试'
      } finally {
        this.logisticsSubmitting = false
      }
    },
    retryLogisticsSubmit() {
      this.logisticsSubmitError = ''
      this.submitLogistics()
    },
    async viewBidDetail(bidId) {
      // 查找投标
      const bid = this.displayBidOrders.find(b => b.id === bidId)
      if (!bid) {
        alert('投标记录不存在')
        return
      }

      // 如果API可用，从服务器获取最新数据
      if (this.orderStore.apiEnabled) {
        try {
          const { bidAPI } = await import('@/utils/bidAPI')
          const result = await bidAPI.getBid(bidId)
          if (result.bid) {
            this.currentBidDetail = {
              ...bid,
              ...result.bid,
              projectName: result.bid.project?.name || bid.projectName,
              merchantName: result.bid.project?.owner?.name || result.bid.project?.owner?.username || bid.merchantName,
              buyerName: result.bid.bidder?.username || bid.buyerName,
              amount: parseFloat(result.bid.amount) || bid.amount,
              contact: result.bid.contact || bid.contact,
              phone: result.bid.phone || bid.phone,
              bidDate: result.bid.bidDate || result.bid.createdAt || bid.bidDate,
              status: result.bid.status || bid.status,
              description: result.bid.description || bid.description,
              rejectReason: result.bid.rejectReason || bid.rejectReason,
              projectDescription: result.bid.project?.description || bid.projectDescription,
              projectLocation: result.bid.project?.location || bid.projectLocation,
              projectArea: result.bid.project?.area || bid.projectArea,
              projectPrice: parseFloat(result.bid.project?.price) || bid.projectPrice
            }
          } else {
            this.currentBidDetail = bid
          }
        } catch (error) {
          console.error('Failed to fetch bid detail:', error)
          this.currentBidDetail = bid
        }
      } else {
        this.currentBidDetail = bid
      }

      this.showBidDetail = true
    },
    async acceptBid(projectId, bidId) {
      // 找到投标详情
      const project = this.displayMerchantBidProjects.find(p => p.projectId === projectId)
      const bid = project?.orders.find(b => b.id === bidId)
      if (!bid) return

      // 显示确认面板
      this.currentBidDetail = {
        ...bid,
        projectName: project.projectName,
        projectDescription: bid.projectDescription,
        projectLocation: bid.projectLocation,
        projectArea: bid.projectArea
      }
      this.showBidAcceptConfirm = true
    },
    async confirmAcceptBid() {
      if (!this.currentBidDetail) return

      const bidId = this.currentBidDetail.id
      // 设置处理中状态 - 影响该项目的所有按钮
      this.setBidProcessingState(bidId, true, 'accept')
      this.processingBid = true

      try {
        const result = await this.orderStore.acceptBid(bidId)
        if (result.success) {
          // 显示成功消息
          this.showMessage('已接受该投标，系统已自动通知所有投标人', 'success')
          this.showBidAcceptConfirm = false
          this.currentBidDetail = null
          // 刷新投标列表
          await this.refreshBidOrders()
        } else {
          // 显示错误消息
          this.showMessage('操作失败: ' + (result.error || '未知错误'), 'error')
        }
      } catch (error) {
        // 捕获未处理的异常
        this.showMessage('操作失败: ' + (error.message || '网络错误'), 'error')
      } finally {
        this.processingBid = false
        // 清除处理中状态
        this.setBidProcessingState(bidId, false, null)
      }
    },
    // 设置投标处理中状态
    setBidProcessingState(bidId, isProcessing, processingType) {
      // 找到目标投标
      const targetBid = this.orderStore.bidOrders.find(b => b.id === bidId)
      if (!targetBid) return

      const projectId = targetBid.projectId

      // 修改 store 中的数据 - 这会通过响应式系统自动更新 UI
      if (processingType === 'accept') {
        // 接受操作：设置整个项目的所有待处理投标为处理中
        this.orderStore.bidOrders.forEach(b => {
          if (b.projectId === projectId && b.status === '待处理') {
            b.processing = isProcessing
            b.processingType = processingType
          }
        })
      } else if (processingType === 'reject') {
        // 拒绝操作：只设置当前投标
        targetBid.processing = isProcessing
        targetBid.processingType = processingType
      } else {
        // 清除处理中状态
        this.orderStore.bidOrders.forEach(b => {
          if (b.projectId === projectId) {
            b.processing = false
            b.processingType = null
          }
        })
      }
    },
    // 刷新投标订单
    async refreshBidOrders() {
      try {
        await this.orderStore.syncBidsFromServer()
      } catch (error) {
        console.error('刷新投标列表失败:', error)
      }
    },
    showRejectDialog(projectId, bidId) {
      this.rejectingProject = projectId
      this.rejectingBid = bidId
      this.rejectBidForm = { reason: '' }
      this.showRejectBid = true
    },
    async confirmRejectBid() {
      if (!this.rejectBidForm.reason) {
        this.showMessage('请填写拒绝原因', 'warning')
        return
      }

      const bidId = this.rejectingBid
      // 设置处理中状态 - 只影响当前投标
      this.setBidProcessingState(bidId, true, 'reject')
      this.processingBid = true

      try {
        const result = await this.orderStore.rejectBid(bidId, this.rejectBidForm.reason)
        if (result.success) {
          // 显示成功消息
          this.showMessage('已拒绝该投标，系统已自动通知投标人', 'success')
          this.showRejectBid = false
          this.rejectingBid = null
          this.rejectingProject = null
          this.rejectBidForm.reason = ''
          // 刷新投标列表
          await this.refreshBidOrders()
        } else {
          // 显示错误消息
          this.showMessage('操作失败: ' + (result.error || '未知错误'), 'error')
        }
      } catch (error) {
        // 捕获未处理的异常
        this.showMessage('操作失败: ' + (error.message || '网络错误'), 'error')
      } finally {
        this.processingBid = false
        // 清除处理中状态
        this.setBidProcessingState(bidId, false, null)
      }
    },
    async publishProject() {
      if (this.publishingProject) return
      if (!this.newProject.name || !this.newProject.price) {
        alert('请填写必填项')
        return
      }
      this.publishingProject = true
      try {
        let attachments = []
        if (this.projectAttachments && this.projectAttachments.length > 0) {
          attachments = await this.uploadProjectAttachments()
        }
        const project = {
          name: this.newProject.name,
          type: this.newProject.type || undefined,
          description: this.newProject.description || undefined,
          area: this.newProject.area || undefined,
          price: parseFloat(this.newProject.price),
          location: this.newProject.location || undefined,
          contactPerson: this.newProject.contactPerson || undefined,
          contactInfo: this.newProject.contactInfo || undefined,
          bidEndDate: this.newProject.bidEndDate || undefined,
          attachments: attachments
        }
        const result = await this.marketStore.addProject(project)
        if (result.success) {
          this.showProjectPublish = false
          this.newProject = { name: '', type: '', description: '', area: '', price: '', location: '', contactPerson: '', contactInfo: '', bidEndDate: '' }
          this.projectAttachments = []
          alert(result.message || '项目发布申请已提交，等待管理员审核')
          await this.loadMerchantProjects()
        } else {
          alert('项目发布失败：' + (result.error || '未知错误'))
        }
      } catch (error) {
        console.error('Failed to publish project:', error)
        alert('项目发布失败：' + error.message)
      } finally {
        this.publishingProject = false
      }
    },
    async uploadProjectAttachments() {
      const attachments = []
      for (const file of this.projectAttachments) {
        const formData = new FormData()
        formData.append('file', file)
        try {
          const response = await fetch('/api/uploads', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          })
          const data = await response.json()
          if (data.success && data.data.files && data.data.files.length > 0) {
            attachments.push(data.data.files[0])
          }
        } catch (error) {
          console.error('Failed to upload attachment:', error)
        }
      }
      return attachments
    },
    handleProjectAttachment(event) {
      const files = event.target.files
      if (files.length > 5) {
        alert('最多只能上传5个文件')
        return
      }
      this.projectAttachments = Array.from(files)
    },
    async publishProduct() {
      if (this.publishingProduct) return
      if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.stock) {
        alert('请填写必填项')
        return
      }
      const product = {
        name: this.newProduct.name,
        type: this.newProduct.type || undefined,
        price: parseFloat(this.newProduct.price),
        stock: parseInt(this.newProduct.stock),
        origin: this.newProduct.origin || '商丘市梁园区',
        description: this.newProduct.description || undefined,
        category: this.newProduct.category || '',
        image: this.newProduct.image || '',
        shippingTime: this.newProduct.shippingTime || '24小时内发货'
      }
      this.publishingProduct = true
      try {
        const result = await this.marketStore.addProduct(product)
        if (result.success) {
          this.showProductPublish = false
          this.newProduct = { name: '', type: '', price: '', stock: '', origin: '', description: '', category: '', image: '', shippingTime: '24小时内发货' }
          alert(result.message || '农产品发布申请已提交，等待管理员审核')
          await this.loadMerchantProducts()
        } else {
          alert('农产品发布失败：' + (result.error || '未知错误'))
        }
      } catch (error) {
        console.error('Failed to publish product:', error)
        alert('农产品发布失败：' + error.message)
      } finally {
        this.publishingProduct = false
      }
    }
  }
}
</script>

<style scoped>
.user-container {
  padding: 20px;
}

.user-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
  margin-top: 30px;
}

.user-sidebar {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.user-info {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.avatar {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.user-info h2 {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: #333;
}

.user-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.user-detail {
  font-size: 12px;
  color: #4CAF50;
  margin-top: 5px !important;
}

.user-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-menu li {
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.user-menu li:hover {
  background-color: #f5f5f5;
  color: #4CAF50;
}

.user-menu li.active {
  background-color: #4CAF50;
  color: white;
}

.user-main {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.user-main h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.form-divider {
  margin: 25px 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #4CAF50;
  position: relative;
}

.form-divider span {
  position: absolute;
  top: -10px;
  left: 0;
  background: white;
  padding: 0 10px;
  color: #4CAF50;
  font-weight: bold;
  font-size: 14px;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.required {
  color: #f44336;
}

.project-list,
.product-list,
.order-list,
.bid-order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-item,
.product-item,
.order-item,
.bid-project-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.project-header,
.product-header,
.order-header,
.bid-project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-header h3,
.product-header h3,
.order-header h3,
.bid-project-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: #333;
}

.project-merchant,
.product-merchant {
  color: #4CAF50 !important;
  font-weight: 500 !important;
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

.order-party {
  color: #1976d2 !important;
  font-weight: 500 !important;
}

.project-item p,
.product-item p,
.order-item p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-交易中,
.status-在售,
.status-待发货,
.status-待收货,
.status-pending {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-已完成,
.status-accepted {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-已取消,
.status-已售罄,
.status-下架,
.status-rejected {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-已支付 {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* 物流状态样式 */
.status-未发货 {
  background-color: #f5f5f5;
  color: #666;
}

.status-已发货 {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-运输中 {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-已签收 {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-已退回 {
  background-color: #ffebee;
  color: #d32f2f;
}

/* 发货时间样式 */
.shipping-time {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.shipping-24小时内发货 {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.shipping-3天内发货 {
  background-color: #fff3e0;
  color: #f57c00;
}

.shipping-15天内发货 {
  background-color: #fce4ec;
  color: #c2185b;
}

.shipping-预售 {
  background-color: #e3f2fd;
  color: #1976d2;
}

.project-actions,
.product-actions,
.order-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.bid-order-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.bid-project-header {
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.bid-count {
  font-size: 14px;
  color: #666;
}

.bid-table {
  margin-top: 15px;
  overflow-x: auto;
}

.bid-table table {
  width: 100%;
  border-collapse: collapse;
}

.bid-table th,
.bid-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.bid-table th {
  background-color: #f5f5f5;
  font-weight: 500;
  color: #333;
}

.bid-table tbody tr:hover {
  background-color: #fafafa;
}

.bid-table tbody tr.accepted-bid {
  background-color: #e8f5e9;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
}

.btn-small.btn-success {
  background-color: #4CAF50;
  color: white;
}

.btn-small.btn-danger {
  background-color: #f44336;
  color: white;
}

/* 投标操作按钮样式 - 统一尺寸 */
.bid-actions {
  white-space: nowrap;
}

.btn-bid-action {
  width: 70px;
  height: 32px;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-bid-action:last-child {
  margin-right: 0;
}

.btn-bid-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-bid-action.btn-success {
  background-color: #52c41a;
  color: white;
}

.btn-bid-action.btn-success:hover:not(:disabled) {
  background-color: #73d13d;
}

.btn-bid-action.btn-danger {
  background-color: #ff4d4f;
  color: white;
}

.btn-bid-action.btn-danger:hover:not(:disabled) {
  background-color: #ff7875;
}

.bid-status-text {
  color: #999;
  font-size: 13px;
}

/* 加载图标 */
.loading-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 4px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 消息提示样式 */
.toast-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease;
}

.toast-success {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.toast-error {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.toast-warning {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
  color: #faad14;
}

.toast-info {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.order-logistics {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  margin-top: 10px;
}

.order-return {
  background-color: #fff3e0;
  padding: 12px;
  border-radius: 4px;
  margin-top: 10px;
}

.return-reason {
  color: #f57c00;
}

.order-reject-reason {
  background-color: #ffebee;
  padding: 12px;
  border-radius: 4px;
  margin-top: 10px;
  color: #d32f2f;
}

.return-info {
  font-weight: bold;
  color: #f57c00;
  margin-bottom: 15px;
}

.order-info-summary {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.order-info-summary p {
  margin: 5px 0;
  font-size: 14px;
}

.order-info-summary strong {
  color: #666;
}

.logistics-info-display {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.info-label {
  font-weight: bold;
  color: #666;
  min-width: 80px;
}

.info-value {
  color: #333;
}

.tracking-number {
  font-family: monospace;
  font-size: 16px;
  color: #4CAF50;
}

.btn-copy {
  margin-left: 10px;
  padding: 4px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-copy:hover {
  background-color: #45a049;
}

/* 确认收货按钮样式 */
.btn-success {
  background-color: #4CAF50;
  color: white;
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-success:hover {
  background-color: #45a049;
}

.btn-success:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.input-error {
  border-color: #f44336 !important;
}

.error-tip {
  color: #f44336;
  font-size: 12px;
  margin-top: 5px;
}

.input-tip {
  color: #999;
  font-size: 12px;
  margin-top: 5px;
}

/* 退货申请信息展示 */
.return-application-info {
  background: #fff3e0;
  border: 1px solid #ff9800;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.return-application-info h4 {
  margin: 0 0 15px 0;
  color: #e65100;
  font-size: 16px;
  border-bottom: 1px solid #ffcc80;
  padding-bottom: 10px;
}

.return-application-info .info-row {
  margin: 8px 0;
}

.return-application-info .info-label {
  min-width: 100px;
  color: #666;
}

.return-application-info .info-value {
  color: #333;
  font-weight: 500;
}

.return-application-info .image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
}

.return-image-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid #ddd;
  transition: border-color 0.3s;
}

.return-image-thumbnail:hover {
  border-color: #4CAF50;
}

.return-application-info .action-buttons {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ffcc80;
  text-align: center;
}

.return-application-info .btn-success {
  background-color: #4CAF50;
  color: white;
  padding: 10px 30px;
  font-size: 16px;
}

.return-application-info .btn-success:hover {
  background-color: #45a049;
}

.submit-progress {
  padding: 10px;
  text-align: center;
  color: #2196F3;
}

.submit-progress .spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #2196F3;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.submit-success {
  padding: 10px;
  background-color: #E8F5E9;
  color: #4CAF50;
  border-radius: 4px;
  margin-top: 10px;
}

.submit-error {
  padding: 10px;
  background-color: #FFEBEE;
  color: #f44336;
  border-radius: 4px;
  margin-top: 10px;
}

.btn-link {
  background: none;
  border: none;
  color: #2196F3;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: 10px;
}

.btn-link:hover {
  color: #1976D2;
}

.empty-order {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.modal-close:hover {
  background-color: #f5f5f5;
}

.modal-body {
  padding: 20px;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 大弹窗样式 */
.modal-large {
  max-width: 800px;
}

/* 详情弹窗样式 */
.detail-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #4CAF50;
  display: inline-block;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  color: #666;
  font-size: 14px;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.detail-value.price {
  color: #f44336;
  font-size: 16px;
  font-weight: bold;
}

.product-info-detail {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.product-image-detail {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}

.product-meta-detail {
  flex: 1;
}

.product-meta-detail p {
  margin: 8px 0;
  font-size: 14px;
  color: #333;
}

.detail-description,
.detail-remark,
.detail-reject-reason {
  margin: 12px 0 0 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.detail-reject-reason {
  background-color: #ffebee;
  color: #c62828;
}

/* 详情图片样式 */
.detail-images {
  margin-top: 16px;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.return-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: transform 0.2s;
}

.return-image:hover {
  transform: scale(1.05);
}

/* 状态标签样式 */
.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-已支付 {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-待发货 {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-待收货 {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-已完成 {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-已取消 {
  background-color: #f5f5f5;
  color: #616161;
}

.status-退单中 {
  background-color: #fff3e0;
  color: #ef6c00;
}

.status-已退单 {
  background-color: #ffebee;
  color: #c62828;
}

.status-shipped {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-pending {
  background-color: #fff3e0;
  color: #ef6c00;
}

.status-accepted {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-rejected {
  background-color: #ffebee;
  color: #c62828;
}

.status-申请中 {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-已批准 {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-已拒绝 {
  background-color: #ffebee;
  color: #c62828;
}

.btn-danger {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.btn-warning {
  background-color: #ff9800;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.btn-warning:hover {
  background-color: #f57c00;
}

/* 退货流程样式 */
.return-progress {
  margin: 20px 0;
}

.return-progress h4 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 20px 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.step.active .step-icon {
  background-color: #2196F3;
  color: white;
}

.step.completed .step-icon {
  background-color: #4CAF50;
  color: white;
}

.step.rejected .step-icon {
  background-color: #F44336;
  color: white;
}

.step.rejected .step-title {
  color: #F44336;
}

.step-status.rejected {
  background-color: #FFEBEE;
  color: #F44336;
}

.step-text {
  text-align: center;
}

.step-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.step-time {
  font-size: 12px;
  color: #999;
}

.step-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.step-status.申请中 {
  background-color: #FFF3E0;
  color: #FF9800;
}

.step-status.已批准 {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.step-status.已拒绝 {
  background-color: #FFEBEE;
  color: #f44336;
}

.step-line {
  flex: 0.5;
  height: 2px;
  background-color: #e0e0e0;
  margin: 0 10px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.step-line.completed {
  background-color: #4CAF50;
}

.return-details {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.return-details h4 {
  font-size: 14px;
  margin-bottom: 12px;
  color: #333;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-label {
  color: #666;
  min-width: 80px;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.detail-value.text-danger {
  color: #f44336;
}

.return-logistics-form,
.return-logistics-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.return-logistics-form h4,
.return-logistics-info h4 {
  font-size: 14px;
  margin-bottom: 12px;
  color: #333;
}

/* 退货申请表单样式 */
.return-application-form {
  padding: 10px 0;
}

/* 之前的拒绝记录提示 */
.previous-rejection-notice {
  background-color: #FFF3E0;
  border: 1px solid #FF9800;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.notice-icon {
  font-size: 18px;
}

.notice-title {
  font-weight: bold;
  color: #E65100;
}

.notice-content {
  padding-left: 26px;
}

.notice-content p {
  margin: 5px 0;
  color: #666;
}

.notice-tip {
  color: #4CAF50;
  font-weight: bold;
  margin-top: 10px;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-quantity {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-quantity:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #4CAF50;
}

.btn-quantity:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.quantity-selector input {
  width: 80px;
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.refund-method-options,
.return-type-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.return-type-options {
  flex-direction: row;
  gap: 15px;
}

.return-type-options .radio-option {
  flex: 1;
}

.return-type-options .radio-option.active {
  border-color: #4CAF50;
  background-color: #E8F5E9;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.radio-option:hover {
  border-color: #4CAF50;
  background-color: #f9f9f9;
}

.radio-option input[type="radio"] {
  margin-top: 3px;
  margin-right: 10px;
}

.radio-label {
  display: flex;
  flex-direction: column;
}

.radio-label strong {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.radio-label small {
  font-size: 12px;
  color: #999;
}

.refund-amount {
  padding: 15px;
  background-color: #E8F5E9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.refund-amount .amount {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
}

.refund-amount .tip {
  font-size: 12px;
  color: #666;
}

/* 上传区域样式 */
.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #4CAF50;
  background-color: #f9f9f9;
}

.upload-placeholder {
  color: #999;
}

.upload-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.upload-placeholder p {
  margin: 5px 0;
  font-size: 14px;
}

.upload-placeholder small {
  font-size: 12px;
  color: #bbb;
}

.upload-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.upload-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
}

.upload-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-preview-item .btn-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(244, 67, 54, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-add {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-add:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

/* 状态标签样式 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-已支付 {
  background-color: #E3F2FD;
  color: #2196F3;
}

.status-待发货 {
  background-color: #FFF3E0;
  color: #FF9800;
}

.status-待收货 {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.status-已完成 {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.status-退单中 {
  background-color: #FFF3E0;
  color: #FF9800;
}

.status-已退单 {
  background-color: #FFEBEE;
  color: #f44336;
}

@media (max-width: 768px) {
  .user-content {
    grid-template-columns: 1fr;
  }

  .user-sidebar {
    order: 2;
  }

  .user-main {
    order: 1;
  }

  .user-menu {
    display: flex;
    overflow-x: auto;
    gap: 10px;
  }

  .user-menu li {
    white-space: nowrap;
    margin-bottom: 0;
  }

  .modal {
    width: 95%;
    margin: 20px;
  }

  .project-actions,
  .product-actions,
  .order-actions {
    flex-direction: column;
  }

  .bid-table {
    font-size: 12px;
  }

  .bid-table th,
  .bid-table td {
    padding: 8px;
  }
}

.messages-toolbar {
  margin-bottom: 20px;
}

.messages-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.message-item {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.message-item:hover {
  background: #fafafa;
}

.message-item.unread {
  background: #f0f7ff;
}

.message-item.unread:hover {
  background: #e6f0ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-title {
  font-weight: 600;
  color: #333;
}

.message-time {
  color: #999;
  font-size: 12px;
}

.message-content {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.unread-badge {
  position: absolute;
  top: 15px;
  right: 20px;
  background: #f44336;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.message-meta {
  color: #999;
  font-size: 12px;
  margin: 5px 0;
}

.message-body {
  margin-top: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.badge {
  background: #f44336;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 5px;
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: #999;
  background: #fff;
  border-radius: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  background: #fff;
  border-radius: 8px;
}

.loading-state .loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-order {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  background: #fff;
  border-radius: 8px;
}

.empty-order .empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

/* 表单必填标记 */
.required {
  color: #f44336;
  margin-left: 4px;
}

/* 表单提示信息 */
.form-notice {
  background-color: #e3f2fd;
  border-left: 4px solid #2196F3;
  padding: 12px 16px;
  margin: 20px 0;
  border-radius: 4px;
}

.notice-text {
  margin: 0;
  color: #1976D2;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notice-icon {
  font-size: 16px;
}

/* 修改申请记录区域 */
.update-requests-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #e0e0e0;
}

.update-requests-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4CAF50;
}

/* 状态标签样式 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-pending {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.status-approved {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.status-rejected {
  background-color: #ffebee;
  color: #c62828;
}

/* 数据表格样式 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.data-table tr:hover {
  background-color: #fafafa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-content {
    grid-template-columns: 1fr;
  }

  .user-sidebar {
    margin-bottom: 20px;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
  }
}
</style>