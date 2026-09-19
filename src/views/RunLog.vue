<template>
  <div class="runlog-page">
    <AppHeader show-back @back="goBack" />

    <div class="page-title-bar">
      <h1>运行日志</h1>
      <button class="btn btn-sm" @click="loadCurrent">刷新</button>
    </div>

    <!-- 服务器状态 -->
    <div class="server-status">
      <div class="status-card">
        <div class="status-icon">🖥️</div>
        <div class="status-info">
          <span class="status-label">CPU使用率</span>
          <span class="status-value">{{ Math.round(serverStatus.cpuUsage || 0) }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.cpuUsage || 0) + '%', background: getColor(serverStatus.cpuUsage)}"></div>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">💾</div>
        <div class="status-info">
          <span class="status-label">内存占用</span>
          <span class="status-value">{{ Math.round(serverStatus.memoryUsage || 0) }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.memoryUsage || 0) + '%', background: getColor(serverStatus.memoryUsage)}"></div>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">☕</div>
        <div class="status-info">
          <span class="status-label">JVM内存</span>
          <span class="status-value">{{ Math.round(serverStatus.jvmUsage || 0) }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.jvmUsage || 0) + '%', background: getColor(serverStatus.jvmUsage)}"></div>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">💿</div>
        <div class="status-info">
          <span class="status-label">磁盘使用</span>
          <span class="status-value">{{ Math.round(serverStatus.diskUsage || 0) }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.diskUsage || 0) + '%', background: getColor(serverStatus.diskUsage)}"></div>
        </div>
      </div>
    </div>

    <!-- 两个模块切换 -->
    <div class="module-tabs">
      <button class="module-tab" :class="{active: module === 'springboot'}" @click="switchModule('springboot')">
        <span class="module-icon">☕</span>
        <span class="module-name">SpringBoot 运行日志</span>
        <span class="module-meta" v-if="fileInfo.springboot">{{ fileInfo.springboot.sizeMB }} MB</span>
      </button>
      <button class="module-tab" :class="{active: module === 'nginx'}" @click="switchModule('nginx')">
        <span class="module-icon">🌐</span>
        <span class="module-name">Nginx 运行日志</span>
        <span class="module-meta" v-if="nginxSize">{{ nginxSize }} MB</span>
      </button>
    </div>

    <!-- Nginx 模块下的子日志切换 -->
    <div v-if="module === 'nginx'" class="sub-tabs">
      <button class="sub-tab" :class="{active: nginxType === 'access'}" @click="switchNginxType('access')">访问日志</button>
      <button class="sub-tab" :class="{active: nginxType === 'error'}" @click="switchNginxType('error')">错误日志</button>
    </div>

    <div class="action-toolbar">
      <select class="select" v-model.number="lines" @change="loadCurrent" style="width:auto;min-height:34px;padding:6px 10px;font-size:12px;">
        <option :value="100">最近 100 行</option>
        <option :value="200">最近 200 行</option>
        <option :value="500">最近 500 行</option>
        <option :value="1000">最近 1000 行</option>
        <option :value="2000">最近 2000 行</option>
      </select>
      <input v-model="keyword" class="input" placeholder="关键字过滤，如 ERROR" @keyup.enter="loadCurrent"
             style="flex:1;min-width:120px;height:34px;padding:6px 10px;font-size:12px;" />
      <button class="btn btn-sm" @click="loadCurrent">查询</button>
      <button class="btn btn-sm" :class="{active: autoRefresh}" @click="toggleAutoRefresh">
        {{ autoRefresh ? '🔄 自动' : '⏸ 自动' }}
      </button>
      <button class="btn btn-sm btn-danger" @click="clearCurrentFile">清空</button>
    </div>

    <div class="log-meta" v-if="meta.path">
      <span>文件：{{ meta.path }}</span>
      <span>返回 {{ meta.returnedLines || 0 }} 行</span>
      <span>读取于 {{ meta.readAt || '-' }}</span>
    </div>

    <div class="log-viewer">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>日志读取中...</p>
      </div>
      <div v-else-if="!logLines.length" class="empty-state">
        {{ keyword ? '没有匹配「' + keyword + '」的日志' : '暂无日志内容' }}
      </div>
      <div v-else class="log-lines">
        <div v-for="(line, idx) in logLines" :key="idx" class="log-line" :class="lineClass(line)">
          <span class="log-no">{{ idx + 1 }}</span>
          <span class="log-text">{{ line }}</span>
        </div>
      </div>
    </div>

    <BottomNav active="runlog" @go="onNav" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import { runLogApi, serverApi } from '../api'
import { toast, confirm } from '../utils'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  if (window.history.state && window.history.state.back) router.back()
  else router.push('/dashboard')
}

