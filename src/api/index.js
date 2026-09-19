import axios from 'axios'

const API_BASE = ''

const request = axios.create({
  baseURL: API_BASE,
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('tiamo_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tiamo_token')
      localStorage.removeItem('tiamo_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关
export const authApi = {
  login: (data) => request.post('/api/auth/login', data),
  register: (data) => request.post('/api/auth/register', data),
  sendCode: (email) => request.post('/api/auth/send-code', { email }),
  verifyCode: (data) => request.post('/api/auth/verify-code', data),
  resetPassword: (data) => request.post('/api/auth/reset-password', data),
  validateToken: () => request.get('/api/auth/validate'),
  generateInviteCode: () => request.post('/api/auth/invite-code')
}

// 用户管理
export const userApi = {
  list: (params) => request.get('/api/admin/users', { params }),
  updateRole: (id, role) => request.put(`/api/admin/users/${id}/role`, { role }),
  updateStatus: (id, status) => request.put(`/api/admin/users/${id}/status`, { status }),
  delete: (id) => request.delete(`/api/admin/users/${id}`),
  resetPassword: (id, data) => request.post(`/api/admin/users/${id}/reset-password`, data)
}

// 商品数据
export const bookApi = {
  list: (params) => request.get('/maven/books', { params }),
  detail: (id) => request.get(`/maven/books/${id}`),
  create: (data) => request.post('/maven/books', data),
  update: (id, data) => request.put(`/maven/books/${id}`, data),
  delete: (id) => request.delete(`/maven/books/${id}`),
  batchDelete: (ids) => request.post('/maven/books/batch-delete', { ids }),
  recycle: (params) => request.get('/maven/books/recycle', { params }),
  restore: (id) => request.post(`/maven/books/${id}/restore`),
  hardDelete: (id) => request.delete(`/maven/books/${id}/hard`)
}

// 回收站审批
export const approvalApi = {
  pending: (params) => request.get('/api/recycle-approval/pending', { params }),
  myApprovals: (params) => request.get('/api/recycle-approval/my', { params }),
  pendingCount: () => request.get('/api/recycle-approval/pending/count'),
  submit: (data) => request.post('/api/recycle-approval/submit', data),
  approve: (id, remark) => request.post(`/api/recycle-approval/${id}/approve`, { remark }),
  reject: (id, remark) => request.post(`/api/recycle-approval/${id}/reject`, { remark }),
  batchApprove: (ids) => request.post('/api/recycle-approval/batch-approve', { ids }),
  batchReject: (ids) => request.post('/api/recycle-approval/batch-reject', { ids }),
  markAsRead: (id) => request.post(`/api/recycle-approval/${id}/read`),
  markAllAsRead: () => request.post('/api/recycle-approval/mark-all-read'),
  deleteAllRead: () => request.post('/api/recycle-approval/delete-all-read'),
  delete: (id) => request.delete(`/api/recycle-approval/${id}`)
}

// 操作日志
export const logApi = {
  list: (params) => request.get('/api/logs', { params }),
  stats: () => request.get('/api/logs/stats'),
  detail: (id) => request.get(`/api/logs/${id}`),
  batchDelete: (ids) => request.post('/api/logs/batch-delete', { ids }),
  clearAll: () => request.post('/api/logs/clear-all'),
  clean: (days) => request.post('/api/logs/clean', { days }),
  getRetention: () => request.get('/api/logs/retention-days'),
  setRetention: (data) => request.put('/api/logs/retention-days', data)
}

// 运行日志
export const runLogApi = {
  list: (params) => request.get('/api/run-log/list', { params }),
  stats: () => request.get('/api/run-log/stats'),
  clearAll: () => request.post('/api/run-log/clear-all'),
  clean: (days) => request.post('/api/run-log/clean', { days })
}

// 服务器状态
export const serverApi = {
  status: () => request.get('/api/server-status')
}

// 数据导出
export const exportApi = {
  downloadUsers: () => request.get('/api/export/users', { responseType: 'blob' }),
  downloadBooks: () => request.get('/api/export/books', { responseType: 'blob' }),
  downloadLogs: () => request.get('/api/export/logs', { responseType: 'blob' }),
  downloadRunLogs: () => request.get('/api/export/run-logs', { responseType: 'blob' }),
  sendUsersEmail: () => request.post('/api/export/users/email'),
  sendBooksEmail: () => request.post('/api/export/books/email'),
  sendLogsEmail: () => request.post('/api/export/logs/email'),
  sendRunLogsEmail: () => request.post('/api/export/run-logs/email')
}

// 数据库管理
export const dbApi = {
  tables: () => request.get('/api/db/tables'),
  tableStructure: (tableName) => request.get(`/api/db/tables/${tableName}/structure`),
  query: (sql) => request.post('/api/db/query', { sql }),
  backup: () => request.get('/api/db/backup', { responseType: 'blob' })
}

// 配置
export const configApi = {
  getEmail: () => request.get('/api/config/email'),
  updateEmail: (data) => request.put('/api/config/email', data)
}

// 相册
export const albumApi = {
  images: (params) => request.get('/api/images', { params }),
  videos: (params) => request.get('/api/videos', { params }),
  uploadImage: (formData) => request.post('/api/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadVideo: (formData) => request.post('/api/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadImageBatch: (formData) => request.post('/api/images/upload/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadVideoBatch: (formData) => request.post('/api/videos/upload/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (id) => request.delete(`/api/images/${id}`),
  deleteVideo: (id) => request.delete(`/api/videos/${id}`),
  downloadImage: (id) => request.get(`/api/images/${id}/download`, { responseType: 'blob' })
}

export default request
