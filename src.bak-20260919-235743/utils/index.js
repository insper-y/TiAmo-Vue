// 认证工具
export const auth = {
  getToken: () => localStorage.getItem('tiamo_token'),
  setToken: (token) => localStorage.setItem('tiamo_token', token),
  removeToken: () => localStorage.removeItem('tiamo_token'),
  getUser: () => {
    const user = localStorage.getItem('tiamo_user')
    return user ? JSON.parse(user) : null
  },
  setUser: (user) => localStorage.setItem('tiamo_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('tiamo_user'),
  isAdmin: () => {
    const user = auth.getUser()
    return user && user.role === 1
  },
  logout: () => {
    auth.removeToken()
    auth.removeUser()
  }
}

// 提示消息
let toastTimer = null
export const toast = {
  show: (message, type = 'info', duration = 3000) => {
    // 移除旧的toast
    const oldToast = document.querySelector('.toast')
    if (oldToast) oldToast.remove()

    const toastEl = document.createElement('div')
    toastEl.className = `toast ${type}`
    toastEl.textContent = message
    document.body.appendChild(toastEl)

    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastEl.remove()
    }, duration)
  },
  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  warning: (msg) => toast.show(msg, 'warning'),
  info: (msg) => toast.show(msg, 'info')
}

// 确认对话框
export const confirm = (title, message, type = 'danger') => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px !important;">
        <div class="modal-header">
          <h3>${title}</h3>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn" id="confirmCancel">取消</button>
          <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}" id="confirmOk">确认</button>
        </div>
      </div>
    `
    document.body.appendChild(overlay)

    overlay.querySelector('#confirmCancel').onclick = () => {
      overlay.remove()
      resolve(false)
    }
    overlay.querySelector('#confirmOk').onclick = () => {
      overlay.remove()
      resolve(true)
    }
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove()
        resolve(false)
      }
    }
  })
}

// 格式化时间
export const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

export const formatDate = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 10)
}

// 文件大小格式化
export const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
