<template>
  <div class="runlog-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1>运行日志</h1>
      <button class="btn btn-sm" @click="loadAll">刷新</button>
    </div>

    <!-- 服务器状态 -->
    <div class="server-status">
      <div class="status-card">
        <div class="status-icon">🖥️</div>
        <div class="status-info">
          <span class="status-label">CPU使用率</span>
          <span class="status-value">{{ serverStatus.cpuUsage || 0 }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.cpuUsage || 0) + '%', background: getColor(serverStatus.cpuUsage)}"></div>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">💾</div>
        <div class="status-info">
          <span class="status-label">内存占用</span>
          <span class="status-value">{{ serverStatus.memoryUsage || 0 }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.memoryUsage || 0) + '%', background: getColor(serverStatus.memoryUsage)}"></div>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">☕</div>
        <div class="status-info">
          <span class="status-label">JVM内存</span>
          <span class="status-value">{{ serverStatus.jvmUsage || 0 }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.jvmUsage || 0) + '%', background: getColor(serverStatus.jvmUsage)}"></div>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">💿</div>
        <div class="status-info">
          <span class="status-label">磁盘使用</span>
          <span class="status-value">{{ serverStatus.diskUsage || 0 }}%</span>
        </div>
        <div class="status-bar">
          <div class="status-fill" :style="{width: (serverStatus.diskUsage || 0) + '%', background: getColor(serverStatus.diskUsage)}"></div>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">🧵</div>
        <div class="status-info">
          <span class="status-label">线程数</span>
          <span class="status-value">{{ serverStatus.threadCount || 0 }}</span>
        </div>
      </div>
      <div class="status-card">
        <div class="status-icon">⏱️</div>
        <div class="status-info">
          <span class="status-label">运行时长</span>
          <span class="status-value">{{ formatUptime(serverStatus.uptime) }}</span>
        </div>
      </div>
    </div>

    <div class="action-toolbar">
      <button class="btn btn-sm" :class="{active: autoRefresh}" @click="toggleAutoRefresh">
        {{ autoRefresh ? '🔄 自动刷新' : '⏸ 自动刷新' }}
      </button>
      <select class="select" v-model="levelFilter" @change="loadLogs" style="width:auto;min-height:34px;padding:6px 10px;font-size:12px;">
        <option value="">全部级别</option>
        <option value="INFO">INFO</option>
        <option value="WARN">WARN</option>
        <option value="ERROR">ERROR</option>
      </select>
      <button class="btn btn-sm btn-danger" @click="clearAll">清空所有</button>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-dot" style="background:#3b82f6;"></span>
        <span>INFO</span>
        <strong>{{ stats.info || 0 }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-dot" style="background:#f59e0b;"></span>
        <span>WARN</span>
        <strong>{{ stats.warn || 0 }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-dot" style="background:#ef4444;"></span>
        <span>ERROR</span>
        <strong>{{ stats.error || 0 }}</strong>
      </div>
    </div>

    <div class="mobile-card-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="logs.length === 0" class="empty-state">暂无运行日志</div>
      <div v-for="log in filteredLogs" :key="log.id" class="mobile-card log-card" @click="showDetail(log)">
        <div class="mobile-card-header">
          <div class="mobile-card-title" style="font-family:monospace;font-size:12px;">{{ log.className || log.loggerName }}</div>
          <span class="mobile-card-badge" :class="getLevelClass(log.level)">{{ log.level }}</span>
        </div>
        <div class="mobile-card-body">
          <div class="log-message">{{ log.message || log.content }}</div>
          <div class="mobile-card-row" style="margin-top:8px;">
            <span class="label">方法</span>
            <span class="value">{{ log.methodName || '-' }}</span>
          </div>
          <div class="mobile-card-row">
            <span class="label">耗时</span>
            <span class="value">{{ log.duration != null ? log.duration + 'ms' : '-' }}</span>
          </div>
          <div class="mobile-card-row">
            <span class="label">时间</span>
            <span class="value">{{ log.createTime }}</span>
          </div>
        </div>
      </div>
    </div>

    <Pagination :total="total" v-model:currentPage="currentPage" v-model:pageSize="pageSize" @change="loadLogs" />

    <!-- 详情弹窗 -->
    <div v-if="detailLog" class="modal-overlay" @click.self="detailLog = null">
      <div class="modal">
        <div class="modal-header">
          <h3>运行日志详情</h3>
          <button class="modal-close" @click="detailLog = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row"><span class="detail-label">级别</span><span class="detail-value" :class="getLevelClass(detailLog.level)">{{ detailLog.level }}</span></div>
          <div class="detail-row"><span class="detail-label">类名</span><span class="detail-value" style="font-family:monospace;font-size:11px;">{{ detailLog.className }}</span></div>
          <div class="detail-row"><span class="detail-label">方法</span><span class="detail-value">{{ detailLog.methodName }}</span></div>
          <div class="detail-row"><span class="detail-label">耗时</span><span class="detail-value">{{ detailLog.duration != null ? detailLog.duration + 'ms' : '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">时间</span><span class="detail-value">{{ detailLog.createTime }}</span></div>
          <div class="detail-row"><span class="detail-label">消息</span><span class="detail-value" style="font-family:monospace;font-size:11px;white-space:pre-wrap;">{{ detailLog.message }}</span></div>
          <div class="detail-row" v-if="detailLog.params"><span class="detail-label">入参</span><span class="detail-value detail-json">{{ detailLog.params }}</span></div>
          <div class="detail-row" v-if="detailLog.result"><span class="detail-label">返回值</span><span class="detail-value detail-json">{{ detailLog.result }}</span></div>
          <div class="detail-row" v-if="detailLog.exception"><span class="detail-label">异常</span><span class="detail-value detail-json" style="color:#dc2626;">{{ detailLog.exception }}</span></div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary btn-block" @click="detailLog = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import Pagination from '../components/Pagination.vue'
import { runLogApi, serverApi } from '../api'
import { toast, confirm } from '../utils'

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const autoRefresh = ref(true)
const levelFilter = ref('')
const detailLog = ref(null)
let refreshTimer = null

const serverStatus = reactive({
  cpuUsage: 0, memoryUsage: 0, jvmUsage: 0,
  diskUsage: 0, threadCount: 0, uptime: 0
})

const stats = reactive({ info: 0, warn: 0, error: 0 })

const filteredLogs = computed(() => {
  if (!levelFilter.value) return logs.value
  return logs.value.filter(l => l.level === levelFilter.value)
})

const getColor = (val) => {
  if (val > 80) return '#ef4444'
  if (val > 60) return '#f59e0b'
  return '#10b981'
}

const getLevelClass = (level) => {
  if (level === 'ERROR') return 'danger'
  if (level === 'WARN') return 'warning'
  return 'info'
}

const formatUptime = (ms) => {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${mins}分`
  return `${mins}分钟`
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
      serverStatus.threadCount = d.threads?.current ?? d.threadCount ?? 0
      serverStatus.uptime = d.runtime?.uptimeMs ?? d.runtime?.uptime ?? d.uptime ?? 0
    }
  } catch (e) {}
}

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await runLogApi.list({
      page: currentPage.value,
      size: pageSize.value
    })
    if (res.code === 200) {
      logs.value = res.data?.records || res.data?.list || res.data || []
      total.value = res.data?.total || logs.value.length
    }
  } catch (e) {
    toast.error('加载运行日志失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await runLogApi.stats()
    if (res.code === 200 && res.data) {
      stats.info = res.data.info || 0
      stats.warn = res.data.warn || 0
      stats.error = res.data.error || 0
    }
  } catch (e) {}
}

const loadAll = () => {
  loadServerStatus()
  loadLogs()
  loadStats()
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(loadAll, 3000)
    toast.info('已开启自动刷新（3秒）')
  } else {
    clearInterval(refreshTimer)
    toast.info('已关闭自动刷新')
  }
}

const clearAll = async () => {
  const ok = await confirm('清空日志', '确定要清空所有运行日志吗？')
  if (!ok) return
  try {
    await runLogApi.clearAll()
    toast.success('已清空')
    loadLogs()
    loadStats()
  } catch (e) {
    toast.error('清空失败')
  }
}

const showDetail = (log) => {
  detailLog.value = log
}

onMounted(() => {
  loadAll()
  refreshTimer = setInterval(loadAll, 3000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.runlog-page {
  min-height: 100vh;
  background: #f8fafc;
  overflow-x: hidden;
  max-width: 100vw;
}
.mobile-card-title {
  word-break: break-all;
  overflow-wrap: anywhere;
}
.log-card .log-message {
  word-break: break-all;
  overflow-wrap: anywhere;
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
.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-label { font-size: 11px; color: #64748b; }
.status-value { font-size: 16px; font-weight: 700; color: #1e293b; }
.status-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}
.status-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.log-card .log-message {
  font-size: 12px;
  color: #334155;
  line-height: 1.5;
  font-family: monospace;
  background: #f8fafc;
  padding: 8px;
  border-radius: 6px;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.detail-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}
.detail-label {
  color: #64748b;
  min-width: 60px;
  flex-shrink: 0;
}
.detail-value {
  color: #1e293b;
  flex: 1;
  word-break: break-all;
}
.detail-value.danger { color: #dc2626; font-weight: 600; }
.detail-value.warning { color: #d97706; font-weight: 600; }
.detail-value.info { color: #2563eb; font-weight: 600; }
.detail-json {
  font-family: monospace;
  font-size: 11px;
  background: #f8fafc;
  padding: 8px;
  border-radius: 6px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
}
@media (max-width: 768px) {
  .page-header {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px;
  }
  .page-header h1 {
    font-size: 18px;
    flex: 1;
    min-width: 0;
  }
  .action-toolbar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 16px 12px;
  }
  .action-toolbar .select,
  .action-toolbar .btn {
    flex: 1 1 auto;
    min-width: 0;
  }
  .stats-bar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 16px 12px;
  }
  .stat-item {
    flex: 1 1 30%;
    justify-content: center;
  }
  .server-status {
    gap: 8px;
    padding: 0 12px 12px;
  }
  .status-card {
    padding: 10px;
  }
  .status-value { font-size: 14px; }
  .modal {
    width: calc(100% - 24px);
    max-height: 85vh;
    overflow-y: auto;
  }
  .modal-body { padding: 12px; }
  .detail-row {
    flex-direction: column;
    gap: 2px;
  }
  .detail-label { min-width: 0; }
}
@media (max-width: 380px) {
  .server-status { grid-template-columns: 1fr; }
}
@media (min-width: 769px) {
  .server-status { grid-template-columns: repeat(3, 1fr); }
}
</style>
