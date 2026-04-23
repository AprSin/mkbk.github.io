import { apiService } from './api'

export const fileAPI = {
  async uploadFile(file, category = 'general') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const { data, duration } = await apiService.upload('/uploads', formData)
    const fileData = data.data?.files?.[0] || data.files?.[0] || {}
    return {
      url: fileData.url || data.url,
      filename: fileData.name || fileData.filename || data.filename,
      duration
    }
  },

  async uploadFiles(files, category = 'general') {
    const results = []
    for (const file of files) {
      const result = await this.uploadFile(file, category)
      results.push(result)
    }
    return results
  }
}