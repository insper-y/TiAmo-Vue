// 认证工具
// Token 时效由后端签发时写入 JWT 的 exp，同时把 expiresAt 存到本地，
// 路由守卫无需请求后端即可判断登录态是否已失效。
const TOKEN_KEY = 'tiamo_token'
const USER_KEY = 'tiamo_user'
const EXP_KEY = 'tiamo_token_exp'

// 解析 JWT payload（不校验签名，仅读取 exp 用于本地判断）
const decodeJwt = (token) => {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

export const auth = {
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    // 本地已判定过期则直接清除，避免带着死 Token 到处请求
    if (auth.isExpired()) {
      auth.logout()
      return null
    }
    return token
  },
  setToken: (token, expiresAt) => {
    localStorage.setItem(TOKEN_KEY, token)
    let exp = expiresAt
    if (!exp) {
      const payload = decodeJwt(token)
      if (payload && payload.exp) exp = payload.exp * 1000
    }
    if (exp) localStorage.setItem(EXP_KEY, String(exp))
    else localStorage.removeItem(EXP_KEY)
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXP_KEY)
  },
  // 过期时间戳（毫秒）；未知时返回 null
  getExpiresAt: () => {
    const raw = localStorage.getItem(EXP_KEY)
    if (raw) {
      const n = Number(raw)
      if (!Number.isNaN(n)) return n
    }
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    const payload = decodeJwt(token)
    return payload && payload.exp ? payload.exp * 1000 : null
  },
  // 留 30 秒余量，避免临界时刻发出注定失败的请求
  isExpired: () => {
    const exp = auth.getExpiresAt()
    if (!exp) return false
    return Date.now() >= exp - 30000
  },
  // 剩余有效时长（毫秒），无 Token 返回 0
  remainingMs: () => {
    const exp = auth.getExpiresAt()
    if (!exp) return 0
    return Math.max(0, exp - Date.now())
  },
  getUser: () => {
    const user = localStorage.getItem(USER_KEY)
    if (!user) return null
    try { return JSON.parse(user) } catch (e) { return null }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  isAdmin: () => {
    const user = auth.getUser()
    return !!(user && user.role === 1)
  },
  // 登录态是否可用：有 Token 且未过期
  isAuthenticated: () => !!auth.getToken(),
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
