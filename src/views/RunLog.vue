<template>
  <div class="runlog-page">
    <AppHeader show-back @back="goBack" />

    <div class="page-title-bar pc-wrap-inner">
      <h1>运行日志</h1>
      <button class="btn btn-sm" @click="loadCurrent">刷新</button>
    </div>

    <!-- 服务器状态 -->
    <div class="server-status">
      <div class="status-card" v-for="item in statusCards" :key="item.label">
        <div class="status-icon">{{ item.icon }}</div>
        <div class="status-body">
          <div class="status-row">
            <span class="status-label">{{ item.label }}</span>
            <span class="status-value">{{ Math.round(item.value) }}%</span>
          </div>
          <div class="status-bar">
            <div class="status-fill" :style="{width: item.value + '%', background: getColor(item.value)}"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块切换 -->
    <div class="module-tabs">
      <button class="module-tab" :class="{active: module === 'springboot'}" @click="switchModule('springboot')">
        <span class="module-icon">☕</span>
        <span class="module-name">SpringBoot</span>
        <span class="module-size" v-if="fileInfo.springboot">{{ fileInfo.springboot.sizeMB }}MB</span>
      </button>
      <button class="module-tab" :class="{active: module === 'nginx'}" @click="switchModule('nginx')">
        <span class="module-icon">🌐</span>
        <span class="module-name">Nginx</span>
        <span class="module-size" v-if="nginxSize">{{ nginxSize }}MB</span>
      </button>
    </div>

    <!-- Nginx 子标签 -->
    <div v-if="module === 'nginx'" class="sub-tabs">
      <button class="sub-tab" :class="{active: nginxType === 'access'}" @click="switchNginxType('access')">访问日志</button>
      <button class="sub-tab" :class="{active: nginxType === 'error'}" @click="switchNginxType('error')">错误日志</button>
    </div>

    <!-- 工具栏 -->
    <div class="action-toolbar">
      <select v-model.number="lines" @change="loadCurrent" class="toolbar-select">
        <option :value="100">100行</option>
        <option :value="200">200行</option>
        <option :value="500">500行</option>
        <option :value="1000">1000行</option>
      </select>
      <input v-model="keyword" class="toolbar-input" placeholder="关键字过滤" @keyup.enter="loadCurrent" />
      <button class="toolbar-btn" @click="loadCurrent">查询</button>
      <button class="toolbar-btn" :class="{active: autoRefresh}" @click="toggleAutoRefresh">
        {{ autoRefresh ? '⏱ 自动' : '⏸ 自动' }}
      </button>
      <button class="toolbar-btn danger" @click="clearCurrentFile">清空</button>
    </div>

    <!-- 日志信息 -->
    <div class="log-info" v-if="meta.path">
      <span>{{ meta.returnedLines }} 行</span>
      <span class="dot">·</span>
      <span>{{ meta.readAt }}</span>
    </div>

    <!-- 读取失败时给出原因与重试入口，而不是只弹一条转瞬即逝的提示 -->
    <div v-if="readError" class="read-error">
      <span>日志读取失败：{{ readError }}</span>
      <button class="btn btn-sm" @click="loadCurrent">重试</button>
    </div>

    <!-- 日志查看器 -->
    <div class="log-viewer">
      <div v-if="loading" class="log-placeholder">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="!logLines.length" class="log-placeholder">
        <p>{{ keyword ? '无匹配结果' : '暂无日志' }}</p>
      </div>
      <div v-else class="log-content">
        <div v-for="(line, idx) in logLines" :key="idx" class="log-line" :class="lineClass(line)">
          <span class="line-no">{{ idx + 1 }}</span>
          <span class="line-text">{{ line }}</span>
        </div>
      </div>
    </div>

    <BottomNav active="runlog" :is-admin="isAdmin" :permissions="userPermissions" @go="onNav" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import { runLogApi, serverApi } from '../api'
import { auth, toast, confirm } from '../utils'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  if (window.history.state && window.history.state.back) router.back()
  else router.push('/dashboard')
}

// 底部导航：操作日志 / 运行日志 / 我的已由 BottomNav 组件统一跳转
const onNav = (key) => {
  if (key === 'home') router.push('/dashboard')
  else if (key === 'album') router.push('/dashboard?tab=album')
  else if (key === 'add') router.push('/dashboard?tab=album&upload=1')
}

const isAdmin = computed(() => auth.isAdmin())
const userPermissions = computed(() => auth.getPermissions())

