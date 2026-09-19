<template>
  <div class="dashboard">
    <!-- 顶部导航 -->
    <header class="top-header">
      <div class="header-left">
        <button v-if="activeTab !== 'home'" class="head-back" @click="setTab('home')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>返回</span>
        </button>
        <div class="logo">
          <span class="logo-icon">🚀</span>
          <span class="logo-text">Tiamo AI</span>
        </div>
      </div>

      <!-- 图片/视频放大预览 -->
      <div v-if="previewImg" class="img-preview-overlay" @click="previewImg = null">
        <img :src="previewImg" class="img-preview" @click.stop />
        <button class="img-preview-close" @click="previewImg = null">×</button>
      </div>
      <div v-if="previewVideo" class="img-preview-overlay" @click="previewVideo = null">
        <video :src="previewVideo" class="video-preview" controls autoplay @click.stop></video>
        <button class="img-preview-close" @click="previewVideo = null">×</button>
      </div>
      <div class="header-right">
        <span class="user-name">{{ user?.username }}</span>
        <span class="user-role" :class="isAdmin ? 'admin' : 'user'">
          {{ isAdmin ? '管理员' : '普通用户' }}
        </span>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="content">
      <!-- 首页 -->
      <div v-if="activeTab === 'home'" class="home-view">
        <div class="welcome-card">
          <div class="welcome-text">
            <h2>{{ greeting }}，{{ user?.username }} 👋</h2>
            <p>欢迎回到 Tiamo AI 数据管理平台</p>
          </div>
          <div class="welcome-date">{{ currentDate }}</div>
        </div>

        <div class="section-title">常用功能</div>
        <div class="function-grid">
          <div
            v-for="func in quickFunctions"
            :key="func.key"
            class="function-item"
            @click="openFunction(func)"
          >
            <div class="function-icon" :style="{ background: func.bg }">{{ func.icon }}</div>
            <span class="function-name">{{ func.name }}</span>
          </div>
        </div>

        <div class="section-title">最近活动</div>
        <div class="recent-list">
          <div v-if="recentLogs.length === 0" class="empty-state">暂无活动记录</div>
          <div v-for="log in recentLogs" :key="log.id" class="recent-item">
            <div class="recent-dot" :class="log.status === '成功' ? 'success' : 'error'"></div>
            <div class="recent-info">
              <span class="recent-action">{{ log.operation }}</span>
              <span class="recent-time">{{ log.createTime }}</span>
            </div>
            <span class="recent-module">{{ log.module }}</span>
          </div>
        </div>
      </div>

      <!-- 用户列表 -->
      <div v-if="activeTab === 'users'" class="users-view">
        <div class="view-header">
          <h3>用户管理</h3>
          <button class="btn-primary btn-sm" @click="generateInviteCode">生成邀请码</button>
        </div>
        <div class="filter-bar">
          <input v-model="userSearch" class="input" placeholder="搜索用户名/邮箱" @keyup.enter="loadUsers" />
          <button class="btn" @click="loadUsers">搜索</button>
        </div>
        <div class="mobile-card-list">
          <div v-if="users.length === 0" class="empty-state">暂无用户</div>
          <div v-for="u in users" :key="u.id" class="mobile-card">
            <div class="mobile-card-header">
              <div class="mobile-card-title">{{ u.nickname || u.username }}</div>
              <span class="mobile-card-badge" :class="u.role === 1 ? 'admin' : 'user'">
                {{ u.role === 1 ? '管理员' : '普通用户' }}
              </span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">用户名</span><span class="value">{{ u.username }}</span></div>
              <div class="mobile-card-row"><span class="label">邮箱</span><span class="value">{{ u.email }}</span></div>
              <div class="mobile-card-row"><span class="label">状态</span><span class="value" :style="{color: u.status === 1 ? '#059669' : '#dc2626'}">{{ u.status === 1 ? '正常' : '禁用' }}</span></div>
              <div class="mobile-card-row"><span class="label">注册时间</span><span class="value">{{ u.createTime }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <button class="btn" @click="toggleUserStatus(u)">{{ u.status === 1 ? '禁用' : '启用' }}</button>
              <button class="btn" @click="toggleUserRole(u)">{{ u.role === 1 ? '降为用户' : '升为管理员' }}</button>
              <button class="btn btn-danger" @click="deleteUser(u)">删除</button>
            </div>
          </div>
        </div>
      </div>


      <!-- 回收站 -->
      <div v-if="activeTab === 'recycle'" class="recycle-view">
        <div class="view-header">
          <h3>回收站</h3>
          <button class="btn" @click="loadRecycle">刷新</button>
        </div>
        <div class="mobile-card-list">
          <div v-if="recycleList.length === 0" class="empty-state">回收站为空</div>
          <div v-for="b in recycleList" :key="b.id" class="mobile-card">
            <div class="mobile-card-header">
              <div class="mobile-card-title">{{ b.title || b.name || '商品 ' + b.id }}</div>
              <span class="mobile-card-badge" :class="b.approvalStatus ? 'pending' : ''">
                {{ b.approvalStatus ? '已申请' : '可操作' }}
              </span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">分销软件</span><span class="value">{{ b.software || '-' }}</span></div>
              <div class="mobile-card-row"><span class="label">删除时间</span><span class="value">{{ b.deleteTime || '-' }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <template v-if="isAdmin">
                <button class="btn btn-success" @click="restoreBook(b)">恢复</button>
                <button class="btn btn-danger" @click="hardDeleteBook(b)">彻底删除</button>
              </template>
              <template v-else>
                <button class="btn" :disabled="b.approvalStatus" @click="submitApproval(b, 'RESTORE')">申请恢复</button>
                <button class="btn btn-danger" :disabled="b.approvalStatus" @click="submitApproval(b, 'DELETE')">申请删除</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据库管理 -->
      <div v-if="activeTab === 'database' && isAdmin" class="database-view">
        <div class="view-header">
          <h3>数据库管理</h3>
          <button class="btn" @click="loadTables">刷新</button>
        </div>
        <div class="action-bar">
          <button class="btn" @click="backupDatabase">备份数据库</button>
        </div>
        <div class="mobile-card-list">
          <div v-if="tables.length === 0" class="empty-state">暂无数据表</div>
          <div v-for="t in tables" :key="t.tableName" class="mobile-card">
            <div class="mobile-card-header">
              <div class="mobile-card-title">{{ t.tableName }}</div>
              <span class="mobile-card-badge">{{ t.rowCount }} 条</span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">数据大小</span><span class="value">{{ t.dataSizeMB }} MB</span></div>
              <div class="mobile-card-row"><span class="label">索引大小</span><span class="value">{{ t.indexSizeMB }} MB</span></div>
              <div class="mobile-card-row"><span class="label">注释</span><span class="value">{{ t.comment || '-' }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <button class="btn" @click="viewTableStructure(t.tableName)">查看结构</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据导出 -->
      <div v-if="activeTab === 'export'" class="export-view">
        <div class="view-header">
          <h3>数据导出</h3>
        </div>
        <div class="export-list">
          <div class="export-item" v-for="item in exportItems" :key="item.key">
            <div class="export-icon" :style="{background: item.bg}">{{ item.icon }}</div>
            <div class="export-info">
              <span class="export-name">{{ item.name }}</span>
              <span class="export-desc">{{ item.desc }}</span>
            </div>
            <div class="export-actions">
              <button class="btn btn-sm" @click="downloadData(item.key)">下载</button>
              <button class="btn btn-sm" @click="sendEmail(item.key)">发邮箱</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 邮件配置 -->
      <div v-if="activeTab === 'email' && isAdmin" class="email-view">
        <div class="view-header">
          <h3>邮件配置</h3>
        </div>
        <div class="config-form">
          <div class="form-group">
            <label class="form-label">收件邮箱</label>
            <input v-model="emailConfig.toEmail" class="input" placeholder="接收通知的邮箱" />
          </div>
          <div class="form-group">
            <label class="form-label">SMTP服务器</label>
            <input v-model="emailConfig.smtpHost" class="input" placeholder="smtp.qq.com" />
          </div>
          <div class="form-group">
            <label class="form-label">SMTP端口</label>
            <input v-model="emailConfig.smtpPort" type="number" class="input" placeholder="465" />
          </div>
          <div class="form-group">
            <label class="form-label">发件邮箱</label>
            <input v-model="emailConfig.fromEmail" class="input" placeholder="发件邮箱" />
          </div>
          <div class="form-group">
            <label class="form-label">授权码</label>
            <input v-model="emailConfig.authCode" type="password" class="input" placeholder="SMTP授权码" />
          </div>
          <div class="form-group">
            <label class="checkbox-group">
              <input type="checkbox" v-model="emailConfig.enableDailyReport" />
              <span>启用日报邮件通知（每天20:00发送操作日志和运行日志）</span>
            </label>
          </div>
          <button class="btn-primary btn-block" @click="saveEmailConfig">保存配置</button>
        </div>
      </div>

      <!-- 相册 -->
      <div v-if="activeTab === 'album'" class="album-view">
        <div class="view-header">
          <h3>相册</h3>
          <div class="header-actions">
            <button class="btn btn-sm" @click="triggerUpload('image')">上传图片</button>
            <button class="btn btn-sm" @click="triggerUpload('video')">上传视频</button>
          </div>
          <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="handleUpload('image', $event)" />
          <input ref="videoInput" type="file" accept="video/*" multiple style="display:none" @change="handleUpload('video', $event)" />
        </div>
        <div class="album-tabs">
          <button class="album-tab" :class="{active: albumTab === 'all'}" @click="albumTab = 'all'">全部</button>
          <button class="album-tab" :class="{active: albumTab === 'image'}" @click="albumTab = 'image'">图片</button>
          <button class="album-tab" :class="{active: albumTab === 'video'}" @click="albumTab = 'video'">视频</button>
        </div>
        <div class="album-grid">
          <div v-if="filteredAlbum.length === 0" class="empty-state" style="grid-column:1/-1">相册为空</div>
          <div v-for="item in filteredAlbum" :key="item.type + item.id" class="album-item" @click="previewAlbum(item)">
            <img v-if="item.type === 'image'" :src="item.thumb" loading="lazy" @error="onThumbError(item)" />
            <div v-else class="video-thumb">
              <img v-if="item.thumb" :src="item.thumb" loading="lazy" @error="onThumbError(item)" />
              <span v-else class="video-icon">🎬</span>
              <span class="play-icon">▶</span>
            </div>
            <button class="album-del" title="删除" @click.stop="deleteAlbumItem(item)">×</button>
            <span v-if="item.transcoding" class="album-transcoding">转码中</span>
            <span class="album-type">{{ item.type === 'image' ? '图片' : '视频' }}</span>
          </div>
        </div>
      </div>


      <!-- 待审批 -->
      <div v-if="activeTab === 'pending' && isAdmin" class="pending-view">
        <div class="view-header">
          <h3>待审批</h3>
          <div class="header-actions">
            <button class="btn btn-sm" @click="batchApprove">批量通过</button>
            <button class="btn btn-sm btn-danger" @click="batchReject">批量拒绝</button>
            <button class="btn btn-sm" @click="loadPending">刷新</button>
          </div>
        </div>
        <div class="mobile-card-list">
          <div v-if="pendingList.length === 0" class="empty-state">暂无待审批申请</div>
          <div v-for="a in pendingList" :key="a.id" class="mobile-card" :style="{borderColor: selectedApprovals.includes(a.id) ? '#6366f1' : ''}">
            <div class="mobile-card-header">
              <div style="display:flex;align-items:center;gap:8px;flex:1;">
                <input type="checkbox" :checked="selectedApprovals.includes(a.id)" @change="toggleApproval(a.id)" style="width:18px;height:18px;" />
                <div class="mobile-card-title" style="margin:0">{{ a.bookName || '商品 ' + a.bookId }}</div>
              </div>
              <span class="mobile-card-badge" :class="a.approvalType === 'RESTORE' ? 'success' : 'danger'">
                申请{{ a.approvalType === 'RESTORE' ? '恢复' : '删除' }}
              </span>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-card-row"><span class="label">申请人</span><span class="value">{{ a.applicantName }}</span></div>
              <div class="mobile-card-row"><span class="label">申请时间</span><span class="value">{{ a.applyTime }}</span></div>
            </div>
            <div class="mobile-card-footer">
              <button class="btn btn-success" @click="approveOne(a.id)">通过</button>
              <button class="btn btn-danger" @click="rejectOne(a.id)">拒绝</button>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- 底部导航（手机端） -->
    <nav class="bottom-nav">
      <button class="nav-item" :class="{active: activeTab === 'home'}" @click="setTab('home')">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">首页</span>
      </button>
      <button class="nav-item" :class="{active: activeTab === 'album'}" @click="setTab('album')">
        <span class="nav-icon">🖼️</span>
        <span class="nav-text">相册</span>
      </button>
      <button class="nav-item nav-add" @click="quickUpload">
        <span class="nav-icon">➕</span>
      </button>
      <button class="nav-item" @click="goRoute('/logs')">
        <span class="nav-icon">📋</span>
        <span class="nav-text">操作日志</span>
      </button>
      <button class="nav-item" @click="goRoute('/run-log')">
        <span class="nav-icon">⚙️</span>
        <span class="nav-text">运行日志</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Pagination from '../components/Pagination.vue'
import { auth, toast, confirm, formatTime } from '../utils'
import {
  userApi, bookApi, approvalApi, logApi, dbApi,
  exportApi, configApi, albumApi, authApi
} from '../api'

const router = useRouter()
const route = useRoute()
const user = ref(auth.getUser())
const isAdmin = computed(() => user.value?.role === 1)

// 页签与 URL 同步：刷新后停留在当前页面
const validTabs = ['home', 'users', 'recycle', 'database', 'export', 'email', 'album', 'pending']
const initTab = validTabs.includes(route.query.tab) ? route.query.tab : 'home'
const activeTab = ref(initTab)

const setTab = (key) => {
  const tab = validTabs.includes(key) ? key : 'home'
  activeTab.value = tab
  const query = { ...route.query }
  if (tab === 'home') delete query.tab
  else query.tab = tab
  router.replace({ query })
  refreshTab(tab)
}

// 切换页签时刷新对应数据，保证内容最新
const refreshTab = (tab) => {
  if (tab === 'album') loadAlbum()
  else if (tab === 'users' && isAdmin.value) loadUsers()
  else if (tab === 'recycle') loadRecycle()
  else if (tab === 'database' && isAdmin.value) loadTables()
  else if (tab === 'email' && isAdmin.value) loadEmailConfig()
  else if (tab === 'pending' && isAdmin.value) loadPending()
}

const goRoute = (path) => router.push(path)

// 浏览器前进/后退时同步页签
watch(() => route.query.tab, (t) => {
  const tab = validTabs.includes(t) ? t : 'home'
  if (tab !== activeTab.value) activeTab.value = tab
})

// 标签配置
const allTabs = [
  { key: 'home', name: '首页', icon: '🏠', admin: false },
  { key: 'users', name: '用户管理', icon: '👥', admin: true },
  { key: 'recycle', name: '回收站', icon: '🗑️', admin: false },
  { key: 'database', name: '数据库', icon: '🗄️', admin: true },
  { key: 'export', name: '数据导出', icon: '📤', admin: false },
  { key: 'email', name: '邮件配置', icon: '📧', admin: true },
  { key: 'album', name: '相册', icon: '🖼️', admin: false },
  { key: 'pending', name: '待审批', icon: '⏳', admin: true, badge: 0 }
]

const visibleTabs = computed(() => allTabs.filter(t => !t.admin || isAdmin.value))

const quickFunctions = computed(() => [
  { key: 'recycle', name: '回收站', icon: '🗑️', bg: 'linear-gradient(135deg,#f59e0b,#f97316)' },
  { key: 'album', name: '相册', icon: '🖼️', bg: 'linear-gradient(135deg,#10b981,#059669)' },
  { key: 'export', name: '数据导出', icon: '📤', bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
  { key: 'oplog', name: '操作日志', route: '/logs', icon: '📋', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  { key: 'runlog', name: '运行日志', route: '/run-log', icon: '⚙️', bg: 'linear-gradient(135deg,#64748b,#475569)' }
])

const openFunction = (func) => {
  if (func.route) router.push(func.route)
  else setTab(func.key)
}

// 首页
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const currentDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`
})
const recentLogs = ref([])

// 用户列表
const users = ref([])
const userSearch = ref('')

// 商品数据

// 回收站
const recycleList = ref([])

// 数据库
const tables = ref([])

// 邮件配置
const emailConfig = reactive({
  toEmail: '', smtpHost: 'smtp.qq.com', smtpPort: 465,
  fromEmail: '', authCode: '', enableDailyReport: false
})

// 相册
const albumTab = ref('all')
const albumItems = ref([])
const previewImg = ref('')
const previewVideo = ref('')
const previewItem = ref(null)
const imageInput = ref(null)
const videoInput = ref(null)
const filteredAlbum = computed(() => {
  if (albumTab.value === 'all') return albumItems.value
  return albumItems.value.filter(i => i.type === albumTab.value)
})

// 后端返回的是相对路径，需拼接 nginx 静态资源前缀才能直接访问
const resolveUrl = (p, base) => {
  if (!p) return ''
  if (/^https?:\/\//.test(p) || p.startsWith('/')) return p
  return `${base}/${p}`
}


// 待审批
const pendingList = ref([])
const selectedApprovals = ref([])

// 导出项
const exportItems = [
  { key: 'users', name: '用户数据', desc: '导出所有用户信息', icon: '👥', bg: '#eef2ff' },
  { key: 'logs', name: '操作日志', desc: '导出所有操作日志', icon: '📋', bg: '#fffbeb' },
  { key: 'runLogs', name: '运行日志', desc: '导出系统运行日志', icon: '⚙️', bg: '#f0f9ff' }
]

// 方法
const handleLogout = async () => {
  const ok = await confirm('退出登录', '确定要退出登录吗？')
  if (ok) {
    auth.logout()
    router.push('/login')
  }
}

const loadRecentLogs = async () => {
  try {
    const res = await logApi.list({ page: 1, size: 5 })
    if (res.code === 200) recentLogs.value = res.data?.records || res.data || []
  } catch (e) {}
}

const loadUsers = async () => {
  try {
    const res = await userApi.list({ keyword: userSearch.value })
    if (res.code === 200) users.value = res.data?.records || res.data || []
  } catch (e) { toast.error('加载用户失败') }
}

const generateInviteCode = async () => {
  try {
    const res = await authApi.generateInviteCode()
    if (res.code === 200) {
      toast.success(`邀请码：${res.data.code}（3分钟有效）`)
    }
  } catch (e) { toast.error('生成失败') }
}

const toggleUserStatus = async (u) => {
  try {
    await userApi.updateStatus(u.id, u.status === 1 ? 0 : 1)
    toast.success('状态已更新')
    loadUsers()
  } catch (e) { toast.error('操作失败') }
}

const toggleUserRole = async (u) => {
  try {
    await userApi.updateRole(u.id, u.role === 1 ? 0 : 1)
    toast.success('角色已更新')
    loadUsers()
  } catch (e) { toast.error('操作失败') }
}

const deleteUser = async (u) => {
  const ok = await confirm('删除用户', `确定要删除用户 ${u.username} 吗？`)
  if (!ok) return
  try {
    await userApi.delete(u.id)
    toast.success('删除成功')
    loadUsers()
  } catch (e) { toast.error('删除失败') }
}

const loadRecycle = async () => {
  try {
    const res = await bookApi.recycle({ page: 1, size: 100 })
    if (res.code === 200 || res.code === 20041) recycleList.value = res.data?.records || res.data || []
  } catch (e) { toast.error('加载回收站失败') }
}

const restoreBook = async (b) => {
  try {
    await bookApi.restore(b.id)
    toast.success('恢复成功')
    loadRecycle()
  } catch (e) { toast.error('恢复失败') }
}

const hardDeleteBook = async (b) => {
  const ok = await confirm('彻底删除', '确定要彻底删除吗？此操作不可恢复！')
  if (!ok) return
  try {
    await bookApi.hardDelete(b.id)
    toast.success('已彻底删除')
    loadRecycle()
  } catch (e) { toast.error('删除失败') }
}

const submitApproval = async (b, type) => {
  try {
    await approvalApi.submit({ bookId: b.id, approvalType: type })
    toast.success('申请已提交，等待管理员审批')
    loadRecycle()
  } catch (e) { toast.error('提交失败') }
}

const loadTables = async () => {
  try {
    const res = await dbApi.tables()
    if (res.code === 200) tables.value = res.data || []
  } catch (e) { toast.error('加载数据表失败') }
}

const backupDatabase = async () => {
  try {
    const res = await dbApi.backup()
    const url = URL.createObjectURL(res)
    const a = document.createElement('a')
    a.href = url
    a.download = `database_backup_${Date.now()}.sql`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('备份成功')
  } catch (e) { toast.error('备份失败') }
}

const viewTableStructure = async (tableName) => {
  try {
    const res = await dbApi.tableStructure(tableName)
    if (res.code === 200) {
      const cols = res.data || []
      let html = `<h3 style="margin-bottom:12px;">${tableName} 表结构</h3><table style="width:100%;font-size:12px;border-collapse:collapse;"><tr style="background:#f1f5f9;"><th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">字段</th><th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">类型</th><th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">注释</th></tr>`
      cols.forEach(c => {
        html += `<tr><td style="padding:6px 8px;border:1px solid #e2e8f0;">${c.columnName || c.Field}</td><td style="padding:6px 8px;border:1px solid #e2e8f0;">${c.columnType || c.Type}</td><td style="padding:6px 8px;border:1px solid #e2e8f0;">${c.comment || c.Comment || '-'}</td></tr>`
      })
      html += '</table>'
      alert(html)
    }
  } catch (e) { toast.error('加载失败') }
}

const loadEmailConfig = async () => {
  try {
    const res = await configApi.getEmail()
    if (res.code === 200 && res.data) Object.assign(emailConfig, res.data)
  } catch (e) {}
}

const saveEmailConfig = async () => {
  try {
    await configApi.updateEmail(emailConfig)
    toast.success('配置已保存')
  } catch (e) { toast.error('保存失败') }
}

// 把后端实体转成相册条目
const toImageItem = (i) => ({
  type: 'image',
  id: i.id,
  name: i.originalName,
  createTime: i.createTime,
  thumb: resolveUrl(i.thumbnailPath || i.filePath || i.fileName, '/uploads/images'),
  full: resolveUrl(i.filePath || i.fileName, '/uploads/images'),
  transcoding: false
})
const toVideoItem = (v) => ({
  type: 'video',
  id: v.id,
  name: v.originalName,
  createTime: v.createTime,
  thumb: resolveUrl(v.coverPath, '/uploads/videos'),
  playUrl: resolveUrl(v.filePath || v.fileName, '/uploads/videos'),
  transcoding: v.status === 0
})

const loadAlbum = async () => {
  try {
    const [imgRes, vidRes] = await Promise.all([
      albumApi.images({ page: 1, size: 100 }),
      albumApi.videos({ page: 1, size: 100 })
    ])
    const items = []
    ;(imgRes.data?.records || imgRes.data || []).forEach(i => items.push(toImageItem(i)))
    ;(vidRes.data?.records || vidRes.data || []).forEach(v => items.push(toVideoItem(v)))
    items.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
    albumItems.value = items
  } catch (e) { toast.error('加载相册失败') }
}

const triggerUpload = async (type) => {
  setTab('album')
  await nextTick()
  if (type === 'image') imageInput.value?.click()
  else videoInput.value?.click()
}

// 底部导航“+”：快捷进入相册并选择图片上传
const quickUpload = () => { triggerUpload('image') }

// 上传成功后新条目去重合并，保证立刻显示
const mergeUploadItems = (newItems) => {
  const map = new Map(albumItems.value.map(it => [it.type + it.id, it]))
  newItems.forEach(it => map.set(it.type + it.id, it))
  albumItems.value = Array.from(map.values())
    .sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
}

const handleUpload = async (type, e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const formData = new FormData()
  files.forEach(f => formData.append(files.length > 1 ? 'files' : 'file', f))
  try {
    toast.info(`上传中（${files.length}个文件）...`)
    let res
    if (files.length > 1) {
      res = type === 'image' ? await albumApi.uploadImageBatch(formData)
                             : await albumApi.uploadVideoBatch(formData)
      const list = res?.data || []
      const okList = list.filter(r => r.success)
      if (!okList.length) throw new Error(res?.message || '上传失败')
      mergeUploadItems(okList.map(r => type === 'image' ? toImageItem(r.data) : toVideoItem(r.data)))
      if (okList.length < files.length) toast.warning(`成功${okList.length}个，失败${files.length - okList.length}个`)
      else toast.success('上传成功')
    } else {
      res = type === 'image' ? await albumApi.uploadImage(formData)
                             : await albumApi.uploadVideo(formData)
      const map = res?.data
      const entity = map?.data
      if (!map || map.success === false) throw new Error(map?.message || '上传失败')
      if (entity) mergeUploadItems([type === 'image' ? toImageItem(entity) : toVideoItem(entity)])
      toast.success('上传成功')
    }
    // 视频需后端转码/生成封面，稍后再拉取一次以获得封面与压缩版地址
    setTimeout(loadAlbum, type === 'video' ? 6000 : 1500)
  } catch (err) {
    toast.error(err?.message || '上传失败')
  }
  e.target.value = ''
}

const onThumbError = (item) => {
  // 缩略图加载失败时回退：图片退回原图地址，视频退回默认图标
  if (item.type === 'image' && item.full && item.thumb !== item.full) {
    item.thumb = item.full
  } else if (item.type === 'video' && item.thumb) {
    item.thumb = ''
  }
}

const previewAlbum = (item) => {
  previewItem.value = item
  if (item.type === 'image') {
    previewImg.value = item.full || item.thumb
  } else {
    previewVideo.value = item.playUrl || item.thumb
  }
}

const closePreview = () => {
  previewImg.value = ''
  previewVideo.value = ''
  previewItem.value = null
}

const deleteAlbumItem = async (item) => {
  const ok = await confirm('删除', `确定要删除该${item.type === 'image' ? '图片' : '视频'}吗？`)
  if (!ok) return
  try {
    const res = item.type === 'image' ? await albumApi.deleteImage(item.id)
                                      : await albumApi.deleteVideo(item.id)
    if (res && res.code !== 200) throw new Error(res.message || '删除失败')
    albumItems.value = albumItems.value.filter(i => !(i.type === item.type && i.id === item.id))
    toast.success('删除成功')
    loadAlbum()
  } catch (e) { toast.error(e?.message || '删除失败') }
}

const deleteFromPreview = async () => {
  const item = previewItem.value
  if (!item) return
  await deleteAlbumItem(item)
  closePreview()
}
const loadPending = async () => {
  try {
    const res = await approvalApi.pending({ page: 1, size: 100 })
    if (res.code === 200) pendingList.value = res.data?.records || res.data || []
    selectedApprovals.value = []
  } catch (e) { toast.error('加载失败') }
}

const toggleApproval = (id) => {
  const idx = selectedApprovals.value.indexOf(id)
  if (idx > -1) selectedApprovals.value.splice(idx, 1)
  else selectedApprovals.value.push(id)
}

const approveOne = async (id) => {
  try {
    await approvalApi.approve(id, '')
    toast.success('已通过')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const rejectOne = async (id) => {
  const remark = prompt('请输入拒绝原因（可选）：')
  try {
    await approvalApi.reject(id, remark || '')
    toast.success('已拒绝')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const batchApprove = async () => {
  if (!selectedApprovals.value.length) { toast.warning('请先选择'); return }
  try {
    await approvalApi.batchApprove(selectedApprovals.value)
    toast.success('批量通过成功')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const batchReject = async () => {
  if (!selectedApprovals.value.length) { toast.warning('请先选择'); return }
  try {
    await approvalApi.batchReject(selectedApprovals.value)
    toast.success('批量拒绝成功')
    loadPending()
  } catch (e) { toast.error('操作失败') }
}

const downloadData = async (type) => {
  try {
    let res
    if (type === 'users') res = await exportApi.downloadUsers()
    else if (type === 'books') res = await exportApi.downloadBooks()
    else if (type === 'logs') res = await exportApi.downloadLogs()
    else res = await exportApi.downloadRunLogs()
    const url = URL.createObjectURL(res)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('下载成功')
  } catch (e) { toast.error('下载失败') }
}

const sendEmail = async (type) => {
  try {
    if (type === 'users') await exportApi.sendUsersEmail()
    else if (type === 'books') await exportApi.sendBooksEmail()
    else if (type === 'logs') await exportApi.sendLogsEmail()
    else await exportApi.sendRunLogsEmail()
    toast.success('已发送到邮箱')
  } catch (e) { toast.error('发送失败') }
}

onMounted(() => {
  loadRecentLogs()
  if (isAdmin.value) {
    loadUsers()
    loadTables()
    loadEmailConfig()
    loadPending()
  }
  loadAlbum()
  // 刷新后若停留在非首页页签，补拉该页签数据
  if (activeTab.value !== 'home') refreshTab(activeTab.value)
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 70px;
}
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-icon { font-size: 24px; }
.head-back {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  min-height: 36px;
}
.head-back:active { background: #e2e8f0; }
.header-left { display: flex; align-items: center; gap: 10px; }
.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-name { font-size: 14px; font-weight: 500; color: #1e293b; }
.user-role {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}
.user-role.admin { background: #eef2ff; color: #6366f1; }
.user-role.user { background: #f0fdf4; color: #10b981; }
.logout-btn {
  padding: 6px 12px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.tab-bar {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.tab-bar::-webkit-scrollbar { display: none; }
.tab-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  min-height: 38px;
}
.tab-btn.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}
.tab-icon { font-size: 14px; }
.tab-badge {
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}
.content { padding: 16px; }
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.view-header h3 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; }
.header-actions { display: flex; gap: 6px; }
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.filter-bar .input { flex: 1; min-width: 150px; }
.action-bar { display: flex; gap: 8px; margin-bottom: 12px; }

/* 首页 */
.welcome-card {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  padding: 20px;
  color: white;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.welcome-text h2 { font-size: 18px; margin-bottom: 4px; }
.welcome-text p { font-size: 13px; opacity: 0.9; }
.welcome-date { font-size: 12px; opacity: 0.8; }
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}
.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.function-item:active { transform: scale(0.96); }
.function-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.function-name { font-size: 12px; color: #475569; }
.recent-list {
  background: white;
  border-radius: 14px;
  padding: 8px 16px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.recent-item:last-child { border-bottom: none; }
.recent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.recent-dot.success { background: #10b981; }
.recent-dot.error { background: #ef4444; }
.recent-info { flex: 1; }
.recent-action { display: block; font-size: 13px; color: #1e293b; }
.recent-time { display: block; font-size: 11px; color: #94a3b8; }
.recent-module { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; }

/* 相册 */
.album-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.album-tab {
  padding: 6px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
}
.album-tab.active {
  background: #6366f1;
  color: white;
}
.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.album-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}
.album-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.video-thumb {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}
.video-thumb img { width: 100%; height: 100%; object-fit: cover; }
.video-icon { font-size: 32px; }
.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}
.album-type {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
}
.album-del {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: white;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.album-del:active { background: #ef4444; }
.album-transcoding {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(245,158,11,0.9);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
}
.img-preview-del {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 26px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 22px;
  background: rgba(239,68,68,0.85);
  color: white;
  font-size: 14px;
  cursor: pointer;
}
.img-preview-del:active { background: #dc2626; }
.img-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.img-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
.video-preview {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  background: #000;
}
.img-preview-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: white;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}
.img-preview-close:hover { background: rgba(255,255,255,0.35); }

/* 导出 */
.export-list { display: flex; flex-direction: column; gap: 10px; }
.export-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 12px;
}
.export-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.export-info { flex: 1; }
.export-name { display: block; font-size: 14px; font-weight: 500; color: #1e293b; }
.export-desc { display: block; font-size: 12px; color: #94a3b8; }
.export-actions { display: flex; gap: 6px; }

/* 配置表单 */
.config-form {
  background: white;
  border-radius: 14px;
  padding: 16px;
}
.config-form .form-group { margin-bottom: 14px; }
.config-form .form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}
.checkbox-group input { width: 16px; height: 16px; }
.btn-block {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  min-height: 44px;
}

/* 日志入口 */
.logs-entry { display: flex; flex-direction: column; gap: 12px; }
.entry-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.entry-card:active { transform: scale(0.98); }
.entry-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.entry-info { flex: 1; }
.entry-info h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
.entry-info p { font-size: 12px; color: #94a3b8; }
.entry-arrow { font-size: 20px; color: #cbd5e1; }

/* 底部导航 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  z-index: 200;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  color: #94a3b8;
  transition: all 0.2s;
}
.nav-item.active { color: #6366f1; }
.nav-icon { font-size: 20px; }
.nav-text { font-size: 10px; white-space: nowrap; }
.nav-add {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  color: white;
  margin-top: -20px;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}
.nav-add .nav-icon { font-size: 24px; }

/* 电脑端适配 */
@media (min-width: 769px) {
  .bottom-nav { display: none; }
  .dashboard { padding-bottom: 0; }
  .function-grid { grid-template-columns: repeat(6, 1fr); }
  .album-grid { grid-template-columns: repeat(6, 1fr); }
}
</style>
