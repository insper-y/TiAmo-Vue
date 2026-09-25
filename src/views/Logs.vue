<template>
  <div class="logs-page">
    <AppHeader show-back @back="goBack" />

    <div class="page-title-bar">
      <h1>操作日志</h1>
      <button class="btn btn-sm" @click="loadLogs">刷新</button>
    </div>

    <div class="action-toolbar">
      <button class="btn btn-sm" :class="{active: autoRefresh}" @click="toggleAutoRefresh">
        {{ autoRefresh ? '🔄 自动刷新中' : '⏸ 自动刷新' }}
      </button>
      <select class="select" v-model="pageSize" @change="loadLogs" style="width:auto;min-height:34px;padding:6px 10px;font-size:12px;">
        <option :value="10">10条/页</option>
        <option :value="20">20条/页</option>
        <option :value="50">50条/页</option>
      </select>
      <button class="btn btn-sm btn-danger" @click="clearAll">清空所有</button>
    </div>

    <div class="filter-panel">
      <div class="filter-item">
        <label>模块</label>
        <select class="select" v-model="filters.module" @change="loadLogs">
          <option value="">全部</option>
          <option v-for="m in modules" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>类型</label>
        <select class="select" v-model="filters.type" @change="loadLogs">
          <option value="">全部</option>
          <option value="LOGIN">登录/登出</option>
          <option value="QUERY">查询/查看</option>
          <option value="CREATE">新增/上传</option>
          <option value="UPDATE">修改/更新</option>
          <option value="DELETE">删除/清空</option>
          <option value="EXPORT">导出/发送</option>
          <option value="IMPORT">导入/恢复</option>
          <option value="CONFIG">配置/设置</option>
          <option value="OTHER">其他</option>
        </select>
      </div>
      <div class="filter-item">
        <label>状态</label>
        <select class="select" v-model="filters.status" @change="loadLogs">
          <option value="">全部</option>
          <option value="SUCCESS">成功</option>
          <option value="FAIL">失败</option>
        </select>
      </div>
      <div class="filter-item" style="flex:1;min-width:150px;">
        <input class="input" v-model="filters.operator" placeholder="操作人" @keyup.enter="loadLogs" />
      </div>
      <button class="btn btn-sm" @click="resetFilters">重置</button>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-dot" style="background:#6366f1;"></span>
        <span>总记录</span>
        <strong>{{ stats.total || 0 }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-dot" style="background:#10b981;"></span>
        <span>成功</span>
        <strong>{{ stats.success || 0 }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-dot" style="background:#ef4444;"></span>
        <span>失败</span>
        <strong>{{ stats.error || 0 }}</strong>
      </div>
    </div>

    <div class="mobile-card-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="logs.length === 0" class="empty-state">暂无日志记录</div>
      <div v-for="log in logs" :key="log.id" class="mobile-card" @click="showDetail(log)">
        <div class="mobile-card-header">
          <div class="mobile-card-title">{{ log.operation }}</div>
          <span class="mobile-card-badge" :class="log.status === '成功' ? 'success' : 'danger'">
            {{ log.status }}
          </span>
        </div>
        <div class="mobile-card-body">
          <div class="mobile-card-row"><span class="label">模块</span><span class="value">{{ log.module }}</span></div>
          <div class="mobile-card-row"><span class="label">操作人</span><span class="value">{{ log.operator }}</span></div>
          <div class="mobile-card-row"><span class="label">IP</span><span class="value">{{ log.ip || '-' }}</span></div>
          <div class="mobile-card-row"><span class="label">位置</span><span class="value">{{ log.location || '-' }}</span></div>
          <div class="mobile-card-row"><span class="label">时间</span><span class="value">{{ log.createTime }}</span></div>
        </div>
      </div>
    </div>

    <Pagination :total="total" v-model:currentPage="currentPage" v-model:pageSize="pageSize" @change="loadLogs" />

    <!-- 详情弹窗 -->
    <div v-if="detailLog" class="modal-overlay" @click.self="detailLog = null">
      <div class="modal">
        <div class="modal-header">
          <h3>日志详情</h3>
          <button class="modal-close" @click="detailLog = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row"><span class="detail-label">操作</span><span class="detail-value">{{ detailLog.operation }}</span></div>
          <div class="detail-row"><span class="detail-label">模块</span><span class="detail-value">{{ detailLog.module }}</span></div>
          <div class="detail-row"><span class="detail-label">类型</span><span class="detail-value">{{ detailLog.type }}</span></div>
          <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value" :style="{color: detailLog.status === '成功' ? '#059669' : '#dc2626'}">{{ detailLog.status }}</span></div>
          <div class="detail-row"><span class="detail-label">操作人</span><span class="detail-value">{{ detailLog.operator }}</span></div>
          <div class="detail-row"><span class="detail-label">IP地址</span><span class="detail-value">{{ detailLog.ip || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">位置</span><span class="detail-value">{{ detailLog.location || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">时间</span><span class="detail-value">{{ detailLog.createTime }}</span></div>
          <div class="detail-row" v-if="detailLog.requestParams"><span class="detail-label">请求参数</span><span class="detail-value detail-json">{{ detailLog.requestParams }}</span></div>
          <div class="detail-row" v-if="detailLog.responseResult"><span class="detail-label">响应结果</span><span class="detail-value detail-json">{{ detailLog.responseResult }}</span></div>
          <div class="detail-row" v-if="detailLog.errorMsg"><span class="detail-label">错误信息</span><span class="detail-value" style="color:#dc2626;">{{ detailLog.errorMsg }}</span></div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary btn-block" @click="detailLog = null">关闭</button>
        </div>
      </div>
    </div>

    <BottomNav active="logs" :is-admin="true" @go="onNav" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Pagination from '../components/Pagination.vue'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import { logApi } from '../api'
import { toast, confirm } from '../utils'

const router = useRouter()
const route = useRoute()
// 返回：有历史记录则回退，直接进入时回到控制台
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

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const autoRefresh = ref(false)
const detailLog = ref(null)
let refreshTimer = null

const stats = reactive({ total: 0, success: 0, error: 0 })

const filters = reactive({
  module: '',
  type: '',
  status: '',
  operator: ''
})

// 与后端 @OperationLog(module=...) 中出现的模块名保持一致
const modules = ['认证管理', '用户管理', '商品管理', '相册管理', '回收站', '审批管理', '数据库管理', '数据导出', '系统设置', '日志管理']

const loadLogs = async () => {
  loading.value = true
  try {
    // 后端接收的字段是 operationType / username，不能直接把 filters 展开过去
    const res = await logApi.list({
      page: currentPage.value,
      size: pageSize.value,
      module: filters.module || undefined,
      operationType: filters.type || undefined,
      status: filters.status || undefined,
      username: filters.operator || undefined
    })
    if (res.code === 200) {
      logs.value = res.data?.records || res.data?.list || res.data || []
      total.value = res.data?.total || logs.value.length
    }
  } catch (e) {
    toast.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await logApi.stats()
    if (res.code === 200 && res.data) {
      stats.total = res.data.total || 0
      stats.success = res.data.success || 0
      stats.error = res.data.fail ?? res.data.error ?? 0
    }
  } catch (e) {}
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => {
      loadLogs()
      loadStats()
    }, 10000)
    toast.info('已开启自动刷新（10秒）')
  } else {
    clearInterval(refreshTimer)
    toast.info('已关闭自动刷新')
  }
}

const resetFilters = () => {
  filters.module = ''
  filters.type = ''
  filters.status = ''
  filters.operator = ''
  currentPage.value = 1
  loadLogs()
}

const clearAll = async () => {
  const ok = await confirm('清空日志', '确定要清空所有操作日志吗？此操作不可恢复！')
  if (!ok) return
  try {
    // 后端没有 clear-all 接口，用 clean(days=0) 表示「清理此刻之前的全部日志」
    const res = await logApi.clean(0)
    if (res && res.code && res.code !== 200) {
      toast.error(res.msg || '清空失败')
      return
    }
    toast.success(res?.msg || '已清空所有日志')
    loadLogs()
    loadStats()
  } catch (e) {
    toast.error(e?.response?.data?.msg || '清空失败')
  }
}

const showDetail = (log) => {
  detailLog.value = log
}

onMounted(() => {
  loadLogs()
  loadStats()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
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
@media (min-width: 769px) {
  .page-title-bar { padding: 16px 24px 12px; }
  .logs-page { padding-bottom: 0; }
}
.logs-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(90px + env(safe-area-inset-bottom));
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
  min-width: 80px;
  flex-shrink: 0;
}
.detail-value {
  color: #1e293b;
  flex: 1;
  word-break: break-all;
}
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
</style>