const module = ref('springboot')
const nginxType = ref('access')
const lines = ref(200)
const keyword = ref('')
const loading = ref(false)
const autoRefresh = ref(true)
const readError = ref('')
const logLines = ref([])
const meta = reactive({ path: '', returnedLines: 0, readAt: '', sizeMB: '0' })
const fileInfo = reactive({ springboot: null, 'nginx-access': null, 'nginx-error': null })
let refreshTimer = null

const serverStatus = reactive({ cpuUsage: 0, memoryUsage: 0, jvmUsage: 0, diskUsage: 0 })

const statusCards = computed(() => [
  { icon: '🖥️', label: 'CPU', value: serverStatus.cpuUsage },
  { icon: '💾', label: '内存', value: serverStatus.memoryUsage },
  { icon: '☕', label: 'JVM', value: serverStatus.jvmUsage },
  { icon: '💿', label: '磁盘', value: serverStatus.diskUsage }
])

const nginxSize = computed(() => {
  const f = nginxType.value === 'error' ? fileInfo['nginx-error'] : fileInfo['nginx-access']
  return f ? f.sizeMB : ''
})

const currentFileKey = computed(() => {
  if (module.value === 'springboot') return 'springboot'
  return nginxType.value === 'error' ? 'nginx-error' : 'nginx-access'
})

const getColor = (val) => {
  const v = val || 0
  if (v > 80) return '#ef4444'
  if (v > 60) return '#f59e0b'
  return '#10b981'
}

const lineClass = (line) => {
  const l = line || ''
  if (/\bERROR\b|Exception|\[error\]|CRITICAL|Failed|失败/i.test(l)) return 'line-error'
  if (/\bWARN\b|\[warn\]/i.test(l)) return 'line-warn'
  if (/ (40[0-9]|41[0-9]|50[0-9]) /.test(l)) return 'line-error'
  return ''
}

const loadServerStatus = async () => {
  try {
    const res = await serverApi.status()
    if (res.code === 200 && res.data) {
      const d = res.data
      serverStatus.cpuUsage = d.cpu?.processCpuLoad ?? d.cpuUsage ?? 0
      serverStatus.memoryUsage = d.memory?.usagePercent ?? d.memoryUsage ?? 0
      serverStatus.jvmUsage = d.jvm?.usagePercent ?? d.jvmUsage ?? 0
      serverStatus.diskUsage = d.disk?.usagePercent ?? d.diskUsage ?? 0
    }
  } catch (e) {}
}

const loadFiles = async () => {
  try {
    const res = await runLogApi.files()
    if (res.code === 200 && Array.isArray(res.data)) {
      res.data.forEach(f => { fileInfo[f.module] = f })
    }
  } catch (e) {}
}

const loadCurrent = async () => {
  loading.value = true
  try {
    const params = { lines: lines.value }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = module.value === 'springboot'
      ? await runLogApi.springboot(params)
      : await runLogApi.nginx({ ...params, type: nginxType.value })

    if (res.code === 200 && res.data) {
      readError.value = ''
      logLines.value = res.data.lines || []
      meta.path = res.data.path || ''
      meta.returnedLines = res.data.returnedLines || 0
      meta.readAt = res.data.readAt || ''
    } else {
      logLines.value = []
      readError.value = res.msg || '接口返回异常'
      toast.error(readError.value)
    }
  } catch (e) {
    logLines.value = []
    readError.value = e?.response?.data?.msg || '网络异常，请稍后重试'
    toast.error(readError.value)
  } finally {
    loading.value = false
  }
}

const switchModule = (m) => {
  if (module.value === m) return
  module.value = m
  keyword.value = ''
  loadCurrent()
}

const switchNginxType = (t) => {
  if (nginxType.value === t) return
  nginxType.value = t
  loadCurrent()
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => { loadCurrent(); loadServerStatus() }, 10000)
    toast.info('自动刷新已开启（10秒）')
  } else {
    clearInterval(refreshTimer)
    refreshTimer = null
    toast.info('自动刷新已关闭')
  }
}

const clearCurrentFile = async () => {
  const label = module.value === 'springboot' ? 'SpringBoot 日志' : 'Nginx 日志'
  const ok = await confirm('清空日志', `确定要清空「${label}」吗？此操作不可恢复。`)
  if (!ok) return
  try {
    const res = await runLogApi.clearFile(currentFileKey.value)
    if (res.code === 200) {
      toast.success('已清空')
      logLines.value = []
      loadFiles()
    } else {
      toast.error(res.msg || '清空失败')
    }
  } catch (e) {
    toast.error(e?.response?.data?.msg || '清空失败')
  }
}

