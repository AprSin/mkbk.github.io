import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productAPI } from '../../utils/productAPI'
import { projectAPI } from '../../utils/projectAPI'

export const useMarketStore = defineStore('market', () => {
  const projects = ref([])

  const products = ref([])

  const publishStatus = ref({
    show: false,
    type: '',
    message: '',
    success: false
  })

  const lastFetchTime = ref(null)
  const apiEnabled = ref(false)
  const merchantProjectsLoading = ref(false)
  const merchantProductsLoading = ref(false)
  const pendingRequests = new Map()

  function debounce(fn, delay) {
    let timer = null
    return function(...args) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => fn.apply(this, args), delay)
    }
  }

  async function fetchProductsFromAPI(skipDebounce = false) {
    const cacheKey = 'products'
    const cached = pendingRequests.get(cacheKey)
    if (cached && !skipDebounce) {
      return cached
    }

    const requestPromise = (async () => {
      try {
        const result = await productAPI.getProducts({ status: '在售' })
        if (result.products && result.products.length > 0) {
          products.value = result.products.map(p => ({
            id: p.id,
            name: p.name,
            merchantName: p.seller?.name || p.seller?.username || '平台自营',
            price: parseFloat(p.price),
            stock: p.stock,
            origin: p.origin,
            status: p.status,
            description: p.description,
            image: p.image,
            date: p.createdAt
          }))
          apiEnabled.value = true
          lastFetchTime.value = Date.now()
        }
        return result
      } catch (error) {
        console.warn('Failed to fetch products from API:', error.message)
        apiEnabled.value = false
        throw error
      } finally {
        pendingRequests.delete(cacheKey)
      }
    })()

    if (!skipDebounce) {
      pendingRequests.set(cacheKey, requestPromise)
      debouncedFetchProducts(requestPromise)
    }
    return requestPromise
  }

  const debouncedFetchProducts = debounce((promise) => promise, 300)

  async function fetchProjectsFromAPI(skipDebounce = false) {
    const cacheKey = 'projects'
    const cached = pendingRequests.get(cacheKey)
    if (cached && !skipDebounce) {
      return cached
    }

    const requestPromise = (async () => {
      try {
        const result = await projectAPI.getProjects({ status: '交易中' })
        if (result.projects && result.projects.length > 0) {
          projects.value = result.projects.map(p => ({
            id: p.id,
            name: p.name,
            merchantName: p.owner?.name || p.owner?.username || '未知商户',
            publishDate: p.createdAt,
            price: parseFloat(p.price),
            status: p.status,
            description: p.description,
            location: p.location,
            area: p.area,
            type: p.type,
            contactPerson: p.contactPerson,
            contactInfo: p.contactInfo,
            bidEndDate: p.bidEndDate,
            attachments: p.attachments || []
          }))
          apiEnabled.value = true
          lastFetchTime.value = Date.now()
        }
        return result
      } catch (error) {
        console.warn('Failed to fetch projects from API:', error.message)
        apiEnabled.value = false
        throw error
      } finally {
        pendingRequests.delete(cacheKey)
      }
    })()

    if (!skipDebounce) {
      pendingRequests.set(cacheKey, requestPromise)
      debouncedFetchProjects(requestPromise)
    }
    return requestPromise
  }

  const debouncedFetchProjects = debounce((promise) => promise, 300)

  async function addProject(project) {
    if (apiEnabled.value) {
      try {
        const result = await projectAPI.createProject(project)
        if (result.project) {
          projects.value.unshift({
            id: result.project.id,
            name: result.project.name,
            merchantName: result.project.owner?.name || '未知商户',
            publishDate: result.project.createdAt,
            price: parseFloat(result.project.price),
            status: result.project.status,
            description: result.project.description,
            location: result.project.location,
            area: result.project.area,
            type: result.project.type
          })
        }
        return { success: true, message: result.message }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
    try {
      projects.value.unshift(project)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function addProduct(product) {
    if (apiEnabled.value) {
      try {
        const result = await productAPI.createProduct(product)
        if (result.product) {
          products.value.unshift({
            id: result.product.id,
            name: result.product.name,
            merchantName: result.product.seller?.name || '未知商户',
            price: parseFloat(result.product.price),
            stock: result.product.stock,
            origin: result.product.origin,
            status: result.product.status,
            description: result.product.description,
            image: result.product.image,
            date: result.product.createdAt
          })
        }
        return { success: true, message: result.message }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
    try {
      products.value.unshift(product)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  function updateProject(projectId, updates) {
    const index = projects.value.findIndex(p => p.id === projectId)
    if (index > -1) {
      projects.value[index] = { ...projects.value[index], ...updates }
      return { success: true }
    }
    return { success: false, error: '项目不存在' }
  }

  function updateProduct(productId, updates) {
    const index = products.value.findIndex(p => p.id === productId)
    if (index > -1) {
      products.value[index] = { ...products.value[index], ...updates }
      return { success: true }
    }
    return { success: false, error: '农产品不存在' }
  }

  function deleteProject(projectId) {
    const index = projects.value.findIndex(p => p.id === projectId)
    if (index > -1) {
      projects.value.splice(index, 1)
      return { success: true }
    }
    return { success: false, error: '项目不存在' }
  }

  function deleteProduct(productId) {
    const index = products.value.findIndex(p => p.id === productId)
    if (index > -1) {
      products.value.splice(index, 1)
      return { success: true }
    }
    return { success: false, error: '农产品不存在' }
  }

  async function fetchMerchantProjects() {
    merchantProjectsLoading.value = true
    try {
      const result = await projectAPI.getMerchantProjects()
      if (result.projects) {
        merchantProjects.value = result.projects.map(p => ({
          id: p.id,
          name: p.name,
          merchantName: p.owner?.name || p.owner?.username || '未知商户',
          publishDate: p.createdAt,
          price: parseFloat(p.price),
          status: p.status,
          description: p.description,
          location: p.location,
          area: p.area,
          type: p.type,
          contactPerson: p.contactPerson,
          contactInfo: p.contactInfo,
          bidEndDate: p.bidEndDate,
          attachments: p.attachments || [],
          userId: p.userId
        }))
        apiEnabled.value = true
      }
      return result
    } catch (error) {
      console.error('Failed to fetch merchant projects:', error.message)
      return { success: false, error: error.message }
    } finally {
      merchantProjectsLoading.value = false
    }
  }

  async function fetchMerchantProducts() {
    merchantProductsLoading.value = true
    try {
      const result = await productAPI.getMerchantProducts()
      if (result.products) {
        merchantProducts.value = result.products.map(p => ({
          id: p.id,
          name: p.name,
          merchantName: p.seller?.name || p.seller?.username || '未知商户',
          price: parseFloat(p.price),
          stock: p.stock,
          origin: p.origin,
          category: p.category,
          status: p.status,
          description: p.description,
          image: p.image,
          date: p.createdAt,
          userId: p.userId
        }))
        apiEnabled.value = true
      }
      return result
    } catch (error) {
      console.error('Failed to fetch merchant products:', error.message)
      return { success: false, error: error.message }
    } finally {
      merchantProductsLoading.value = false
    }
  }

  async function addProject(project) {
    try {
      const result = await projectAPI.createProject(project)
      if (result.success && result.project) {
        merchantProjects.value.unshift({
          id: result.project.id,
          name: result.project.name,
          merchantName: result.project.owner?.name || result.project.owner?.username || '未知商户',
          publishDate: result.project.createdAt,
          price: parseFloat(result.project.price),
          status: result.project.status,
          description: result.project.description,
          location: result.project.location,
          area: result.project.area,
          type: result.project.type,
          contactPerson: result.project.contactPerson,
          contactInfo: result.project.contactInfo,
          bidEndDate: result.project.bidEndDate,
          attachments: result.project.attachments || [],
          userId: result.project.userId
        })
        return { success: true, message: result.message }
      }
      if (result.success) {
        return { success: true, message: result.message || '项目发布申请已提交，等待管理员审核' }
      }
      return { success: false, error: result.error || '创建项目失败' }
    } catch (error) {
      console.error('Failed to create project:', error.message)
      return { success: false, error: error.message }
    }
  }

  async function addProduct(product) {
    try {
      const result = await productAPI.createProduct(product)
      if (result.success && result.product) {
        merchantProducts.value.unshift({
          id: result.product.id,
          name: result.product.name,
          merchantName: result.product.seller?.name || '未知商户',
          price: parseFloat(result.product.price),
          stock: result.product.stock,
          origin: result.product.origin,
          category: result.product.category,
          status: result.product.status,
          description: result.product.description,
          image: result.product.image,
          date: result.product.createdAt,
          userId: result.product.userId
        })
        return { success: true, message: result.message }
      }
      if (result.success) {
        return { success: true, message: result.message || '农产品发布申请已提交，等待管理员审核' }
      }
      return { success: false, error: result.error || '创建农产品失败' }
    } catch (error) {
      console.error('Failed to create product:', error.message)
      return { success: false, error: error.message }
    }
  }

  async function deleteProject(projectId) {
    try {
      await projectAPI.deleteProject(projectId)
      const index = merchantProjects.value.findIndex(p => p.id === projectId)
      if (index > -1) {
        merchantProjects.value.splice(index, 1)
      }
      const idx = projects.value.findIndex(p => p.id === projectId)
      if (idx > -1) {
        projects.value.splice(idx, 1)
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to delete project:', error.message)
      return { success: false, error: error.message }
    }
  }

  async function deleteProduct(productId) {
    try {
      await productAPI.deleteProduct(productId)
      const index = merchantProducts.value.findIndex(p => p.id === productId)
      if (index > -1) {
        merchantProducts.value.splice(index, 1)
      }
      const idx = products.value.findIndex(p => p.id === productId)
      if (idx > -1) {
        projects.value.splice(idx, 1)
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to delete product:', error.message)
      return { success: false, error: error.message }
    }
  }

  function updateProject(projectId, updates) {
    const index = merchantProjects.value.findIndex(p => p.id === projectId)
    if (index > -1) {
      Object.assign(merchantProjects.value[index], updates)
    }
    const idx = projects.value.findIndex(p => p.id === projectId)
    if (idx > -1) {
      Object.assign(projects.value[idx], updates)
    }
    return { success: true }
  }

  function updateProduct(productId, updates) {
    const index = merchantProducts.value.findIndex(p => p.id === productId)
    if (index > -1) {
      Object.assign(merchantProducts.value[index], updates)
    }
    const idx = products.value.findIndex(p => p.id === productId)
    if (idx > -1) {
      Object.assign(products.value[idx], updates)
    }
    return { success: true }
  }

  function setPublishStatus(status) {
    publishStatus.value = { ...publishStatus.value, ...status }
    if (status.show) {
      setTimeout(() => {
        publishStatus.value.show = false
      }, 3000)
    }
  }

  const merchantProjects = ref([])
  const merchantProducts = ref([])

  return {
    projects,
    products,
    publishStatus,
    merchantProjects,
    merchantProducts,
    merchantProjectsLoading,
    merchantProductsLoading,
    apiEnabled,
    lastFetchTime,
    fetchProductsFromAPI,
    fetchProjectsFromAPI,
    fetchMerchantProjects,
    fetchMerchantProducts,
    addProject,
    addProduct,
    updateProject,
    updateProduct,
    deleteProject,
    deleteProduct,
    setPublishStatus
  }
})
