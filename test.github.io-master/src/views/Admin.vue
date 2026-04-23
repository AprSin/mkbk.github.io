<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>管理员中心</h1>
      <div class="admin-user">
        <span>欢迎，{{ userStore.userInfo.name || userStore.userInfo.username }}</span>
        <button class="btn btn-secondary" @click="logout">退出登录</button>
      </div>
    </div>

    <div class="admin-content">
      <div class="admin-sidebar">
        <ul class="admin-menu">
          <li @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }">
            <span class="menu-icon">👥</span>用户信息管理
            <span v-if="pendingUpdateRequestCount > 0" class="badge">{{ pendingUpdateRequestCount }}</span>
          </li>
          <li @click="activeTab = 'products'" :class="{ active: activeTab === 'products' }">
            <span class="menu-icon">🌾</span>农产品管理
          </li>
          <li @click="activeTab = 'orders'" :class="{ active: activeTab === 'orders' }">
            <span class="menu-icon">📦</span>购物订单管理
          </li>
          <li @click="activeTab = 'bids'" :class="{ active: activeTab === 'bids' }">
            <span class="menu-icon">📋</span>投标订单管理
          </li>
          <li @click="activeTab = 'projects'" :class="{ active: activeTab === 'projects' }">
            <span class="menu-icon">🏗️</span>交易项目管理
          </li>
          <li @click="activeTab = 'settings'" :class="{ active: activeTab === 'settings' }">
            <span class="menu-icon">⚙️</span>账号设置
          </li>
          <li @click="activeTab = 'messages'" :class="{ active: activeTab === 'messages' }">
            <span class="menu-icon">📨</span>消息发布
          </li>
        </ul>
      </div>

      <div class="admin-main">
        <!-- 用户信息管理 -->
        <div v-if="activeTab === 'users'" class="tab-content">
          <h2>用户信息管理</h2>
          <div class="tab-switch">
            <button :class="{ active: userSubTab === 'all' }" @click="userSubTab = 'all'">用户信息大全</button>
            <button :class="{ active: userSubTab === 'pending' }" @click="userSubTab = 'pending'; loadUserUpdateRequests()">用户修改申请管理</button>
          </div>

          <!-- 用户信息大全 -->
          <div v-if="userSubTab === 'all'">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>账户类型</th>
                  <th>姓名</th>
                  <th>电话</th>
                  <th>邮箱</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in paginatedUsers" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.accountType === 'merchant' ? '商户' : '买家' }}</td>
                  <td>{{ user.name || '-' }}</td>
                  <td>{{ user.phone || '-' }}</td>
                  <td>{{ user.email }}</td>
                  <td><span :class="'status-' + (user.isActive ? 'active' : 'inactive')">{{ user.isActive ? '正常' : '禁用' }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="editUser(user)">修改</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              v-if="users.length > 0 && userSubTab === 'all'"
              :current-page="pagination.users.page"
              :page-size="pagination.users.pageSize"
              :total="pagination.users.total"
              @page-change="handleUserPageChange"
            />
          </div>

          <!-- 用户修改申请管理 -->
          <div v-if="userSubTab === 'pending'">
            <div class="filter-bar">
              <div class="filter-item">
                <label>用户类型：</label>
                <select v-model="updateRequestFilters.userType" @change="loadUserUpdateRequests">
                  <option value="">全部</option>
                  <option value="buyer">买家</option>
                  <option value="merchant">商户</option>
                </select>
              </div>
              <div class="filter-item">
                <label>申请状态：</label>
                <select v-model="updateRequestFilters.status" @change="loadUserUpdateRequests">
                  <option value="">全部</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>
              <button class="btn btn-primary" @click="loadUserUpdateRequests">查询</button>
              <button class="btn btn-secondary" @click="resetUpdateRequestFilters">重置</button>
            </div>

            <div v-if="userUpdateRequests.length === 0" class="empty-state">暂无用户修改申请</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>申请ID</th>
                  <th>用户名</th>
                  <th>用户类型</th>
                  <th>修改字段</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="req in userUpdateRequests" :key="req.id">
                  <td>{{ req.id }}</td>
                  <td>{{ req.username }}</td>
                  <td>{{ req.userType === 'buyer' ? '买家' : '商户' }}</td>
                  <td>{{ getChangedFieldsText(req.changedFields) }}</td>
                  <td>{{ formatDate(req.createdAt) }}</td>
                  <td>
                    <span :class="'status-badge status-' + req.status">
                      {{ req.status === 'pending' ? '待审核' : req.status === 'approved' ? '已通过' : '已驳回' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewUpdateRequest(req)">查看详情</button>
                    <button v-if="req.status === 'pending'" class="btn btn-sm btn-success" @click="approveUpdateRequest(req)">通过</button>
                    <button v-if="req.status === 'pending'" class="btn btn-sm btn-danger" @click="rejectUpdateRequest(req)">驳回</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              v-if="userUpdateRequests.length > 0"
              :current-page="updateRequestPagination.page"
              :page-size="updateRequestPagination.size"
              :total="updateRequestPagination.total"
              @page-change="handleUpdateRequestPageChange"
            />
          </div>
        </div>

        <!-- 农产品管理 -->
        <div v-if="activeTab === 'products'" class="tab-content">
          <h2>农产品管理</h2>
          <div class="tab-switch">
            <button :class="{ active: productSubTab === 'all' }" @click="productSubTab = 'all'">农产品信息大全</button>
            <button :class="{ active: productSubTab === 'pending' }" @click="productSubTab = 'pending'; loadProductApplications()">农产品发布申请管理</button>
            <button :class="{ active: productSubTab === 'update' }" @click="productSubTab = 'update'; loadProductUpdateRequests()">农产品信息修改申请管理</button>
          </div>

          <!-- 农产品信息大全 -->
          <div v-if="productSubTab === 'all'">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名称</th>
                  <th>发布者</th>
                  <th>价格</th>
                  <th>库存</th>
                  <th>状态</th>
                  <th>发布时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in paginatedProducts" :key="product.id">
                  <td>{{ product.id }}</td>
                  <td>{{ product.name }}</td>
                  <td>{{ product.seller?.name || product.seller?.username }}</td>
                  <td>¥{{ product.price }}</td>
                  <td>{{ product.stock }}{{ product.unit || '斤' }}</td>
                  <td><span :class="'status-' + product.status">{{ product.status }}</span></td>
                  <td>{{ formatDate(product.createdAt) }}</td>
                  <td>
                    <button class="btn btn-sm btn-secondary" @click="viewProduct(product)">详情</button>
                    <button class="btn btn-sm btn-primary" @click="editProduct(product)">修改</button>
                    <button class="btn btn-sm btn-warning" @click="toggleProductStatus(product)">
                      {{ product.status === '已上架' ? '下架' : '上架' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              v-if="products.length > 0 && productSubTab === 'all'"
              :current-page="pagination.products.page"
              :page-size="pagination.products.pageSize"
              :total="pagination.products.total"
              @page-change="handleProductPageChange"
            />
          </div>

          <!-- 农产品发布申请管理 -->
          <div v-if="productSubTab === 'pending'">
            <div class="filter-bar">
              <div class="filter-item">
                <label>申请状态：</label>
                <select v-model="productAppFilters.status" @change="loadProductApplications">
                  <option value="">全部</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>
              <button class="btn btn-primary" @click="loadProductApplications">查询</button>
              <button class="btn btn-secondary" @click="resetProductAppFilters">重置</button>
            </div>
            <div v-if="productApplications.length === 0" class="empty-state">暂无农产品发布申请</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>申请ID</th>
                  <th>商户名称</th>
                  <th>农产品名称</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="app in productApplications" :key="app.id">
                  <td>{{ app.id }}</td>
                  <td>{{ app.merchantName }}</td>
                  <td>{{ app.productName }}</td>
                  <td>{{ formatDate(app.createdAt) }}</td>
                  <td><span :class="'status-badge status-' + app.status">{{ app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已驳回' }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewProductApplication(app)">查看详情</button>
                    <button v-if="app.status === 'pending'" class="btn btn-sm btn-success" @click="approveProductApplication(app)">通过</button>
                    <button v-if="app.status === 'pending'" class="btn btn-sm btn-danger" @click="showRejectProductModal(app)">拒绝</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 农产品信息修改申请管理 -->
          <div v-if="productSubTab === 'update'">
            <div class="filter-bar">
              <div class="filter-item">
                <label>申请状态：</label>
                <select v-model="productUpdateFilters.status" @change="loadProductUpdateRequests">
                  <option value="">全部</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>
              <button class="btn btn-primary" @click="loadProductUpdateRequests">查询</button>
              <button class="btn btn-secondary" @click="resetProductUpdateFilters">重置</button>
            </div>
            <div v-if="productUpdateRequests.length === 0" class="empty-state">暂无农产品修改申请</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>申请ID</th>
                  <th>商户名称</th>
                  <th>产品名称</th>
                  <th>修改字段</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="req in productUpdateRequests" :key="req.id">
                  <td>{{ req.id }}</td>
                  <td>{{ req.merchantName }}</td>
                  <td>{{ req.product?.name || '-' }}</td>
                  <td>{{ getProductChangedFieldsText(req.changedFields) }}</td>
                  <td>{{ formatDate(req.createdAt) }}</td>
                  <td>
                    <span :class="'status-badge status-' + req.status">
                      {{ req.status === 'pending' ? '待审核' : req.status === 'approved' ? '已通过' : '已驳回' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewProductUpdateRequest(req)">查看详情</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              v-if="productUpdateRequests.length > 0"
              :current-page="pagination.productUpdates.page"
              :page-size="pagination.productUpdates.pageSize"
              :total="pagination.productUpdates.total"
              @page-change="handleProductUpdatePageChange"
            />
          </div>
        </div>

        <!-- 购物订单管理 -->
        <div v-if="activeTab === 'orders'" class="tab-content">
          <h2>购物订单管理</h2>
          <div class="tab-switch">
            <button :class="{ active: orderSubTab === 'all' }" @click="orderSubTab = 'all'">购物订单信息大全</button>
            <button :class="{ active: orderSubTab === 'aftersale' }" @click="orderSubTab = 'aftersale'; loadAfterSaleOrders()">购物订单售后管理</button>
          </div>

          <!-- 购物订单信息大全 -->
          <div v-if="orderSubTab === 'all'">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>买家</th>
                  <th>商品</th>
                  <th>数量</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>下单时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in paginatedOrders" :key="order.id">
                  <td>{{ order.orderNo }}</td>
                  <td>{{ order.buyer?.name || order.buyer?.username }}</td>
                  <td>{{ order.product?.name }}</td>
                  <td>{{ order.quantity }}斤</td>
                  <td>¥{{ order.totalPrice }}</td>
                  <td><span :class="'status-' + order.status">{{ order.status }}</span></td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewOrder(order)">查看详情</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              v-if="orders.length > 0 && orderSubTab === 'all'"
              :current-page="pagination.orders.page"
              :page-size="pagination.orders.pageSize"
              :total="pagination.orders.total"
              @page-change="handleOrderPageChange"
            />
          </div>

          <!-- 购物订单售后管理 -->
          <div v-if="orderSubTab === 'aftersale'">
            <div v-if="afterSaleOrders.length === 0" class="empty-state">暂无待处理的售后申请</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>买家</th>
                  <th>商品</th>
                  <th>申请时间</th>
                  <th>售后类型</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in afterSaleOrders" :key="order.id">
                  <td>{{ order.orderNo }}</td>
                  <td>{{ order.buyer?.name || order.buyer?.username }}</td>
                  <td>{{ order.product?.name }}</td>
                  <td>{{ formatDate(order.returnRequestedAt) }}</td>
                  <td>{{ order.returnType }}</td>
                  <td><span :class="'status-' + order.returnStatus">{{ order.returnStatus }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewAfterSaleOrder(order)">查看详情</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 投标订单管理 -->
        <div v-if="activeTab === 'bids'" class="tab-content">
          <h2>投标订单管理</h2>
          <div class="tab-switch">
            <button :class="{ active: bidSubTab === 'all' }" @click="bidSubTab = 'all'">投标订单信息大全</button>
            <button :class="{ active: bidSubTab === 'results' }" @click="bidSubTab = 'results'; loadBidResults()">投标结果处理</button>
          </div>

          <!-- 投标订单信息大全 -->
          <div v-if="bidSubTab === 'all'">
            <!-- 加载状态 -->
            <div v-if="bidLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>
            <!-- 无数据状态 -->
            <div v-else-if="bids.length === 0" class="empty-state">
              <div class="empty-icon">📋</div>
              <p>暂无投标记录</p>
            </div>
            <template v-else>
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>投标单号</th>
                    <th>投标人</th>
                    <th>投标项目</th>
                    <th>投标价格</th>
                    <th>投标时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bid in paginatedBids" :key="bid.id">
                    <td>{{ bid.id }}</td>
                    <td>{{ bid.bidder?.name || bid.bidder?.username }}</td>
                    <td>{{ bid.project?.name }}</td>
                    <td>¥{{ bid.amount }}</td>
                    <td>{{ formatDate(bid.bidDate) }}</td>
                    <td>
                      <span v-if="bid.status === '已接受'" class="status-tag status-accepted">已接受</span>
                      <span v-else-if="bid.status === '已拒绝'" class="status-tag status-rejected">已拒绝</span>
                      <span v-else-if="bid.status === '已撤回'" class="status-tag status-cancelled">已撤回</span>
                      <span v-else class="status-tag status-pending">待处理</span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary" @click="viewBid(bid)">查看详情</button>
                      <template v-if="bid.status === '待处理'">
                        <button class="btn btn-sm btn-success" @click="handleAcceptBid(bid)">接受</button>
                        <button class="btn btn-sm btn-danger" @click="handleRejectBid(bid)">拒绝</button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
              <PaginationPro
                :current-page="bidPagination.page"
                :page-size="bidPagination.size"
                :total="bidPagination.total"
                :loading="bidLoading"
                :page-size-options="[5, 10, 20, 50]"
                @page-change="handleBidPageChangePro"
                @size-change="handleBidSizeChange"
              />
            </template>
          </div>

          <!-- 投标结果处理 -->
          <div v-if="bidSubTab === 'results'">
            <div v-if="pendingBidProjects.length === 0" class="empty-state">暂无待处理的招标项目</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>招标方</th>
                  <th>截止时间</th>
                  <th>投标数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in pendingBidProjects" :key="project.id">
                  <td>{{ project.name }}</td>
                  <td>{{ project.owner?.name || project.owner?.username }}</td>
                  <td>{{ formatDate(project.bidEndTime) }}</td>
                  <td>{{ project.bidCount }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewBidProject(project)">查看详情</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 交易项目管理 -->
        <div v-if="activeTab === 'projects'" class="tab-content">
          <h2>交易项目管理</h2>
          <div class="tab-switch">
            <button :class="{ active: projectSubTab === 'all' }" @click="projectSubTab = 'all'">项目信息大全</button>
            <button :class="{ active: projectSubTab === 'pending' }" @click="projectSubTab = 'pending'; loadProjectApplications()">项目发布修改申请管理</button>
          </div>

          <!-- 项目信息大全 -->
          <div v-if="projectSubTab === 'all'">
            <!-- 筛选和搜索 -->
            <div class="filter-bar">
              <div class="filter-item">
                <label>项目类型：</label>
                <select v-model="projectFilters.type" @change="loadProjects">
                  <option value="">全部</option>
                  <option value="宅基地">宅基地</option>
                  <option value="厂房">厂房</option>
                  <option value="土地">土地</option>
                  <option value="林地">林地</option>
                  <option value="商铺">商铺</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="filter-item">
                <label>项目状态：</label>
                <select v-model="projectFilters.status" @change="loadProjects">
                  <option value="">全部</option>
                  <option value="交易中">交易中</option>
                  <option value="已完成">已完成</option>
                  <option value="已取消">已取消</option>
                </select>
              </div>
              <div class="filter-item">
                <label>搜索：</label>
                <input type="text" v-model="projectFilters.keyword" placeholder="项目名称/位置" @keyup.enter="loadProjects" />
              </div>
              <button class="btn btn-primary" @click="loadProjects">查询</button>
              <button class="btn btn-secondary" @click="resetProjectFilters">重置</button>
            </div>

            <!-- 项目列表 -->
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>项目名称</th>
                  <th>类型</th>
                  <th>发布者</th>
                  <th>价格</th>
                  <th>状态</th>
                  <th>投标截止</th>
                  <th>浏览/投标</th>
                  <th>发布时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in projects" :key="project.id">
                  <td>{{ project.id }}</td>
                  <td>{{ project.name }}</td>
                  <td>{{ project.type || '-' }}</td>
                  <td>{{ project.owner?.name || project.owner?.username || '-' }}</td>
                  <td>¥{{ project.price }}</td>
                  <td><span :class="'status-' + getProjectStatusClass(project)">{{ project.status }}</span></td>
                  <td>{{ formatDate(project.bidEndDate) || '无' }}</td>
                  <td>{{ project.viewCount || 0 }}/{{ project.bidCount || 0 }}</td>
                  <td>{{ formatDate(project.createdAt) }}</td>
                  <td>
                    <button class="btn btn-sm btn-secondary" @click="viewProject(project)">详情</button>
                    <button class="btn btn-sm btn-primary" @click="editProject(project)">修改</button>
                    <button class="btn btn-sm btn-warning" @click="toggleProjectStatus(project)">
                      {{ project.status === '交易中' ? '结束' : '重启' }}
                    </button>
                    <button class="btn btn-sm btn-danger" @click="deleteProject(project)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="projects.length === 0" class="empty-state">暂无项目数据</div>
            <Pagination
              v-if="projects.length > 0"
              :current-page="projectPagination.page"
              :page-size="projectPagination.size"
              :total="projectPagination.total"
              @page-change="handleProjectPageChange"
            />
          </div>

          <!-- 项目发布修改申请管理 -->
          <div v-if="projectSubTab === 'pending'">
            <!-- 申请筛选 -->
            <div class="filter-bar">
              <div class="filter-item">
                <label>申请类型：</label>
                <select v-model="projectAppFilters.type" @change="loadProjectApplications">
                  <option value="">全部</option>
                  <option value="publish">发布申请</option>
                  <option value="modify">修改申请</option>
                </select>
              </div>
              <div class="filter-item">
                <label>申请状态：</label>
                <select v-model="projectAppFilters.status" @change="loadProjectApplications">
                  <option value="">全部</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>
              <button class="btn btn-primary" @click="loadProjectApplications">查询</button>
              <button class="btn btn-secondary" @click="resetProjectAppFilters">重置</button>
            </div>

            <!-- 申请列表 -->
            <table class="admin-table">
              <thead>
                <tr>
                  <th>申请ID</th>
                  <th>申请人</th>
                  <th>申请类型</th>
                  <th>项目名称</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="app in projectApplications" :key="app.id">
                  <td>{{ app.id }}</td>
                  <td>{{ app.applicantName }}</td>
                  <td>{{ app.type === 'publish' ? '发布申请' : '修改申请' }}</td>
                  <td>{{ app.projectName }}</td>
                  <td>{{ formatDate(app.createdAt) }}</td>
                  <td>
                    <span :class="'status-' + app.status">
                      {{ app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已驳回' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewProjectApplication(app)">查看详情</button>
                    <button v-if="app.status === 'pending' && app.type === 'publish'" class="btn btn-sm btn-success" @click="handleApproveProjectAppDirect(app)">通过</button>
                    <button v-if="app.status === 'pending'" class="btn btn-sm btn-danger" @click="showRejectProjectModal(app)">拒绝</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="projectApplications.length === 0" class="empty-state">暂无项目申请</div>
          </div>
        </div>

        <!-- 账号设置 -->
        <div v-if="activeTab === 'settings'" class="tab-content">
          <h2>账号设置</h2>
          <div class="tab-switch">
            <button :class="{ active: settingsSubTab === 'profile' }" @click="settingsSubTab = 'profile'">管理员账号信息管理</button>
            <button :class="{ active: settingsSubTab === 'security' }" @click="settingsSubTab = 'security'">登录安全设置</button>
          </div>

          <!-- 管理员账号信息管理 -->
          <div v-if="settingsSubTab === 'profile'" class="settings-section">
            <div class="info-card">
              <div class="info-item">
                <label>用户名：</label>
                <span>{{ userStore.userInfo.username }}</span>
                <span class="info-hint">(不可修改)</span>
              </div>
              <div class="info-item">
                <label>昵称：</label>
                <input type="text" v-model="adminProfile.name" />
              </div>
              <div class="info-item">
                <label>绑定邮箱：</label>
                <input type="email" v-model="adminProfile.email" />
              </div>
              <div class="info-item">
                <label>绑定手机：</label>
                <input type="text" v-model="adminProfile.phone" />
              </div>
              <div class="info-actions">
                <button class="btn btn-primary" @click="updateAdminProfile">保存修改</button>
              </div>
            </div>
          </div>

          <!-- 登录安全设置 -->
          <div v-if="settingsSubTab === 'security'" class="settings-section">
            <div class="info-card">
              <h3>修改密码</h3>
              <div class="info-item">
                <label>原密码：</label>
                <input type="password" v-model="passwordForm.oldPassword" />
              </div>
              <div class="info-item">
                <label>新密码：</label>
                <input type="password" v-model="passwordForm.newPassword" />
              </div>
              <div class="info-item">
                <label>确认新密码：</label>
                <input type="password" v-model="passwordForm.confirmPassword" />
              </div>
              <div class="info-actions">
                <button class="btn btn-primary" @click="changePassword">保存修改</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 消息发布 -->
        <div v-if="activeTab === 'messages'" class="tab-content">
          <h2>消息发布</h2>
          <div class="tab-switch">
            <button :class="{ active: messageSubTab === 'send' }" @click="messageSubTab = 'send'">手动消息发布</button>
            <button :class="{ active: messageSubTab === 'history' }" @click="messageSubTab = 'history'; loadSentMessages()">已发送消息管理</button>
          </div>

          <!-- 手动消息发布 -->
          <div v-if="messageSubTab === 'send'" class="settings-section">
            <div class="info-card">
              <div class="info-item">
                <label>接收对象类型：</label>
                <select v-model="messageForm.receiverType">
                  <option value="all_users">全体用户</option>
                  <option value="all_merchants">全体商户</option>
                  <option value="specific_user">指定用户</option>
                  <option value="specific_merchant">指定商户</option>
                </select>
              </div>
              <div class="info-item" v-if="messageForm.receiverType === 'specific_user' || messageForm.receiverType === 'specific_merchant'">
                <label>接收者账号：</label>
                <input type="text" v-model="messageForm.receiverName" placeholder="多个账号用逗号分隔" />
              </div>
              <div class="info-item">
                <label>消息标题：</label>
                <input type="text" v-model="messageForm.title" />
              </div>
              <div class="info-item">
                <label>消息内容：</label>
                <textarea v-model="messageForm.content" rows="5"></textarea>
              </div>
              <div class="info-actions">
                <button class="btn btn-secondary" @click="previewMessage">预览</button>
                <button class="btn btn-primary" @click="sendMessage">发送</button>
                <button class="btn btn-secondary" @click="clearMessageForm">取消</button>
              </div>
            </div>
          </div>

          <!-- 已发送消息管理 -->
          <div v-if="messageSubTab === 'history'">
            <div v-if="sentMessages.length === 0" class="empty-state">暂无已发送的消息</div>
            <table v-else class="admin-table">
              <thead>
                <tr>
                  <th>接收者</th>
                  <th>消息标题</th>
                  <th>消息内容</th>
                  <th>发送时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="msg in sentMessages" :key="msg.id">
                  <td>{{ msg.receiverName || msg.receiverTypeText }}</td>
                  <td>{{ msg.title }}</td>
                  <td>{{ msg.content.substring(0, 30) }}{{ msg.content.length > 30 ? '...' : '' }}</td>
                  <td>{{ formatDate(msg.createdAt) }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="viewMessageDetail(msg)">查看详情</button>
                    <button class="btn btn-sm btn-danger" @click="deleteSentMessage(msg)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 通用详情弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body" v-html="modalContent"></div>
        <div class="modal-footer" v-if="modalActions.length">
          <button v-for="action in modalActions" :key="action.label"
            :class="['btn', 'btn-' + action.type]" @click="action.handler">
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 农产品发布拒绝弹窗 -->
    <div v-if="showProductRejectModal" class="modal-overlay" @click="showProductRejectModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>拒绝农产品发布申请</h3>
          <button class="modal-close" @click="showProductRejectModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>请选择拒绝原因：</p>
          <div class="form-group">
            <select v-model="productRejectReason" class="form-control">
              <option value="">请选择...</option>
              <option value="信息不完整">信息不完整</option>
              <option value="价格不合理">价格不合理</option>
              <option value="违反平台规则">违反平台规则</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div v-if="productRejectReason === '其他'" class="form-group">
            <label>请填写详细原因：</label>
            <textarea v-model="productRejectDetail" class="form-control" rows="3" placeholder="请输入详细拒绝原因"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProductRejectModal = false">取消</button>
          <button class="btn btn-danger" @click="confirmRejectProductApplication" :disabled="!productRejectReason || (productRejectReason === '其他' && !productRejectDetail)">确认拒绝</button>
        </div>
      </div>
    </div>

    <!-- 项目发布拒绝弹窗 -->
    <div v-if="showProjectRejectModal" class="modal-overlay" @click="showProjectRejectModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>拒绝项目发布申请</h3>
          <button class="modal-close" @click="showProjectRejectModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>请选择拒绝原因：</p>
          <div class="form-group">
            <select v-model="projectRejectReason" class="form-control">
              <option value="">请选择...</option>
              <option value="信息不完整">信息不完整</option>
              <option value="价格不合理">价格不合理</option>
              <option value="违反平台规则">违反平台规则</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div v-if="projectRejectReason === '其他'" class="form-group">
            <label>请填写详细原因：</label>
            <textarea v-model="projectRejectDetail" class="form-control" rows="3" placeholder="请输入详细拒绝原因"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProjectRejectModal = false">取消</button>
          <button class="btn btn-danger" @click="confirmRejectProjectApplication" :disabled="!projectRejectReason || (projectRejectReason === '其他' && !projectRejectDetail)">确认拒绝</button>
        </div>
      </div>
    </div>

    <!-- 编辑用户弹窗 -->
    <div v-if="editingUser" class="modal-overlay" @click="editingUser = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>修改用户信息</h3>
          <button class="modal-close" @click="editingUser = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名：</label>
            <input type="text" v-model="editingUser.username" disabled />
          </div>
          <div class="form-group">
            <label>姓名：</label>
            <input type="text" v-model="editingUser.name" />
          </div>
          <div class="form-group">
            <label>电话：</label>
            <input type="text" v-model="editingUser.phone" />
          </div>
          <div class="form-group">
            <label>邮箱：</label>
            <input type="email" v-model="editingUser.email" />
          </div>
          <div class="form-group">
            <label>账户类型：</label>
            <select v-model="editingUser.accountType">
              <option value="buyer">买家</option>
              <option value="merchant">商户</option>
            </select>
          </div>
          <div class="form-group">
            <label>状态：</label>
            <select v-model="editingUser.isActive">
              <option :value="true">正常</option>
              <option :value="false">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editingUser = null">取消</button>
          <button class="btn btn-primary" @click="saveUser">保存</button>
        </div>
      </div>
    </div>

    <!-- 编辑农产品弹窗 -->
    <div v-if="editingProduct" class="modal-overlay" @click="editingProduct = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>修改农产品信息</h3>
          <button class="modal-close" @click="editingProduct = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称：</label>
            <input type="text" v-model="editingProduct.name" />
          </div>
          <div class="form-group">
            <label>价格：</label>
            <input type="number" v-model="editingProduct.price" />
          </div>
          <div class="form-group">
            <label>库存：</label>
            <input type="number" v-model="editingProduct.stock" />
          </div>
          <div class="form-group">
            <label>描述：</label>
            <textarea v-model="editingProduct.description" rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editingProduct = null">取消</button>
          <button class="btn btn-primary" @click="saveProduct">保存</button>
        </div>
      </div>
    </div>

    <!-- 物流信息弹窗 -->
    <div v-if="shippingOrder" class="modal-overlay" @click="shippingOrder = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>标记发货 - {{ shippingOrder.orderNo }}</h3>
          <button class="modal-close" @click="shippingOrder = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>物流公司：</label>
            <input type="text" v-model="logisticsForm.company" />
          </div>
          <div class="form-group">
            <label>运单号：</label>
            <input type="text" v-model="logisticsForm.trackingNumber" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="shippingOrder = null">取消</button>
          <button class="btn btn-primary" @click="confirmShipping">确认发货</button>
        </div>
      </div>
    </div>

    <!-- 编辑项目弹窗 -->
    <div v-if="editingProject" class="modal-overlay" @click="editingProject = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>修改项目信息</h3>
          <button class="modal-close" @click="editingProject = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>项目名称：</label>
            <input type="text" v-model="projectEditForm.name" />
          </div>
          <div class="form-group">
            <label>项目类型：</label>
            <select v-model="projectEditForm.type">
              <option value="">请选择</option>
              <option value="宅基地">宅基地</option>
              <option value="厂房">厂房</option>
              <option value="土地">土地</option>
              <option value="林地">林地</option>
              <option value="商铺">商铺</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格：</label>
            <input type="number" v-model="projectEditForm.price" />
          </div>
          <div class="form-group">
            <label>位置：</label>
            <input type="text" v-model="projectEditForm.location" />
          </div>
          <div class="form-group">
            <label>面积：</label>
            <input type="text" v-model="projectEditForm.area" placeholder="如：200平方米" />
          </div>
          <div class="form-group">
            <label>联系人：</label>
            <input type="text" v-model="projectEditForm.contactPerson" />
          </div>
          <div class="form-group">
            <label>联系方式：</label>
            <input type="text" v-model="projectEditForm.contactInfo" />
          </div>
          <div class="form-group">
            <label>投标截止日期：</label>
            <input type="date" v-model="projectEditForm.bidEndDate" />
          </div>
          <div class="form-group">
            <label>项目描述：</label>
            <textarea v-model="projectEditForm.description" rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editingProject = null">取消</button>
          <button class="btn btn-primary" @click="saveProjectEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 用户修改申请详情弹窗 -->
    <div v-if="viewingUpdateRequest" class="modal-overlay" @click="viewingUpdateRequest = null">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>用户修改申请详情</h3>
          <button class="modal-close" @click="viewingUpdateRequest = null">×</button>
        </div>
        <div class="modal-body">
          <div class="request-info">
            <div class="info-row">
              <span class="info-label">申请ID：</span>
              <span class="info-value">{{ viewingUpdateRequest.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">用户名：</span>
              <span class="info-value">{{ viewingUpdateRequest.username }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">用户类型：</span>
              <span class="info-value">{{ viewingUpdateRequest.userType === 'buyer' ? '买家' : '商户' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">申请时间：</span>
              <span class="info-value">{{ formatDate(viewingUpdateRequest.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前状态：</span>
              <span class="info-value">
                <span :class="'status-badge status-' + viewingUpdateRequest.status">
                  {{ viewingUpdateRequest.status === 'pending' ? '待审核' : viewingUpdateRequest.status === 'approved' ? '已通过' : '已驳回' }}
                </span>
              </span>
            </div>
          </div>

          <div class="data-comparison">
            <h4>数据变更对比</h4>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>原值</th>
                  <th>新值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in viewingUpdateRequest.changedFields" :key="field">
                  <td>{{ getFieldName(field) }}</td>
                  <td class="old-value">{{ viewingUpdateRequest.originalData[field] || '-' }}</td>
                  <td class="new-value">{{ viewingUpdateRequest.requestedData[field] || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="viewingUpdateRequest.status !== 'pending'" class="review-info">
            <h4>审核信息</h4>
            <div class="info-row">
              <span class="info-label">审核时间：</span>
              <span class="info-value">{{ formatDate(viewingUpdateRequest.reviewedAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">审核备注：</span>
              <span class="info-value">{{ viewingUpdateRequest.reviewComment || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="viewingUpdateRequest = null">关闭</button>
          <template v-if="viewingUpdateRequest.status === 'pending'">
            <button class="btn btn-success" @click="approveUpdateRequest(viewingUpdateRequest); viewingUpdateRequest = null">通过</button>
            <button class="btn btn-danger" @click="rejectUpdateRequest(viewingUpdateRequest); viewingUpdateRequest = null">驳回</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 农产品修改申请详情弹窗 -->
    <div v-if="viewingProductUpdateRequest" class="modal-overlay" @click="viewingProductUpdateRequest = null">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>农产品修改申请详情</h3>
          <button class="modal-close" @click="viewingProductUpdateRequest = null">×</button>
        </div>
        <div class="modal-body">
          <div class="request-info">
            <div class="info-row">
              <span class="info-label">申请ID：</span>
              <span class="info-value">{{ viewingProductUpdateRequest.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">商户名称：</span>
              <span class="info-value">{{ viewingProductUpdateRequest.merchantName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">产品名称：</span>
              <span class="info-value">{{ viewingProductUpdateRequest.product?.name || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">申请时间：</span>
              <span class="info-value">{{ formatDate(viewingProductUpdateRequest.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前状态：</span>
              <span class="info-value">
                <span :class="'status-badge status-' + viewingProductUpdateRequest.status">
                  {{ viewingProductUpdateRequest.status === 'pending' ? '待审核' : viewingProductUpdateRequest.status === 'approved' ? '已通过' : '已驳回' }}
                </span>
              </span>
            </div>
          </div>

          <div class="data-comparison">
            <h4>数据变更对比</h4>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>原值</th>
                  <th>新值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in viewingProductUpdateRequest.changedFields" :key="field">
                  <td>{{ getProductFieldName(field) }}</td>
                  <td class="old-value">{{ viewingProductUpdateRequest.originalData[field] || '-' }}</td>
                  <td class="new-value" style="color: #4CAF50; font-weight: bold;">{{ viewingProductUpdateRequest.requestedData[field] || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="viewingProductUpdateRequest.status !== 'pending'" class="review-info">
            <h4>审核信息</h4>
            <div class="info-row">
              <span class="info-label">审核时间：</span>
              <span class="info-value">{{ formatDate(viewingProductUpdateRequest.reviewedAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">审核备注：</span>
              <span class="info-value">{{ viewingProductUpdateRequest.reviewComment || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="viewingProductUpdateRequest = null">关闭</button>
          <template v-if="viewingProductUpdateRequest && viewingProductUpdateRequest.status === 'pending'">
            <button class="btn btn-success" @click="handleApproveProductUpdate">通过</button>
            <button class="btn btn-danger" @click="handleRejectProductUpdate">驳回</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 项目申请详情弹窗 -->
    <div v-if="viewingProjectApp" class="modal-overlay" @click="viewingProjectApp = null">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>项目申请详情</h3>
          <button class="modal-close" @click="viewingProjectApp = null">×</button>
        </div>
        <div class="modal-body">
          <div class="request-info">
            <div class="info-row">
              <span class="info-label">申请ID：</span>
              <span class="info-value">{{ viewingProjectApp.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">申请人：</span>
              <span class="info-value">{{ viewingProjectApp.applicantName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">申请类型：</span>
              <span class="info-value">{{ viewingProjectApp.type === 'publish' ? '发布申请' : '修改申请' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">项目名称：</span>
              <span class="info-value">{{ viewingProjectApp.projectName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">申请时间：</span>
              <span class="info-value">{{ formatDate(viewingProjectApp.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前状态：</span>
              <span class="info-value">
                <span :class="'status-badge status-' + viewingProjectApp.status">
                  {{ viewingProjectApp.status === 'pending' ? '待审核' : viewingProjectApp.status === 'approved' ? '已通过' : '已驳回' }}
                </span>
              </span>
            </div>
          </div>

          <div class="data-comparison" v-if="viewingProjectApp.type === 'modify' && viewingProjectApp.changedFields && viewingProjectApp.changedFields.length > 0">
            <h4>数据变更对比</h4>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>原值</th>
                  <th>新值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in viewingProjectApp.changedFields" :key="field">
                  <td>{{ getProjectFieldName(field) }}</td>
                  <td class="old-value">{{ viewingProjectApp.originalData?.[field] || '-' }}</td>
                  <td class="new-value" style="color: #4CAF50; font-weight: bold;">{{ viewingProjectApp.requestedData?.[field] || viewingProjectApp.content?.[field] || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="app-content-section">
            <h4>申请内容</h4>
            <pre class="app-content">{{ JSON.stringify(viewingProjectApp.content, null, 2) }}</pre>
          </div>

          <div v-if="viewingProjectApp.status !== 'pending'" class="review-info">
            <h4>审核信息</h4>
            <div class="info-row">
              <span class="info-label">审核时间：</span>
              <span class="info-value">{{ formatDate(viewingProjectApp.reviewedAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">审核备注：</span>
              <span class="info-value">{{ viewingProjectApp.reviewComment || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="viewingProjectApp = null">关闭</button>
          <template v-if="viewingProjectApp && viewingProjectApp.status === 'pending'">
            <button class="btn btn-success" @click="handleApproveProjectApp">通过</button>
            <button class="btn btn-danger" @click="handleRejectProjectApp">驳回</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useUserStore } from '../store/modules/user'
import { useRouter } from 'vue-router'
import { apiService } from '../utils/api'
import Pagination from '../components/Pagination.vue'
import PaginationPro from '../components/PaginationPro.vue'

const userStore = useUserStore()
const router = useRouter()

const activeTab = ref('users')
const userSubTab = ref('all')
const productSubTab = ref('all')
const orderSubTab = ref('all')
const bidSubTab = ref('all')
const projectSubTab = ref('all')
const settingsSubTab = ref('profile')
const messageSubTab = ref('send')

const users = ref([])
const products = ref([])
const orders = ref([])
const bids = ref([])
const bidLoading = ref(false)

// 项目管理数据
const projects = ref([])
const projectApplications = ref([])
const projectFilters = ref({
  type: '',
  status: '',
  keyword: ''
})
const productAppFilters = ref({
  status: ''
})
const projectAppFilters = ref({
  type: '',
  status: ''
})
const projectPagination = ref({
  page: 1,
  size: 10,
  total: 0,
  totalPages: 0
})
const editingProject = ref(null)
const viewingProjectApp = ref(null)

// 投标订单分页配置
const bidPagination = ref({
  page: 1,
  size: 10,
  total: 0,
  totalPages: 0
})

// 其他分页配置
const pagination = ref({
  users: { page: 1, pageSize: 10, total: 0 },
  products: { page: 1, pageSize: 10, total: 0 },
  orders: { page: 1, pageSize: 10, total: 0 },
  productUpdates: { page: 1, pageSize: 10, total: 0 }
})
const userUpdateRequests = ref([])
const productApplications = ref([])
const productUpdateRequests = ref([])
const afterSaleOrders = ref([])
const pendingBidProjects = ref([])
const sentMessages = ref([])

// 农产品修改申请筛选和分页
const productUpdateFilters = ref({
  status: ''
})
const viewingProductUpdateRequest = ref(null)
const productUpdateRejectReason = ref('')

const showModal = ref(false)
const modalTitle = ref('')
const modalContent = ref('')
const modalActions = ref([])

const showProductRejectModal = ref(false)
const productRejectApp = ref(null)
const productRejectReason = ref('')
const productRejectDetail = ref('')

const showProjectRejectModal = ref(false)
const projectRejectApp = ref(null)
const projectRejectReason = ref('')
const projectRejectDetail = ref('')

const editingUser = ref(null)
const editingProduct = ref(null)
const shippingOrder = ref(null)
const viewingUpdateRequest = ref(null)

// 用户修改申请筛选和分页
const updateRequestFilters = ref({
  userType: '',
  status: ''
})
const updateRequestPagination = ref({
  page: 1,
  size: 10,
  total: 0
})

// 待审核申请数量
const pendingUpdateRequestCount = computed(() => {
  return userUpdateRequests.value.filter(r => r.status === 'pending').length
})

// 项目编辑表单
const projectEditForm = ref({
  name: '',
  type: '',
  description: '',
  price: 0,
  location: '',
  area: '',
  contactPerson: '',
  contactInfo: '',
  bidEndDate: ''
})

const adminProfile = ref({
  name: '',
  email: '',
  phone: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const messageForm = ref({
  receiverType: 'all_users',
  receiverName: '',
  title: '',
  content: ''
})

const logisticsForm = ref({
  company: '',
  trackingNumber: ''
})

onMounted(() => {
  if (!userStore.isAdmin) {
    router.push('/')
    return
  }
  loadUsers()
  loadProducts()
  loadOrders()
  loadBids(1, 10)  // 使用分页加载
  loadProjects()   // 加载项目列表
  initAdminProfile()
})

function initAdminProfile() {
  adminProfile.value = {
    name: userStore.userInfo.name || '',
    email: userStore.userInfo.email || '',
    phone: userStore.userInfo.phone || ''
  }
}

async function loadUsers() {
  try {
    const res = await apiService.get('/users')
    if (res.data && res.data.success) {
      users.value = res.data.data.users || []
      pagination.value.users.total = res.data.data.pagination?.total || users.value.length
    }
  } catch (error) {
    console.error('加载用户失败:', error)
  }
}

async function loadProducts() {
  try {
    const res = await apiService.get('/products')
    if (res.data && res.data.success) {
      products.value = res.data.data.products || []
      pagination.value.products.total = res.data.data.pagination?.total || products.value.length
    }
  } catch (error) {
    console.error('加载农产品失败:', error)
  }
}

async function loadOrders() {
  try {
    const res = await apiService.get('/orders')
    if (res.data && res.data.success) {
      orders.value = res.data.data.orders || []
      pagination.value.orders.total = res.data.data.pagination?.total || orders.value.length
    }
  } catch (error) {
    console.error('加载订单失败:', error)
  }
}

async function loadBids(page = 1, size = 10) {
  bidLoading.value = true
  try {
    const res = await apiService.get(`/bids?page=${page}&size=${size}`)
    if (res.data && res.data.success) {
      bids.value = res.data.data.bids || []
      // 更新分页信息
      if (res.data.data.pagination) {
        bidPagination.value = {
          page: res.data.data.pagination.page,
          size: res.data.data.pagination.size,
          total: res.data.data.pagination.total,
          totalPages: res.data.data.pagination.totalPages
        }
      }
    }
  } catch (error) {
    console.error('加载投标失败:', error)
  } finally {
    bidLoading.value = false
  }
}

// 投标订单分页方法
async function handleBidPageChangePro(page) {
  bidPagination.value.page = page
  await loadBids(page, bidPagination.value.size)
}

async function handleBidSizeChange(size) {
  bidPagination.value.size = size
  bidPagination.value.page = 1
  await loadBids(1, size)
}

async function loadProductApplications() {
  try {
    const params = {}
    if (productAppFilters.value.status) params.status = productAppFilters.value.status

    const res = await apiService.get('/product-publish-requests', params)
    if (res.data && res.data.success) {
      productApplications.value = res.data.data.requests || []
    }
  } catch (error) {
    console.error('加载农产品发布申请失败:', error)
    productApplications.value = []
  }
}

async function loadAfterSaleOrders() {
  afterSaleOrders.value = orders.value.filter(o => o.returnRequested)
}

async function loadBidResults() {
  pendingBidProjects.value = []
}

// 项目管理方法
async function loadProjects() {
  try {
    const params = {
      page: projectPagination.value.page,
      limit: projectPagination.value.size,
      includeExpired: 'true'
    }
    if (projectFilters.value.type) params.type = projectFilters.value.type
    if (projectFilters.value.status) params.status = projectFilters.value.status
    if (projectFilters.value.keyword) params.keyword = projectFilters.value.keyword

    const res = await apiService.get('/projects', params)
    if (res.data && res.data.success) {
      projects.value = res.data.data.projects || []
      if (res.data.data.pagination) {
        projectPagination.value = {
          page: res.data.data.pagination.page,
          size: res.data.data.pagination.limit,
          total: res.data.data.pagination.total,
          totalPages: res.data.data.pagination.totalPages
        }
      }
    }
  } catch (error) {
    console.error('加载项目失败:', error)
  }
}

async function loadProjectApplications() {
  try {
    const params = {}
    if (projectAppFilters.value.type) params.type = projectAppFilters.value.type
    if (projectAppFilters.value.status) params.status = projectAppFilters.value.status

    const res = await apiService.get('/project-applications', params)
    if (res.data && res.data.success) {
      projectApplications.value = res.data.data.applications || []
    }
  } catch (error) {
    console.error('加载项目申请失败:', error)
    // 如果API不存在，使用模拟数据
    projectApplications.value = []
  }
}

// 用户修改申请相关方法
async function loadUserUpdateRequests() {
  try {
    const params = {
      page: updateRequestPagination.value.page,
      limit: updateRequestPagination.value.size
    }
    if (updateRequestFilters.value.userType) params.userType = updateRequestFilters.value.userType
    if (updateRequestFilters.value.status) params.status = updateRequestFilters.value.status

    const res = await apiService.get('/user-update-requests', params)
    if (res.data && res.data.success) {
      userUpdateRequests.value = res.data.data.requests || []
      updateRequestPagination.value.total = res.data.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('加载用户修改申请失败:', error)
    userUpdateRequests.value = []
  }
}

function resetUpdateRequestFilters() {
  updateRequestFilters.value = {
    userType: '',
    status: ''
  }
  updateRequestPagination.value.page = 1
  loadUserUpdateRequests()
}

function handleUpdateRequestPageChange(page) {
  updateRequestPagination.value.page = page
  loadUserUpdateRequests()
}

function viewUpdateRequest(request) {
  viewingUpdateRequest.value = request
}

function getChangedFieldsText(fields) {
  if (!fields || fields.length === 0) return '-'
  const fieldNames = {
    name: '姓名',
    realName: '真实姓名',
    idCard: '身份证号',
    phone: '电话',
    email: '邮箱',
    address: '地址',
    businessLicense: '营业执照编号',
    businessScope: '经营范围',
    companyPhone: '企业联系电话',
    companyAddress: '企业地址'
  }
  return fields.map(f => fieldNames[f] || f).join('、')
}

function getFieldName(field) {
  const fieldNames = {
    name: '姓名',
    realName: '真实姓名',
    idCard: '身份证号',
    phone: '电话',
    email: '邮箱',
    address: '地址',
    businessLicense: '营业执照编号',
    businessScope: '经营范围',
    companyPhone: '企业联系电话',
    companyAddress: '企业地址'
  }
  return fieldNames[field] || field
}

async function approveUpdateRequest(request) {
  try {
    const res = await apiService.put(`/user-update-requests/${request.id}/approve`)
    if (res.data && res.data.success) {
      alert('申请已通过')
      loadUserUpdateRequests()
    }
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.error?.message || error.message))
  }
}

async function rejectUpdateRequest(request) {
  const comment = prompt('请输入驳回原因（必填）：')
  if (!comment) {
    alert('请输入驳回原因')
    return
  }
  try {
    const res = await apiService.put(`/user-update-requests/${request.id}/reject`, { comment })
    if (res.data && res.data.success) {
      alert('申请已驳回')
      loadUserUpdateRequests()
    }
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.error?.message || error.message))
  }
}

// 农产品修改申请相关方法
async function loadProductUpdateRequests() {
  try {
    const params = {
      page: pagination.value.productUpdates.page,
      limit: pagination.value.productUpdates.pageSize
    }
    if (productUpdateFilters.value.status) params.status = productUpdateFilters.value.status

    const res = await apiService.get('/product-update-requests', params)
    if (res.data && res.data.success) {
      productUpdateRequests.value = res.data.data.requests || []
      pagination.value.productUpdates.total = res.data.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('加载农产品修改申请失败:', error)
    productUpdateRequests.value = []
  }
}

function resetProductUpdateFilters() {
  productUpdateFilters.value = {
    status: ''
  }
  pagination.value.productUpdates.page = 1
  loadProductUpdateRequests()
}

function handleProductUpdatePageChange(page) {
  pagination.value.productUpdates.page = page
  loadProductUpdateRequests()
}

function viewProductUpdateRequest(request) {
  viewingProductUpdateRequest.value = request
}

function getProductChangedFieldsText(fields) {
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
}

function getProductFieldName(field) {
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
  return fieldNames[field] || field
}

function handleApproveProductUpdate() {
  console.log('[DEBUG] handleApproveProductUpdate called')
  console.log('[DEBUG] viewingProductUpdateRequest:', viewingProductUpdateRequest.value)
  if (!viewingProductUpdateRequest.value) {
    alert('请求数据不存在')
    return
  }
  approveProductUpdateRequest(viewingProductUpdateRequest.value)
}

function handleRejectProductUpdate() {
  console.log('[DEBUG] handleRejectProductUpdate called')
  if (!viewingProductUpdateRequest.value) {
    alert('请求数据不存在')
    return
  }
  rejectProductUpdateRequest(viewingProductUpdateRequest.value)
}

async function approveProductUpdateRequest(request) {
  console.log('[DEBUG] approveProductUpdateRequest called:', request)
  console.log('[DEBUG] request.id:', request?.id)
  console.log('[DEBUG] request.id type:', typeof request?.id)
  
  if (!request || !request.id) {
    alert('请求数据无效')
    return
  }
  
  const confirmed = confirm('确定要通过该农产品修改申请吗？')
  console.log('[DEBUG] Confirm result:', confirmed)
  if (!confirmed) {
    return
  }
  
  try {
    const url = `/product-update-requests/${request.id}/approve`
    console.log('[DEBUG] Sending PUT request to:', url)
    const res = await apiService.put(url)
    console.log('[DEBUG] Response:', res)
    if (res.data && res.data.success) {
      alert('申请已通过，农产品信息已更新')
      viewingProductUpdateRequest.value = null
      loadProductUpdateRequests()
    }
  } catch (error) {
    console.error('[DEBUG] Error:', error)
    alert('操作失败: ' + (error.message || '未知错误'))
  }
}

async function rejectProductUpdateRequest(request) {
  const comment = prompt('请输入驳回原因（必填）：')
  if (!comment) {
    alert('请输入驳回原因')
    return
  }
  if (!confirm('确定要驳回该农产品修改申请吗？')) {
    return
  }
  try {
    const res = await apiService.put(`/product-update-requests/${request.id}/reject`, { comment })
    if (res.data && res.data.success) {
      alert('申请已驳回')
      viewingProductUpdateRequest.value = null
      loadProductUpdateRequests()
    }
  } catch (error) {
    alert('操作失败: ' + (error.response?.data?.error?.message || error.message))
  }
}

function resetProjectFilters() {
  projectFilters.value = {
    type: '',
    status: '',
    keyword: ''
  }
  loadProjects()
}

function resetProjectAppFilters() {
  projectAppFilters.value = {
    type: '',
    status: ''
  }
  loadProjectApplications()
}

async function handleProjectPageChange(page) {
  projectPagination.value.page = page
  await loadProjects()
}

function getProjectStatusClass(project) {
  if (!project) return 'unknown'
  const now = new Date()
  const endDate = project.bidEndDate ? new Date(project.bidEndDate) : null
  if (endDate && now > endDate) return 'expired'
  switch (project.status) {
    case '交易中': return 'active'
    case '已完成': return 'completed'
    case '已取消': return 'cancelled'
    default: return 'unknown'
  }
}

function viewProject(project) {
  modalTitle.value = '项目详情'
  modalContent.value = `
    <div class="project-detail-modal">
      <p><strong>项目ID：</strong>${project.id}</p>
      <p><strong>项目名称：</strong>${project.name}</p>
      <p><strong>项目类型：</strong>${project.type || '未分类'}</p>
      <p><strong>发布者：</strong>${project.owner?.name || project.owner?.username || '未知'}</p>
      <p><strong>价格：</strong>¥${project.price}</p>
      <p><strong>位置：</strong>${project.location || '未填写'}</p>
      <p><strong>面积：</strong>${project.area || '未填写'}</p>
      <p><strong>联系人：</strong>${project.contactPerson || '未填写'}</p>
      <p><strong>联系方式：</strong>${project.contactInfo || '未填写'}</p>
      <p><strong>项目状态：</strong>${project.status}</p>
      <p><strong>浏览次数：</strong>${project.viewCount || 0}</p>
      <p><strong>投标人数：</strong>${project.bidCount || 0}</p>
      <p><strong>投标截止：</strong>${formatDate(project.bidEndDate) || '无'}</p>
      <p><strong>发布时间：</strong>${formatDate(project.createdAt)}</p>
      <p><strong>项目描述：</strong></p>
      <p class="description">${project.description || '暂无描述'}</p>
    </div>
  `
  modalActions.value = []
  showModal.value = true
}

function editProject(project) {
  editingProject.value = { ...project }
  projectEditForm.value = {
    name: project.name,
    type: project.type || '',
    description: project.description || '',
    price: project.price,
    location: project.location || '',
    area: project.area || '',
    contactPerson: project.contactPerson || '',
    contactInfo: project.contactInfo || '',
    bidEndDate: project.bidEndDate ? project.bidEndDate.split('T')[0] : ''
  }
}

async function saveProjectEdit() {
  if (!editingProject.value) return
  try {
    const res = await apiService.put(`/projects/${editingProject.value.id}`, projectEditForm.value)
    if (res.data && res.data.success) {
      alert('项目信息修改成功')
      editingProject.value = null
      loadProjects()
    }
  } catch (error) {
    alert('修改失败: ' + error.message)
  }
}

async function toggleProjectStatus(project) {
  const newStatus = project.status === '交易中' ? '已完成' : '交易中'
  try {
    const res = await apiService.put(`/projects/${project.id}`, { status: newStatus })
    if (res.data && res.data.success) {
      alert(`项目${newStatus === '已完成' ? '已结束' : '已重启'}`)
      loadProjects()
    }
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

async function deleteProject(project) {
  if (!confirm(`确定要删除项目"${project.name}"吗？此操作不可恢复！`)) return
  try {
    const res = await apiService.delete(`/projects/${project.id}`)
    if (res.data && res.data.success) {
      alert('项目删除成功')
      loadProjects()
    }
  } catch (error) {
    alert('删除失败: ' + error.message)
  }
}

function viewProjectApplication(app) {
  viewingProjectApp.value = app
}

async function handleApproveProjectApp() {
  if (!viewingProjectApp.value) return
  if (!confirm('确定要通过该项目申请吗？')) return
  try {
    const res = await apiService.put(`/project-applications/${viewingProjectApp.value.id}/approve`)
    if (res.data && res.data.success) {
      alert('申请已通过')
      viewingProjectApp.value = null
      loadProjectApplications()
      loadProjects()
    }
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

async function handleApproveProjectAppDirect(app) {
  if (!confirm('确定要通过该项目发布申请吗？')) return
  try {
    const res = await apiService.put(`/project-applications/${app.id}/approve`)
    if (res.data && res.data.success) {
      alert('申请已通过，项目已成功发布')
      loadProjectApplications()
      loadProjects()
    }
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

async function handleRejectProjectApp() {
  if (!viewingProjectApp.value) return
  const comment = prompt('请输入驳回原因（必填）：')
  if (!comment) {
    alert('请输入驳回原因')
    return
  }
  try {
    const res = await apiService.put(`/project-applications/${viewingProjectApp.value.id}/reject`, { comment })
    if (res.data && res.data.success) {
      alert('申请已驳回')
      viewingProjectApp.value = null
      loadProjectApplications()
      loadProjects()
    }
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

function getProjectFieldName(field) {
  const fieldNames = {
    name: '项目名称',
    type: '项目类型',
    price: '价格',
    location: '位置',
    area: '面积',
    description: '项目描述',
    contactPerson: '联系人',
    contactInfo: '联系方式',
    bidEndDate: '投标截止日期'
  }
  return fieldNames[field] || field
}

async function approveProjectApp(app) {
  const comment = prompt('请输入审核意见（可选）：')
  if (comment === null) return
  try {
    const res = await apiService.put(`/project-applications/${app.id}/approve`, { comment })
    if (res.data && res.data.success) {
      alert('申请已通过')
      loadProjectApplications()
      loadProjects()
    }
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

async function rejectProjectApp(app) {
  const comment = prompt('请输入驳回原因（必填）：')
  if (!comment) {
    alert('请输入驳回原因')
    return
  }
  try {
    const res = await apiService.put(`/project-applications/${app.id}/reject`, { comment })
    if (res.data && res.data.success) {
      alert('申请已驳回')
      loadProjectApplications()
      loadProjects()
    }
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

async function loadSentMessages() {
  try {
    const res = await apiService.get('/messages/sent')
    if (res.data && res.data.success) {
      sentMessages.value = res.data.data.messages || []
    }
  } catch (error) {
    console.error('加载已发送消息失败:', error)
  }
}

function editUser(user) {
  editingUser.value = { ...user }
}

async function saveUser() {
  try {
    const res = await apiService.put(`/users/${editingUser.value.id}`, editingUser.value)
    if (res.data && res.data.success) {
      alert('用户信息修改成功')
      editingUser.value = null
      loadUsers()
    }
  } catch (error) {
    alert('修改失败: ' + error.message)
  }
}

function viewProduct(product) {
  modalTitle.value = '农产品详情'
  modalContent.value = `
    <p><strong>名称：</strong>${product.name}</p>
    <p><strong>价格：</strong>¥${product.price}</p>
    <p><strong>库存：</strong>${product.stock}${product.unit || '斤'}</p>
    <p><strong>描述：</strong>${product.description || '无'}</p>
    <p><strong>发布者：</strong>${product.seller?.name || product.seller?.username}</p>
    <p><strong>状态：</strong>${product.status}</p>
  `
  modalActions.value = []
  showModal.value = true
}

function editProduct(product) {
  editingProduct.value = { ...product }
}

async function saveProduct() {
  try {
    const res = await apiService.put(`/products/${editingProduct.value.id}`, editingProduct.value)
    if (res.data && res.data.success) {
      alert('农产品信息修改成功')
      editingProduct.value = null
      loadProducts()
    }
  } catch (error) {
    alert('修改失败: ' + error.message)
  }
}

async function toggleProductStatus(product) {
  const newStatus = product.status === '已上架' ? '已下架' : '已上架'
  try {
    const res = await apiService.put(`/products/${product.id}`, { status: newStatus })
    if (res.data && res.data.success) {
      alert(`农产品${newStatus === '已上架' ? '上架' : '下架'}成功`)
      loadProducts()
    }
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

function viewOrder(order) {
  const isPendingShip = order.status === '待发货'
  modalTitle.value = '订单详情'
  modalContent.value = `
    <p><strong>订单号：</strong>${order.orderNo}</p>
    <p><strong>买家：</strong>${order.buyer?.name || order.buyer?.username}</p>
    <p><strong>商品：</strong>${order.product?.name}</p>
    <p><strong>数量：</strong>${order.quantity}斤</p>
    <p><strong>金额：</strong>¥${order.totalPrice}</p>
    <p><strong>状态：</strong>${order.status}</p>
    <p><strong>收货地址：</strong>${order.shippingAddress || '无'}</p>
    <p><strong>联系电话：</strong>${order.contactPhone || '无'}</p>
    ${order.logisticsCompany ? `<p><strong>物流公司：</strong>${order.logisticsCompany}</p>` : ''}
    ${order.trackingNumber ? `<p><strong>运单号：</strong>${order.trackingNumber}</p>` : ''}
  `
  modalActions.value = []
  if (isPendingShip) {
    modalActions.value.push({
      label: '标记发货',
      type: 'primary',
      handler: () => {
        showModal.value = false
        shippingOrder.value = order
      }
    })
  }
  if (order.status === '待收货') {
    modalActions.value.push({
      label: '确认收货',
      type: 'primary',
      handler: async () => {
        try {
          await apiService.put(`/orders/${order.id}/status`, { status: '已完成' })
          alert('已确认收货')
          showModal.value = false
          loadOrders()
        } catch (error) {
          alert('操作失败: ' + error.message)
        }
      }
    })
  }
  showModal.value = true
}

async function confirmShipping() {
  try {
    await apiService.put(`/orders/${shippingOrder.value.id}/status`, {
      status: '待收货',
      logisticsCompany: logisticsForm.value.company,
      trackingNumber: logisticsForm.value.trackingNumber
    })
    alert('发货成功')
    shippingOrder.value = null
    logisticsForm.value = { company: '', trackingNumber: '' }
    loadOrders()
  } catch (error) {
    alert('发货失败: ' + error.message)
  }
}

function viewAfterSaleOrder(order) {
  modalTitle.value = '售后详情'
  modalContent.value = `
    <p><strong>订单号：</strong>${order.orderNo}</p>
    <p><strong>买家：</strong>${order.buyer?.name || order.buyer?.username}</p>
    <p><strong>商品：</strong>${order.product?.name}</p>
    <p><strong>退货数量：</strong>${order.returnQuantity || 0}斤</p>
    <p><strong>退货原因：</strong>${order.returnReason || '无'}</p>
  `
  modalActions.value = [
    {
      label: '同意',
      type: 'primary',
      handler: async () => {
        try {
          await apiService.put(`/orders/${order.id}/return`, { approved: true })
          alert('已同意退货申请')
          showModal.value = false
          loadOrders()
        } catch (error) {
          alert('操作失败: ' + error.message)
        }
      }
    },
    {
      label: '拒绝',
      type: 'danger',
      handler: () => {
        const reason = prompt('请输入拒绝原因:')
        if (reason) {
          apiService.put(`/orders/${order.id}/return`, { approved: false, reason }).then(() => {
            alert('已拒绝退货申请')
            showModal.value = false
            loadOrders()
          })
        }
      }
    }
  ]
  showModal.value = true
}

function viewBid(bid) {
  modalTitle.value = '投标详情'
  modalContent.value = `
    <p><strong>投标单号：</strong>${bid.id}</p>
    <p><strong>投标人：</strong>${bid.bidder?.name || bid.bidder?.username}</p>
    <p><strong>联系电话：</strong>${bid.bidder?.phone || '-'}</p>
    <p><strong>投标项目：</strong>${bid.project?.name}</p>
    <p><strong>项目描述：</strong>${bid.project?.description || '无'}</p>
    <p><strong>投标金额：</strong>¥${bid.amount}</p>
    <p><strong>联系人：</strong>${bid.contact}</p>
    <p><strong>联系电话：</strong>${bid.phone}</p>
    <p><strong>投标时间：</strong>${formatDate(bid.bidDate)}</p>
    <p><strong>状态：</strong>${bid.status}</p>
    <p><strong>拒绝原因：</strong>${bid.rejectReason || '无'}</p>
  `
  modalActions.value = []
  if (bid.status === '待处理') {
    modalActions.value = [
      {
        label: '接受',
        type: 'primary',
        handler: () => {
          showModal.value = false
          handleAcceptBid(bid)
        }
      },
      {
        label: '拒绝',
        type: 'danger',
        handler: () => {
          showModal.value = false
          handleRejectBid(bid)
        }
      }
    ]
  }
  showModal.value = true
}

// 处理接受投标
async function handleAcceptBid(bid) {
  // 显示确认面板
  modalTitle.value = '确认接受投标'
  modalContent.value = `
    <div style="max-height: 400px; overflow-y: auto;">
      <h4 style="color: #333; margin-bottom: 15px;">请确认以下投标信息：</h4>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <p><strong>投标单号：</strong>${bid.id}</p>
        <p><strong>投标人：</strong>${bid.bidder?.name || bid.bidder?.username}</p>
        <p><strong>联系电话：</strong>${bid.bidder?.phone || '-'}</p>
        <p><strong>投标项目：</strong>${bid.project?.name}</p>
        <p><strong>项目位置：</strong>${bid.project?.location || '-'}</p>
        <p><strong>项目面积：</strong>${bid.project?.area || '-'}</p>
        <p><strong>投标金额：</strong><span style="color: #e74c3c; font-size: 18px; font-weight: bold;">¥${bid.amount}</span></p>
        <p><strong>联系人：</strong>${bid.contact}</p>
        <p><strong>联系电话：</strong>${bid.phone}</p>
        <p><strong>投标时间：</strong>${formatDate(bid.bidDate)}</p>
      </div>
      <div style="background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404;"><strong>提示：</strong>接受此投标后，系统将自动：</p>
        <ul style="margin: 5px 0; color: #856404; padding-left: 20px;">
          <li>拒绝该项目下的所有其他投标</li>
          <li>向投标成功的用户发送通知消息</li>
          <li>向其他投标人发送未中标通知</li>
        </ul>
      </div>
    </div>
  `
  modalActions.value = [
    {
      label: '确定接受',
      type: 'primary',
      handler: async () => {
        try {
          showModal.value = false
          // 显示加载提示
          const loadingDiv = document.createElement('div')
          loadingDiv.id = 'bid-loading'
          loadingDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;'
          loadingDiv.innerHTML = '<div style="background: white; padding: 30px; border-radius: 8px; text-align: center;"><div style="margin-bottom: 15px;">⏳</div><div>正在处理中...</div></div>'
          document.body.appendChild(loadingDiv)

          const res = await apiService.put(`/bids/${bid.id}/accept`)

          // 移除加载提示
          const loadingEl = document.getElementById('bid-loading')
          if (loadingEl) loadingEl.remove()

          alert(res.message || '已接受投标')
          loadBids()
        } catch (error) {
          // 移除加载提示
          const loadingEl = document.getElementById('bid-loading')
          if (loadingEl) loadingEl.remove()

          alert('操作失败: ' + (error.message || '未知错误'))
        }
      }
    },
    {
      label: '取消',
      type: 'secondary',
      handler: () => {
        showModal.value = false
      }
    }
  ]
  showModal.value = true
}

// 处理拒绝投标
async function handleRejectBid(bid) {
  const reason = prompt('请输入拒绝原因（可选）：')
  if (reason === null) return // 用户点击取消

  try {
    // 显示加载提示
    const loadingDiv = document.createElement('div')
    loadingDiv.id = 'bid-loading'
    loadingDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;'
    loadingDiv.innerHTML = '<div style="background: white; padding: 30px; border-radius: 8px; text-align: center;"><div style="margin-bottom: 15px;">⏳</div><div>正在处理中...</div></div>'
    document.body.appendChild(loadingDiv)

    const res = await apiService.put(`/bids/${bid.id}/reject`, { reason: reason || undefined })

    // 移除加载提示
    const loadingEl = document.getElementById('bid-loading')
    if (loadingEl) loadingEl.remove()

    alert(res.message || '已拒绝投标')
    loadBids()
  } catch (error) {
    // 移除加载提示
    const loadingEl = document.getElementById('bid-loading')
    if (loadingEl) loadingEl.remove()

    alert('操作失败: ' + (error.message || '未知错误'))
  }
}

function viewBidProject(project) {
  modalTitle.value = '招标项目详情'
  const bidsForProject = bids.value.filter(b => b.projectId === project.id)
  let bidsHtml = bidsForProject.length ? bidsForProject.map(b => `
    <p>投标人: ${b.bidder?.name || b.bidder?.username} - ¥${b.price}</p>
  `).join('') : '<p>暂无投标</p>'

  modalContent.value = `
    <p><strong>项目名称：</strong>${project.name}</p>
    <p><strong>招标方：</strong>${project.owner?.name || project.owner?.username}</p>
    <p><strong>预算：</strong>¥${project.budget}</p>
    <p><strong>投标：</strong></p>
    ${bidsHtml}
  `
  modalActions.value = []
  if (bidsForProject.length > 0) {
    modalActions.value.push({
      label: '确认中标',
      type: 'primary',
      handler: () => selectWinner(project, bidsForProject[0])
    })
  }
  modalActions.value.push({
    label: '流标处理',
    type: 'warning',
    handler: () => handleBidFail(project)
  })
  showModal.value = true
}

async function selectWinner(project, winningBid) {
  try {
    await apiService.put(`/projects/${project.id}/bid-result`, { winningBidId: winningBid.id })
    alert('已确认中标')
    showModal.value = false
    loadBidResults()
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

async function handleBidFail(project) {
  try {
    await apiService.put(`/projects/${project.id}/bid-result`, { failed: true })
    alert('已标记为流标')
    showModal.value = false
    loadBidResults()
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

async function updateAdminProfile() {
  try {
    await apiService.put(`/users/${userStore.userInfo.id}`, adminProfile.value)
    alert('修改成功')
    userStore.fetchCurrentUser()
  } catch (error) {
    alert('修改失败: ' + error.message)
  }
}

async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('两次输入的新密码不一致')
    return
  }
  try {
    await apiService.post('/auth/change-password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    alert('密码修改成功，请重新登录')
    userStore.logout()
    router.push('/')
  } catch (error) {
    alert('修改失败: ' + error.message)
  }
}

async function sendMessage() {
  if (!messageForm.value.title || !messageForm.value.content) {
    alert('请填写标题和内容')
    return
  }
  try {
    await apiService.post('/messages', messageForm.value)
    alert('消息发送成功')
    clearMessageForm()
  } catch (error) {
    alert('发送失败: ' + error.message)
  }
}

function previewMessage() {
  modalTitle.value = '消息预览'
  modalContent.value = `
    <p><strong>接收者：</strong>${getReceiverText(messageForm.value.receiverType)}</p>
    <p><strong>标题：</strong>${messageForm.value.title}</p>
    <p><strong>内容：</strong></p>
    <p>${messageForm.value.content}</p>
  `
  modalActions.value = []
  showModal.value = true
}

function getReceiverText(type) {
  const map = {
    all_users: '全体用户',
    all_merchants: '全体商户',
    specific_user: `用户: ${messageForm.value.receiverName}`,
    specific_merchant: `商户: ${messageForm.value.receiverName}`
  }
  return map[type] || type
}

function clearMessageForm() {
  messageForm.value = {
    receiverType: 'all_users',
    receiverName: '',
    title: '',
    content: ''
  }
}

function viewMessageDetail(msg) {
  modalTitle.value = '消息详情'
  modalContent.value = `
    <p><strong>接收者：</strong>${msg.receiverName || msg.receiverTypeText}</p>
    <p><strong>标题：</strong>${msg.title}</p>
    <p><strong>内容：</strong></p>
    <p>${msg.content}</p>
    <p><strong>发送时间：</strong>${formatDate(msg.createdAt)}</p>
  `
  modalActions.value = []
  showModal.value = true
}

async function deleteSentMessage(msg) {
  if (!confirm('确定要删除这条消息吗？')) return
  try {
    await apiService.delete(`/messages/sent/${msg.id}`)
    alert('消息已删除')
    loadSentMessages()
  } catch (error) {
    alert('删除失败: ' + error.message)
  }
}

function viewUserUpdateRequest(req) {
  modalTitle.value = '用户信息修改申请'
  modalContent.value = `
    <p><strong>申请人：</strong>${req.applicantName}</p>
    <p><strong>申请时间：</strong>${formatDate(req.createdAt)}</p>
    <p><strong>修改内容：</strong></p>
    <p>${req.updateDetails}</p>
  `
  modalActions.value = [
    {
      label: '同意',
      type: 'primary',
      handler: () => approveUserUpdate(req)
    },
    {
      label: '拒绝',
      type: 'danger',
      handler: () => rejectUserUpdate(req)
    }
  ]
  showModal.value = true
}

async function approveUserUpdate(req) {
  alert('已同意修改申请')
  showModal.value = false
  loadUserUpdateRequests()
}

async function rejectUserUpdate(req) {
  alert('已拒绝修改申请')
  showModal.value = false
  loadUserUpdateRequests()
}

function viewProductApplication(app) {
  const productData = app.productData || {}
  modalTitle.value = '农产品发布申请'
  modalContent.value = `
    <p><strong>商户名称：</strong>${app.merchantName}</p>
    <p><strong>农产品名称：</strong>${app.productName}</p>
    <p><strong>价格：</strong>¥${productData.price || 0}</p>
    <p><strong>库存：</strong>${productData.stock || 0}</p>
    <p><strong>产地：</strong>${productData.origin || '无'}</p>
    <p><strong>分类：</strong>${productData.category || '无'}</p>
    <p><strong>发货时间：</strong>${productData.shippingTime || '24小时内发货'}</p>
    <p><strong>描述：</strong>${productData.description || '无'}</p>
    <p><strong>申请时间：</strong>${formatDate(app.createdAt)}</p>
    <p><strong>状态：</strong>${app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已驳回'}</p>
    ${app.status === 'rejected' ? `<p><strong>拒绝原因：</strong>${app.rejectionReason === '其他' ? app.rejectionDetail : app.rejectionReason || '无'}</p>` : ''}
  `
  modalActions.value = [
    {
      label: '同意发布',
      type: 'primary',
      handler: () => approveProductApplication(app)
    },
    {
      label: '拒绝',
      type: 'danger',
      handler: () => showRejectProductModal(app)
    }
  ]
  showModal.value = true
}

async function approveProductApplication(app) {
  try {
    const res = await apiService.put(`/product-publish-requests/${app.id}/approve`)
    if (res.data && res.data.success) {
      alert('已通过发布申请，农产品已成功发布')
      showModal.value = false
      loadProductApplications()
    } else {
      alert(res.data?.message || '操作失败')
    }
  } catch (error) {
    console.error('批准农产品发布申请失败:', error)
    alert(error.response?.data?.message || '操作失败')
  }
}

function showRejectProductModal(app) {
  showModal.value = false
  productRejectApp.value = app
  productRejectReason.value = ''
  productRejectDetail.value = ''
  showProductRejectModal.value = true
}

async function confirmRejectProductApplication() {
  if (!productRejectReason.value) {
    alert('请选择拒绝原因')
    return
  }
  if (productRejectReason.value === '其他' && !productRejectDetail.value.trim()) {
    alert('请填写详细的拒绝原因')
    return
  }

  try {
    const res = await apiService.put(`/product-publish-requests/${productRejectApp.value.id}/reject`, {
      rejectionReason: productRejectReason.value,
      rejectionDetail: productRejectDetail.value
    })
    if (res.data && res.data.success) {
      alert('已拒绝发布申请')
      showProductRejectModal.value = false
      loadProductApplications()
    } else {
      alert(res.data?.message || '操作失败')
    }
  } catch (error) {
    console.error('拒绝农产品发布申请失败:', error)
    alert(error.response?.data?.message || '操作失败')
  }
}

function showRejectProjectModal(app) {
  showModal.value = false
  projectRejectApp.value = app
  projectRejectReason.value = ''
  projectRejectDetail.value = ''
  showProjectRejectModal.value = true
}

async function confirmRejectProjectApplication() {
  if (!projectRejectReason.value) {
    alert('请选择拒绝原因')
    return
  }
  if (projectRejectReason.value === '其他' && !projectRejectDetail.value.trim()) {
    alert('请填写详细的拒绝原因')
    return
  }

  try {
    const res = await apiService.put(`/project-applications/${projectRejectApp.value.id}/reject`, {
      rejectionReason: projectRejectReason.value,
      rejectionDetail: projectRejectDetail.value
    })
    if (res.data && res.data.success) {
      alert('已拒绝发布申请')
      showProjectRejectModal.value = false
      loadProjectApplications()
    } else {
      alert(res.data?.message || '操作失败')
    }
  } catch (error) {
    console.error('拒绝项目发布申请失败:', error)
    alert(error.response?.data?.message || '操作失败')
  }
}

function resetProductAppFilters() {
  productAppFilters.value.status = ''
  loadProductApplications()
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

function logout() {
  userStore.logout()
  router.push('/')
}

// 分页方法
function handleUserPageChange(page) {
  pagination.value.users.page = page
}

function handleProductPageChange(page) {
  pagination.value.products.page = page
}

function handleOrderPageChange(page) {
  pagination.value.orders.page = page
}



// 分页后的数据
const paginatedUsers = computed(() => {
  const { page, pageSize } = pagination.value.users
  const start = (page - 1) * pageSize
  return users.value.slice(start, start + pageSize)
})

const paginatedProducts = computed(() => {
  const { page, pageSize } = pagination.value.products
  const start = (page - 1) * pageSize
  return products.value.slice(start, start + pageSize)
})

const paginatedOrders = computed(() => {
  const { page, pageSize } = pagination.value.orders
  const start = (page - 1) * pageSize
  return orders.value.slice(start, start + pageSize)
})

// 投标订单直接使用后端分页数据，无需前端分页
const paginatedBids = computed(() => {
  return bids.value
})

// 监听数据变化更新分页总数
watch(users, (val) => {
  pagination.value.users.total = val.length
}, { immediate: true })

watch(products, (val) => {
  pagination.value.products.total = val.length
}, { immediate: true })

watch(orders, (val) => {
  pagination.value.orders.total = val.length
}, { immediate: true })
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: #fff;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.admin-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.admin-content {
  display: flex;
  min-height: calc(100vh - 80px);
}

.admin-sidebar {
  width: 250px;
  background: #fff;
  padding: 20px 0;
}

.admin-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.admin-menu li {
  padding: 15px 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  transition: all 0.3s;
}

.admin-menu li:hover {
  background: #f5f5f5;
  color: #333;
}

.admin-menu li.active {
  background: #4CAF50;
  color: #fff;
}

.menu-icon {
  font-size: 18px;
}

.admin-main {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.tab-content h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

.tab-switch {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.tab-switch button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  border-radius: 4px;
}

.tab-switch button:hover {
  background: #f5f5f5;
}

.tab-switch button.active {
  background: #4CAF50;
  color: #fff;
}

.admin-table {
  width: 100%;
  background: #fff;
  border-collapse: collapse;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.admin-table th,
.admin-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.admin-table th {
  background: #fafafa;
  font-weight: 600;
  color: #333;
}

.admin-table tr:hover {
  background: #fafafa;
}

.status-active { color: #4CAF50; }
.status-inactive { color: #f44336; }
.status-已上架 { color: #4CAF50; }
.status-已下架 { color: #f44336; }
.status-待发货 { color: #FF9800; }
.status-待收货 { color: #2196F3; }
.status-已完成 { color: #4CAF50; }
.status-已支付 { color: #4CAF50; }
.status-待处理 { color: #FF9800; }
.status-审核中 { color: #FF9800; }
.status-已中标 { color: #4CAF50; }
.status-未中标 { color: #999; }

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-primary { background: #4CAF50; color: #fff; }
.btn-secondary { background: #9e9e9e; color: #fff; }
.btn-warning { background: #FF9800; color: #fff; }
.btn-danger { background: #f44336; color: #fff; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.settings-section {
  max-width: 600px;
}

.info-card {
  background: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info-item {
  margin-bottom: 20px;
}

.info-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.info-item input,
.info-item select,
.info-item textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.info-item input:disabled {
  background: #f5f5f5;
}

.info-hint {
  color: #999;
  font-size: 12px;
  margin-left: 10px;
}

.info-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: #999;
  background: #fff;
  border-radius: 8px;
}

/* 大弹窗样式 */
.modal-large {
  max-width: 800px;
  width: 90%;
}

/* 申请详情样式 */
.request-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #333;
  min-width: 100px;
}

.info-value {
  color: #666;
}

/* 数据对比表格 */
.data-comparison {
  margin-bottom: 20px;
}

.data-comparison h4 {
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 8px;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.comparison-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.old-value {
  color: #999;
  text-decoration: line-through;
}

.new-value {
  color: #4CAF50;
  font-weight: 500;
}

/* 审核信息 */
.review-info {
  background: #fff3e0;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.review-info h4 {
  margin-bottom: 10px;
  color: #e65100;
}

/* 状态标签 */
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

/* 侧边栏徽章 */
.badge {
  background-color: #f44336;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-large {
    width: 95%;
    margin: 10px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-label {
    min-width: auto;
    margin-bottom: 5px;
  }

  .comparison-table {
    font-size: 12px;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 8px;
  }
}
</style>