onMounted(() => {
  loadServerStatus()
  loadFiles()
  loadCurrent()
  // 默认开启自动刷新
  autoRefresh.value = true
  refreshTimer = setInterval(() => { loadCurrent(); loadServerStatus() }, 10000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
/* 桌面端读取失败提示 */
.read-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 14px 10px;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 13px;
}
.runlog-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.page-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px 10px;
}
.page-title-bar h1 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

/* 服务器状态 */
.server-status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 14px 10px;
}
.status-card {
  background: white;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e2e8f0;
}
.status-icon { font-size: 18px; }
.status-body { flex: 1; }
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.status-label { font-size: 11px; color: #64748b; }
.status-value { font-size: 14px; font-weight: 700; color: #1e293b; }
.status-bar {
  height: 4px;
  background: #f1f5f9;
  border-radius: 2px;
  overflow: hidden;
}
.status-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

/* 模块切换 */
.module-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 14px 10px;
}
.module-tab {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.module-tab.active {
  border-color: #6366f1;
  background: #eef2ff;
}
.module-icon { font-size: 18px; }
.module-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}
.module-tab.active .module-name { color: #4f46e5; }
.module-size {
  font-size: 10px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 子标签 */
.sub-tabs {
  display: flex;
  gap: 6px;
  padding: 0 14px 10px;
}
.sub-tab {
  flex: 1;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
}
.sub-tab.active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
  font-weight: 600;
}

/* 工具栏 */
.action-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 0 14px 8px;
}
.toolbar-select {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  background: white;
  color: #334155;
}
.toolbar-input {
  flex: 1;
  min-width: 100px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  min-height: 32px;
}
.toolbar-btn {
  padding: 6px 10px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  color: #334155;
  cursor: pointer;
}
.toolbar-btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}
.toolbar-btn.danger {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

/* 日志信息 */
.log-info {
  display: flex;
  gap: 6px;
  padding: 0 14px 6px;
  font-size: 11px;
  color: #94a3b8;
}
.log-info .dot { color: #cbd5e1; }

/* 日志查看器 */
.log-viewer {
  margin: 0 14px;
  background: #0f172a;
  border-radius: 10px;
  overflow: hidden;
  min-height: 200px;
}
.log-content {
  max-height: 55vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 0;
}
.log-line {
  display: flex;
  gap: 8px;
  padding: 1px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #cbd5e1;
}
.line-no {
  flex: 0 0 30px;
  text-align: right;
  color: #475569;
  user-select: none;
}
.line-text {
  white-space: pre-wrap;
  word-break: break-all;
  flex: 1;
}
.log-line.line-error {
  color: #fca5a5;
  background: rgba(239,68,68,0.10);
}
.log-line.line-warn {
  color: #fcd34d;
  background: rgba(245,158,11,0.08);
}

.log-placeholder {
  padding: 40px 16px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}
.spinner {
  width: 24px;
  height: 24px;
  margin: 0 auto 8px;
  border: 2px solid #334155;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---------- 桌面端（≥769px）：整页限宽居中，状态卡与日志区按屏幕扩展 ---------- */
@media (min-width: 769px) {
  .runlog-page { padding-bottom: 0; }
  .page-title-bar, .server-status, .module-tabs, .sub-tabs, .action-toolbar,
  .log-info, .log-viewer, .read-error {
    max-width: 1240px;
    margin-left: auto;
    margin-right: auto;
  }
  .page-title-bar { padding: 18px 24px 12px; }
  .server-status { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; padding: 0 24px; }
  .module-tabs, .sub-tabs, .action-toolbar { padding-left: 24px; padding-right: 24px; }
  .action-toolbar { flex-wrap: wrap; }
  .toolbar-input { max-width: 320px; }
  .log-info { padding: 10px 24px 0; }
  .log-viewer { margin: 10px 24px 24px; }
  /* 日志是这页的主体，桌面端给足高度；行距也放宽便于长文本阅读 */
  .log-content { max-height: calc(100vh - 330px); min-height: 420px; }
  .log-line { line-height: 1.65; }
  .status-card { padding: 14px 16px; }
  .log-line { font-size: 12px; }
  .read-error { margin: 0 24px 10px; }
}
</style>