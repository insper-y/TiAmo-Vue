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

// 401 去重：并发请求同时失效时只跳一次登录页
let redirecting = false

const redirectToLogin = () => {
  localStorage.removeItem('tiamo_token')
  localStorage.removeItem('tiamo_user')
  localStorage.removeItem('tiamo_token_exp')
  if (redirecting) return
  redirecting = true
  // hash 路由：当前地址形如 #/dashboard?tab=album
  const hash = window.location.hash || ''
  const current = hash.startsWith('#') ? hash.slice(1) : '/'
  const target = current && current !== '/' && !current.startsWith('/login')
    ? `/login?redirect=${encodeURIComponent(current)}`
    : '/login'
  if (window.location.hash.slice(1) !== target) {
    window.location.hash = '#' + target
  }
  // 已在登录页时刷新一次，确保组件状态干净
  setTimeout(() => { redirecting = false }, 800)
}

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 后端约定：HTTP 200 但业务码 401 也视为登录失效
    const data = response.data
    if (data && data.code === 401) {
      redirectToLogin()
    }
    return data
  },
  error => {
    if (error.response?.status === 401) {
      redirectToLogin()
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
  updatePermissions: (id, permissions) => request.put(`/api/admin/users/${id}/permissions`, { permissions }),
  updateRole: (id, role) => request.put(`/api/admin/users/${id}/role`, { role }),
  updateStatus: (id, status) => request.put(`/api/admin/users/${id}/status`, { status }),
  delete: (id) => request.delete(`/api/admin/users/${id}`)
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
  approve: (id, remark) => request.put(`/api/recycle-approval/${id}/approve`, { remark }),
  reject: (id, remark) => request.put(`/api/recycle-approval/${id}/reject`, { remark }),
  batchApprove: (ids) => request.put('/api/recycle-approval/batch-approve', { ids }),
  batchReject: (ids) => request.put('/api/recycle-approval/batch-reject', { ids }),
  markAsRead: (id) => request.post(`/api/recycle-approval/${id}/read`),
  markAllAsRead: () => request.post('/api/recycle-approval/mark-all-read'),
  deleteAllRead: () => request.delete('/api/recycle-approval/delete-all-read'),
  delete: (id) => request.delete(`/api/recycle-approval/${id}`)
}

// 操作日志
export const logApi = {
  list: (params) => request.get('/api/logs', { params }),
  stats: () => request.get('/api/logs/stats'),
  detail: (id) => request.get(`/api/logs/${id}`),
  batchDelete: (ids) => request.post('/api/logs/batch-delete', { ids }),
  clean: (days) => request.post('/api/logs/clean', { days }),
  getRetention: () => request.get('/api/logs/retention-days'),
  setRetention: (data) => request.put('/api/logs/retention-days', data)
}

// 运行日志
export const runLogApi = {
  list: (params) => request.get('/api/run-log/list', { params }),
  stats: () => request.get('/api/run-log/stats'),
  detail: (id) => request.get(`/api/run-log/${id}`),
  // 后端实际提供的是 DELETE /clean?days=N 与 DELETE /clean-today
  clean: (days) => request.delete('/api/run-log/clean', { params: { days } }),
  cleanToday: () => request.delete('/api/run-log/clean-today'),
  // —— 文件日志两个模块 ——
  files: () => request.get('/api/run-log/files'),
  springboot: (params) => request.get('/api/run-log/springboot', { params, timeout: 60000 }),
  nginx: (params) => request.get('/api/run-log/nginx', { params, timeout: 60000 }),
  clearFile: (module) => request.post('/api/run-log/file/clear', { module })
}

// 系统设置
export const systemApi = {
  backupInfo: () => request.get('/api/system/backup/info'),
  profile: () => request.get('/api/system/profile'),
  changePassword: (data) => request.post('/api/system/change-password', data),
  getSettings: () => request.get('/api/system/settings'),
  saveSettings: (data) => request.put('/api/system/settings', data),
  cleanupPreview: () => request.get('/api/system/cleanup/preview'),
  cleanup: (data) => request.post('/api/system/cleanup', data, { timeout: 300000 }),
  permissions: () => request.get('/api/system/permissions'),
  restore: (formData) => request.post('/api/system/restore', formData, { timeout: 300000 })
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
  // 传 email 则发到指定邮箱；不传时后端回落到「邮件配置」中的收件邮箱
  sendUsersEmail: (email) => request.post('/api/export/users/email', email ? { email } : {}),
  sendBooksEmail: (email) => request.post('/api/export/books/email', email ? { email } : {}),
  sendLogsEmail: (email) => request.post('/api/export/logs/email', email ? { email } : {}),
  sendRunLogsEmail: (email) => request.post('/api/export/run-logs/email', email ? { email } : {})
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

// 相册（上传接口：支持进度回调，取消超时限制避免大文件中断）
const uploadConfig = (onProgress) => ({
  timeout: 0,
  onUploadProgress: onProgress
})
export const albumApi = {
  images: (params) => request.get('/api/images', { params }),
  videos: (params) => request.get('/api/videos', { params }),
  uploadImage: (formData, onProgress) => request.post('/api/images/upload', formData, uploadConfig(onProgress)),
  uploadVideo: (formData, onProgress) => request.post('/api/videos/upload', formData, uploadConfig(onProgress)),
  uploadImageBatch: (formData, onProgress) => request.post('/api/images/upload/batch', formData, uploadConfig(onProgress)),
  uploadVideoBatch: (formData, onProgress) => request.post('/api/videos/upload/batch', formData, uploadConfig(onProgress)),
  deleteImage: (id) => request.delete(`/api/images/${id}`),
  deleteVideo: (id) => request.delete(`/api/videos/${id}`),
  downloadImage: (id) => request.get(`/api/images/${id}/download`, { responseType: 'blob' })
}

export default request

// 分片上传
export const chunkApi = {
  upload: (fd) => request.post('/api/chunk/upload', fd, {
    timeout: 90000
  }),
  status: (qid) => request.get(`/api/chunk/status/${qid}`, { timeout: 15000 }),
  merge: (payload) => request.post('/api/chunk/merge', payload, { timeout: 120000 })
}