// 底部导航跳转
const onNav = (key) => {
  if (key === 'home') router.push('/dashboard')
  else if (key === 'album') router.push('/dashboard?tab=album')
  else if (key === 'add') router.push('/dashboard?tab=album&upload=1')
  else if (key === 'logs' && route.path !== '/logs') router.push('/logs')
  else if (key === 'runlog' && route.path !== '/run-log') router.push('/run-log')
}

// 模块：springboot | nginx
const module = ref('springboot')
const nginxType = ref('access')
const lines = ref(200)
const keyword = ref('')
const loading = ref(false)
const autoRefresh = ref(false)
const logLines = ref([])
const meta = reactive({ path: '', returnedLines: 0, readAt: '', sizeMB: '0' })
const fileInfo = reactive({ springboot: null, 'nginx-access': null, 'nginx-error': null })
let refreshTimer = null

const serverStatus = reactive({ cpuUsage: 0, memoryUsage: 0, jvmUsage: 0, diskUsage: 0 })

const nginxSize = computed(() => {
  const f = nginxType.value === 'error' ? fileInfo['nginx-error'] : fileInfo['nginx-access']
  return f ? f.sizeMB : ''
})

// 当前模块对应的后端文件标识
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

// 按日志内容着色，便于快速定位错误
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
  } catch (e) { /* 状态获取失败不影响日志查看 */ }
}

const loadFiles = async () => {
  try {
    const res = await runLogApi.files()
    if (res.code === 200 && Array.isArray(res.data)) {
      res.data.forEach(f => { fileInfo[f.module] = f })
    }
  } catch (e) { /* 忽略 */ }
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
      logLines.value = res.data.lines || []
      meta.path = res.data.path || ''
      meta.returnedLines = res.data.returnedLines || 0
      meta.readAt = res.data.readAt || ''
      meta.sizeMB = res.data.sizeMB || '0'
      // 倒序展示：最新日志在最上面
      logLines.value = [...logLines.value].reverse()
    } else {
      logLines.value = []
      toast.error(res.msg || '日志读取失败')
    }
  } catch (e) {
    logLines.value = []
    const msg = e?.response?.data?.msg || e?.message || '日志读取失败'
    toast.error(msg)
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
    toast.info('已开启自动刷新（10秒）')
  } else {
    clearInterval(refreshTimer)
    refreshTimer = null
    toast.info('已关闭自动刷新')
  }
}

const clearCurrentFile = async () => {
  const label = module.value === 'springboot'
    ? 'SpringBoot 运行日志'
    : `Nginx ${nginxType.value === 'error' ? '错误' : '访问'}日志`
  const ok = await confirm('清空日志', `确定要清空「${label}」文件的全部内容吗？此操作不可恢复。`)
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
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
@media (min-width: 769px) {
  .page-title-bar { padding: 16px 24px 12px; }
  .runlog-page { padding-bottom: 0; }
}
.runlog-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(90px + env(safe-area-inset-bottom));
  overflow-x: hidden;
  max-width: 100vw;
}
.page-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
}
.page-title-bar h1 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.server-status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 16px 12px;
}
.status-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.status-icon { font-size: 20px; }
.status-info { display: flex; justify-content: space-between; align-items: center; }
.status-label { font-size: 11px; color: #64748b; }
.status-value { font-size: 16px; font-weight: 700; color: #1e293b; }
.status-bar { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.status-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }

/* 模块切换 */
.module-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 16px 10px;
}
.module-tab {
  background: white;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.module-tab.active {
  border-color: #6366f1;
  background: #eef2ff;
}
.module-icon { font-size: 20px; }
.module-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.module-tab.active .module-name { color: #4f46e5; }
.module-meta { font-size: 11px; color: #94a3b8; }

.sub-tabs {
  display: flex;
  gap: 8px;
  padding: 0 16px 10px;
}
.sub-tab {
  flex: 1;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 10px;
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

.action-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 0 16px 10px;
}
.action-toolbar .btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.log-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 16px 8px;
  font-size: 11px;
  color: #94a3b8;
  word-break: break-all;
}

.log-viewer {
  margin: 0 16px;
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
  min-height: 200px;
}
.log-lines {
  max-height: 60vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0;
}
.log-line {
  display: flex;
  gap: 8px;
  padding: 2px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #cbd5e1;
}
.log-no {
  flex: 0 0 34px;
  text-align: right;
  color: #475569;
  user-select: none;
}
.log-text {
  white-space: pre-wrap;
  word-break: break-all;
  flex: 1;
}
.log-line.line-error { color: #fca5a5; background: rgba(239,68,68,0.10); }
.log-line.line-warn { color: #fcd34d; background: rgba(245,158,11,0.08); }
.loading-state, .empty-state {
  padding: 40px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
.loading-spinner {
  width: 28px;
  height: 28px;
  margin: 0 auto 10px;
  border: 3px solid #334155;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
