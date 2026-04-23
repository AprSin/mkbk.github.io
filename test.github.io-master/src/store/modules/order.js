import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orderAPI } from '../../utils/orderAPI'
import { bidAPI } from '../../utils/bidAPI'

export const useOrderStore = defineStore('order', () => {
  // 不再从 localStorage 初始化，避免数据不一致
  const shoppingOrders = ref([])
  const bidOrders = ref([])
  const apiEnabled = ref(true)  // 默认启用API模式
  const lastSyncTime = ref(null)

  // 投标订单分页状态
  const bidPagination = ref({
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
    loading: false
  })

  function saveShoppingOrders() {
    // 不再保存到 localStorage，避免数据不一致
    // 数据始终从服务器获取
  }

  function saveBidOrders() {
    // 不再保存到 localStorage，避免数据不一致
    // 数据始终从服务器获取
  }

  async function syncOrdersFromServer() {
    try {
      const result = await orderAPI.getOrders()
      if (result.orders) {
        shoppingOrders.value = result.orders.map(o => ({
          id: o.orderNo || String(o.id),
          serverId: o.id,
          productId: o.productId,
          productName: o.product?.name || '未知商品',
          product: o.product,
          quantity: o.quantity,
          totalPrice: parseFloat(o.totalPrice),
          buyerId: o.buyerId,
          buyerName: o.buyer?.username || o.buyerName || '未知买家',
          buyer: o.buyer,
          merchantId: o.merchantId,
          merchantName: o.merchant?.name || o.merchant?.username || o.merchantName || '未知商户',
          merchant: o.merchant,
          orderDate: o.createdAt,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paidAt: o.paidAt,
          shippedAt: o.shippedAt,
          deliveredAt: o.deliveredAt,
          completedAt: o.completedAt,
          autoConfirmed: o.autoConfirmed,
          logisticsStatus: o.logisticsStatus,
          returnStatus: o.returnStatus,
          returnType: o.returnType,
          returnReason: o.returnReason,
          returnQuantity: o.returnQuantity,
          returnRefundMethod: o.returnRefundMethod,
          returnImages: o.returnImages,
          returnLogisticsCompany: o.returnLogisticsCompany,
          returnLogisticsNumber: o.returnLogisticsNumber,
          returnShipped: o.returnShipped,
          returnShippedAt: o.returnShippedAt,
          returnRequestedAt: o.returnRequestedAt,
          returnApproved: o.returnApproved,
          returnApprovedAt: o.returnApprovedAt,
          returnRejected: o.returnRejected,
          returnRejectedAt: o.returnRejectedAt,
          statusBeforeReturn: o.statusBeforeReturn,
          logisticsCompany: o.logisticsCompany,
          trackingNumber: o.trackingNumber,
          remark: o.remark
        }))
        apiEnabled.value = true
        lastSyncTime.value = Date.now()
        saveShoppingOrders()
      }
      return result
    } catch (error) {
      console.warn('Failed to sync orders from server:', error.message)
      apiEnabled.value = false
      return null
    }
  }

  async function syncBidsFromServer() {
    try {
      const result = await bidAPI.getBids()
      if (result.bids) {
        // 过滤掉项目不存在的情况（project为null）
        bidOrders.value = result.bids
          .filter(b => b.project !== null)
          .map(b => ({
            id: b.id,
            projectId: b.projectId,
            projectName: b.project?.name || '未知项目',
            merchantName: b.project?.owner?.name || b.project?.owner?.username || '未知商户',
            buyerName: b.bidder?.username || b.bidderName || '未知买家',
            amount: parseFloat(b.amount),
            contact: b.contact,
            phone: b.phone,
            bidDate: b.bidDate || b.createdAt,
            status: b.status,
            description: b.description,
            rejectReason: b.rejectReason,
            projectDescription: b.project?.description,
            projectLocation: b.project?.location,
            projectArea: b.project?.area,
            projectPrice: parseFloat(b.project?.price) || null,
            serverId: b.id,
            // UI 状态属性
            processing: false,
            processingType: null
          }))
        apiEnabled.value = true
        lastSyncTime.value = Date.now()
        saveBidOrders()
      }
      return result
    } catch (error) {
      console.warn('Failed to sync bids from server:', error.message)
      apiEnabled.value = false
      return null
    }
  }

  // 分页加载投标订单
  async function loadBidsWithPagination(page = 1, size = 10) {
    bidPagination.value.loading = true
    try {
      const result = await bidAPI.getBids({ page, size })
      console.log('loadBidsWithPagination result:', result)
      
      // 确保 bids 是数组
      const bids = Array.isArray(result.bids) ? result.bids : []
      
      bidOrders.value = bids
        .filter(b => b.project !== null)
        .map(b => ({
          id: b.id,
          projectId: b.projectId,
          projectName: b.project?.name || '未知项目',
          merchantName: b.project?.owner?.name || b.project?.owner?.username || '未知商户',
          buyerName: b.bidder?.username || b.bidderName || '未知买家',
          amount: parseFloat(b.amount),
          contact: b.contact,
          phone: b.phone,
          bidDate: b.bidDate || b.createdAt,
          status: b.status,
          description: b.description,
          rejectReason: b.rejectReason,
          projectDescription: b.project?.description,
          projectLocation: b.project?.location,
          projectArea: b.project?.area,
          projectPrice: parseFloat(b.project?.price) || null,
          serverId: b.id,
          processing: false,
          processingType: null
        }))
      
      // 更新分页信息
      if (result.pagination) {
        bidPagination.value = {
          page: result.pagination.page || page,
          size: result.pagination.size || size,
          total: result.pagination.total || 0,
          totalPages: result.pagination.totalPages || 0,
          loading: false
        }
      } else {
        // 如果没有分页信息，使用默认值
        bidPagination.value = {
          page: page,
          size: size,
          total: bids.length,
          totalPages: Math.ceil(bids.length / size),
          loading: false
        }
      }
      
      apiEnabled.value = true
      lastSyncTime.value = Date.now()
      saveBidOrders()
      
      return result
    } catch (error) {
      console.warn('Failed to load bids with pagination:', error.message)
      bidPagination.value.loading = false
      apiEnabled.value = false
      return null
    }
  }

  // 更新分页参数
  function setBidPagination(page, size) {
    bidPagination.value.page = page
    if (size) {
      bidPagination.value.size = size
    }
  }

  async function addShoppingOrder(order) {
    console.log('[addShoppingOrder] apiEnabled:', apiEnabled.value)
    if (apiEnabled.value) {
      try {
        const items = [{ productId: order.productId, quantity: order.quantity }]
        console.log('[addShoppingOrder] 创建订单, items:', items)
        const result = await orderAPI.createOrder(items)
        console.log('[addShoppingOrder] 订单创建成功:', result)
        // 强制立即同步订单列表，确保新订单显示
        const syncResult = await syncOrdersFromServer()
        if (!syncResult) {
          console.warn('订单创建成功，但同步订单列表失败')
        }
        return { success: true, orders: result.orders, duration: result.duration }
      } catch (error) {
        console.error('创建订单失败:', error)
        return { success: false, error: error.message }
      }
    }
    // 离线模式：添加到本地
    console.log('[addShoppingOrder] 使用离线模式')
    shoppingOrders.value.push(order)
    saveShoppingOrders()
    return { success: true }
  }

  async function updateShoppingOrder(orderId, updates) {
    if (apiEnabled.value) {
      try {
        const order = shoppingOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          if (updates.status === '退单中') {
            await orderAPI.returnOrder(order.serverId, updates.returnReason || '用户申请退单')
          } else if (updates.status === '已完成' && order.status === '待收货') {
            await orderAPI.confirmOrder(order.serverId)
          }
        }
        await syncOrdersFromServer()
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
    const index = shoppingOrders.value.findIndex(o => o.id === orderId)
    if (index > -1) {
      shoppingOrders.value[index] = { ...shoppingOrders.value[index], ...updates }
      saveShoppingOrders()
    }
  }

  function getShoppingOrdersByUser(username) {
    return shoppingOrders.value.filter(o => o.buyerName === username)
  }

  function getShoppingOrdersByProduct(productId) {
    return shoppingOrders.value.filter(o => o.productId === productId)
  }

  async function addBidOrder(order) {
    if (apiEnabled.value) {
      try {
        const result = await bidAPI.createBid(
          order.projectId,
          order.amount,
          order.contact,
          order.phone
        )
        await syncBidsFromServer()
        return { success: true, bid: result.bid, duration: result.duration }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
    bidOrders.value.push(order)
    saveBidOrders()
    return { success: true }
  }

  async function updateBidOrder(orderId, updates) {
    if (apiEnabled.value) {
      try {
        const order = bidOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          if (updates.status === '已接受') {
            await bidAPI.acceptBid(order.serverId)
          } else if (updates.status === '已拒绝') {
            await bidAPI.rejectBid(order.serverId, updates.rejectReason || '不符合要求')
          }
        }
        await syncBidsFromServer()
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
    const index = bidOrders.value.findIndex(o => o.id === orderId)
    if (index > -1) {
      bidOrders.value[index] = { ...bidOrders.value[index], ...updates }
      saveBidOrders()
    }
  }

  function getBidOrdersByUser(username) {
    return bidOrders.value.filter(o => o.buyerName === username)
  }

  function getBidOrdersByProject(projectId) {
    return bidOrders.value.filter(o => o.projectId === projectId)
  }

  async function acceptBid(orderId) {
    if (apiEnabled.value) {
      try {
        const order = bidOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          await bidAPI.acceptBid(order.serverId)
        }
        await syncBidsFromServer()
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
    const order = bidOrders.value.find(o => o.id === orderId)
    if (order) {
      order.status = '已接受'
      order.acceptedAt = new Date().toISOString()
      saveBidOrders()
    }
    return { success: true }
  }

  async function rejectBid(orderId, reason) {
    if (apiEnabled.value) {
      try {
        const order = bidOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          await bidAPI.rejectBid(order.serverId, reason)
        }
        await syncBidsFromServer()
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
    const order = bidOrders.value.find(o => o.id === orderId)
    if (order) {
      order.status = '已拒绝'
      order.rejectReason = reason
      order.rejectedAt = new Date().toISOString()
      saveBidOrders()
    }
    return { success: true }
  }

  async function approveReturn(orderId) {
    if (apiEnabled.value) {
      try {
        const order = shoppingOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          await orderAPI.approveReturn(order.serverId)
        }
        await syncOrdersFromServer()
        return { success: true }
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message || '操作失败，请稍后重试'
        throw new Error(errorMsg)
      }
    }
    const order = shoppingOrders.value.find(o => o.id === orderId)
    if (order) {
      order.status = '已取消'
      order.returnApproved = true
      order.approvedAt = new Date().toISOString()
      saveShoppingOrders()
    }
    return { success: true }
  }

  async function rejectReturn(orderId, reason) {
    if (apiEnabled.value) {
      try {
        const order = shoppingOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          await orderAPI.rejectReturn(order.serverId, reason)
        }
        await syncOrdersFromServer()
        return { success: true }
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message || '操作失败，请稍后重试'
        throw new Error(errorMsg)
      }
    }
    const order = shoppingOrders.value.find(o => o.id === orderId)
    if (order) {
      order.returnRejected = true
      order.returnRejectReason = reason
      order.rejectedAt = new Date().toISOString()
      saveShoppingOrders()
    }
    return { success: true }
  }

  // 买家申请退货
  async function requestReturn(orderId, returnData) {
    if (apiEnabled.value) {
      try {
        const order = shoppingOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          await orderAPI.requestReturn(order.serverId, returnData)
        }
        await syncOrdersFromServer()
        return { success: true }
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message || '提交失败，请稍后重试'
        throw new Error(errorMsg)
      }
    }
    // 本地模式
    const order = shoppingOrders.value.find(o => o.id === orderId)
    if (order) {
      order.returnReason = returnData.reason
      order.returnQuantity = returnData.quantity
      order.returnStatus = '申请中'
      order.status = '退单中'
      order.returnRequested = true
      order.returnRefundMethod = returnData.refundMethod
      order.returnImages = returnData.images
      order.returnRequestedAt = new Date().toISOString()
      saveShoppingOrders()
    }
    return { success: true }
  }

  // 买家提交退货物流
  async function submitReturnLogistics(orderId, logisticsData) {
    if (apiEnabled.value) {
      try {
        const order = shoppingOrders.value.find(o => o.id === orderId)
        if (order && order.serverId) {
          await orderAPI.submitReturnLogistics(order.serverId, logisticsData)
        }
        await syncOrdersFromServer()
        return { success: true }
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message || '提交失败，请稍后重试'
        throw new Error(errorMsg)
      }
    }
    // 本地模式
    const order = shoppingOrders.value.find(o => o.id === orderId)
    if (order) {
      order.returnLogisticsCompany = logisticsData.logisticsCompany
      order.returnLogisticsNumber = logisticsData.logisticsNumber
      order.returnShipped = true
      order.returnShippedAt = new Date().toISOString()
      saveShoppingOrders()
    }
    return { success: true }
  }

  const merchantShoppingOrders = computed(() => {
    return shoppingOrders.value.filter(o => o.merchantName)
  })

  const merchantBidProjects = computed(() => {
    const grouped = {}
    bidOrders.value.forEach(order => {
      if (!grouped[order.projectId]) {
        grouped[order.projectId] = {
          projectId: order.projectId,
          projectName: order.projectName,
          merchantName: order.merchantName,
          orders: []
        }
      }
      grouped[order.projectId].orders.push(order)
    })
    return Object.values(grouped)
  })

  return {
    shoppingOrders,
    bidOrders,
    bidPagination,
    merchantShoppingOrders,
    merchantBidProjects,
    apiEnabled,
    lastSyncTime,
    syncOrdersFromServer,
    syncBidsFromServer,
    loadBidsWithPagination,
    setBidPagination,
    addShoppingOrder,
    updateShoppingOrder,
    getShoppingOrdersByUser,
    getShoppingOrdersByProduct,
    addBidOrder,
    updateBidOrder,
    getBidOrdersByUser,
    getBidOrdersByProject,
    acceptBid,
    rejectBid,
    approveReturn,
    rejectReturn,
    requestReturn,
    submitReturnLogistics
  }
})
