import { apiService } from './api'

export const projectAPI = {
  async getProjects(params = {}) {
    const { data, duration } = await apiService.get('/projects', params)
    return {
      projects: data.data?.projects || data.projects || [],
      pagination: data.data?.pagination,
      duration
    }
  },

  async getProject(id) {
    const { data, duration } = await apiService.get(`/projects/${id}`)
    return { project: data.data?.project || data.project, duration }
  },

  async createProject(projectData) {
    const { data, duration } = await apiService.post('/projects', projectData)
    if (data.success) {
      return { success: true, message: data.message, application: data.data?.application, project: data.data?.project, duration }
    }
    return { success: false, error: data.message || '创建项目失败' }
  },

  async updateProject(id, projectData) {
    const { data, duration } = await apiService.put(`/projects/${id}`, projectData)
    return { project: data.data?.project || data.project, message: data.message, duration }
  },

  async deleteProject(id) {
    const { data, duration } = await apiService.delete(`/projects/${id}`)
    return { message: data.message, duration }
  },

  async getMerchantProjects() {
    const { data, duration } = await apiService.get('/projects/merchant/projects')
    return { projects: data.data?.projects || data.projects || [], duration }
  }
}
