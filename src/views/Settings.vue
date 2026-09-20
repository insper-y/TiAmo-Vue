<template>
  <div class="settings-page">
    <AppHeader show-back @back="goBack" />

    <div class="page-title-bar">
      <h1>系统设置</h1>
      <button class="btn btn-sm" @click="loadAll">刷新</button>
    </div>

    <div v-if="!isAdmin" class="empty-state">仅管理员可访问系统设置</div>

    <template v-else>
      <!-- 当前账号 -->
      <section class="card">
        <div class="card-head">
          <h2>👤 当前账号</h2>
        </div>
        <div class="card-body">
          <div class="kv"><span>用户名</span><strong>{{ profile.username || '-' }}</strong></div>
          <div class="kv"><span>昵称</span><strong>{{ profile.nickname || '-' }}</strong></div>
          <div class="kv"><span>邮箱</span><strong>{{ profile.email || '-' }}</strong></div>
          <div class="kv"><span>角色</span><strong>{{ profile.roleName || '-' }}</strong></div>
          <div class="kv">
            <span>登录状态有效期至</span>
            <strong>{{ formatTs(profile.tokenExpiresAt) }}</strong>
          </div>
          <div class="kv">
            <span>Token 时效</span>
            <strong>常规 {{ profile.tokenTtlNormalHours || 12 }} 小时 / 记住我 {{ profile.tokenTtlRememberDays || 7 }} 天</strong>
          </div>
        </div>
      </section>

<!-- 日志邮件推送 -->
      <section class="card">
        <div class="card-head">
          <h2>📬 日志邮件推送</h2>
        </div>
        <div class="card-body">
          <div class="switch-row">
            <div>
              <div class="switch-title">操作日志实时推送</div>
              <div class="switch-desc">有新操作时立即发送邮件通知</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="settings.emailRealtimeEnabled" />
              <span class="slider"></span>
            </label>
          </div>

          <label class="form-label">接收邮箱地址</label>
          <input v-model="logEmailTo" class="input" placeholder="接收日志的邮箱地址" />

          <div class="switch-row">
            <div>
              <div class="switch-title">定时发送日报</div>
              <div class="switch-desc">每日定时发送日报摘要</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="logEmail.runLogEnabled" />
              <span class="slider"></span>
            </label>
          </div>



          <label class="form-label">每日发送时间</label>
          <input v-model="logEmail.sendTime" type="time" class="input" />

          <button class="btn-primary btn-block" :disabled="emailLoading" @click="saveLogEmailConfig">
            {{ emailLoading ? '保存中…' : '保存推送配置' }}
          </button>
        </div>
      </section>

      <!-- 日志定期清理 -->
      <section class="card">
        <div class="card-head">
          <h2>⏰ 日志定期清理</h2>
        </div>
        <div class="card-body">
          <div class="switch-row">
            <div>
              <div class="switch-title">操作日志自动清理</div>
              <div class="switch-desc">按保留天数清理 sys_operation_log</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="settings.opLogEnabled" />
              <span class="slider"></span>
            </label>
          </div>
          <label class="form-label">操作日志保留天数</label>
          <input v-model.number="settings.opLogDays" type="number" min="1" max="3650" class="input" />

          <div class="switch-row">
            <div>
              <div class="switch-title">运行日志自动清理</div>
              <div class="switch-desc">按保留天数清理 sys_run_log</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="settings.runLogEnabled" />
              <span class="slider"></span>
            </label>
          </div>
          <label class="form-label">运行日志保留天数</label>
          <input v-model.number="settings.runLogDays" type="number" min="1" max="3650" class="input" />

          <label class="form-label">每日清理执行时间</label>
          <input v-model="settings.cleanupTime" type="time" class="input" />

          <button class="btn-primary btn-block" :disabled="settingsLoading" @click="saveSettings">
            {{ settingsLoading ? '保存中…' : '保存清理策略' }}
          </button>
        </div>
      </section>

      <!-- 数据清理 -->
      <section class="card">
        <div class="card-head">
          <h2>🧹 数据清理</h2>
          <button class="btn btn-sm" @click="loadPreview">刷新数据量</button>
        </div>
        <div class="card-body">
          <div v-if="!preview.length" class="empty-state" style="padding:16px;">加载中…</div>
          <label v-for="item in preview" :key="item.key" class="check-row">
            <input type="checkbox" :value="item.key" v-model="cleanTargets" />
            <span class="check-label">{{ item.label }}</span>
            <span class="check-count">{{ item.count }} 条</span>
            <span class="check-note">{{ item.note }}</span>
          </label>

          <label class="form-label">保留最近 N 天的数据（0 = 全部清理）</label>
          <input v-model.number="keepDays" type="number" min="0" max="3650" class="input" />

          <div class="danger-tip">
            ⚠️ 数据清理会同时删除数据库记录与磁盘文件，操作不可恢复。执行前请确认已备份。
          </div>

          <button class="btn btn-danger btn-block" :disabled="cleanLoading || !cleanTargets.length" @click="doCleanup">
            {{ cleanLoading ? '清理中…' : `清理选中的 ${cleanTargets.length} 项数据` }}
          </button>

          <div v-if="cleanResult" class="clean-result">
            <div class="clean-result-title">{{ cleanResult.msg }}</div>
            <div v-for="(v, k) in cleanResult.detail" :key="k" class="clean-result-row">
              <span>{{ labelOf(k) }}</span><strong>{{ v }}</strong>
            </div>
            <div v-for="(e, i) in cleanResult.errors" :key="'e'+i" class="clean-result-row error">
              <span>失败</span><strong>{{ e }}</strong>
            </div>
          </div>
        </div>
      </section>

      <!-- 系统权限 -->
      <section class="card">
        <div class="card-head">
          <h2>🛡️ 系统权限</h2>
          <button class="btn btn-sm" @click="loadPermissions">刷新</button>
        </div>
        <div class="card-body">
          <div v-if="!permissions.length" class="empty-state" style="padding:16px;">加载中…</div>
          <div v-for="p in permissions" :key="p.name" class="perm-row">
            <div class="perm-head">
              <span class="perm-name">{{ p.name }}</span>
            </div>
            <div class="perm-api">{{ p.api }}</div>
            <div class="perm-grid">
              <div><span class="perm-tag">普通用户</span>{{ p.normalUser }}</div>
              <div><span class="perm-tag admin">管理员</span>{{ p.admin }}</div>
            </div>
            <div class="perm-note">{{ p.note }}</div>
          </div>
        </div>
      </section>

      <!-- 系统备份与恢复 -->
      <section class="card">
        <div class="card-head">
          <h2>💾 系统备份与恢复</h2>
        </div>
        <div class="card-body">
          <p style="color:var(--text-secondary);font-size:13px;line-height:1.6;margin:0 0 16px 0;">
            备份将导出数据库和上传的图片/视频文件，恢复时上传备份包即可还原系统。
          </p>
          
          <button class="btn-primary btn-block" :disabled="backupLoading" @click="handleBackup">
            {{ backupLoading ? '备份中…' : '📥 备份并下载数据' }}
          </button>
          
          <div style="height:12px;"></div>
          
          <button class="btn-danger btn-block" :disabled="restoreLoading" @click="triggerRestore">
            {{ restoreLoading ? '恢复中…' : '📤 上传备份恢复系统' }}
          </button>
          <input ref="restoreInput" type="file" accept=".zip" style="display:none" @change="handleRestore" />
          
          <div style="height:16px;"></div>
          <div style="border-top:1px solid #f1f5f9;padding-top:16px;">
            <button class="btn btn-block" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;" :disabled="resetLoading" @click="handleReset">
              {{ resetLoading ? '重置中…' : '⚠️ 重置系统（清空所有数据）' }}
            </button>
            <p style="font-size:12px;color:#94a3b8;margin:8px 0 0 0;text-align:center;">
              清空所有相册、视频、商品等业务数据，保留管理员账号
            </p>
          </div>
          
          <div v-if="backupInfo" style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;font-size:12px;color:var(--text-secondary);">
            <div>数据库大小: {{ backupInfo.dbSize }}</div>
            <div>上传文件: {{ backupInfo.uploadSize }}</div>
          </div>
        </div>
      </section>
    </template>

    <BottomNav active="" @go="onNav" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import { systemApi, configApi } from '../api'
import { auth, toast, confirm } from '../utils'

const router = useRouter()
const route = useRoute()
const isAdmin = computed(() => auth.isAdmin())

const goBack = () => {
  if (window.history.state && window.history.state.back) router.back()
  else router.push('/dashboard')
}

/* ---------- 备份与恢复 ---------- */
const backupLoading = ref(false)
const restoreLoading = ref(false)
const resetLoading = ref(false)
const restoreInput = ref(null)
const backupInfo = ref(null)

const loadBackupInfo = async () => {
  try {
    const res = await systemApi.backupInfo()
    if (res.code === 200) backupInfo.value = res.data
  } catch (e) { /* 忽略 */ }
}

const handleBackup = async () => {
  backupLoading.value = true
  try {
    // 获取 token
    const token = localStorage.getItem('tiamo_token') || ''
    // 直接用 window.location 下载
    const a = document.createElement('a')
    a.href = '/api/system/backup'
    // 不能直接用 a 标签下载，因为需要带 token
    // 用 fetch + blob
    const res = await fetch('/api/system/backup', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    if (!res.ok) throw new Error('备份失败')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const downloadA = document.createElement('a')
    downloadA.href = url
    downloadA.download = 'tiamo_backup_' + new Date().toISOString().slice(0,10) + '.zip'
    document.body.appendChild(downloadA)
    downloadA.click()
    document.body.removeChild(downloadA)
    window.URL.revokeObjectURL(url)
    toast.success('备份完成，已开始下载')
  } catch (e) {
    toast.error('备份失败：' + (e.message || '未知错误'))
  } finally {
    backupLoading.value = false
  }
}

const triggerRestore = () => {
  restoreInput.value?.click()
}

const handleRestore = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  const ok = await confirm('恢复系统', `即将恢复系统到备份时的状态，当前数据将被覆盖。\n\n确定继续吗？`, 'danger')
  if (!ok) {
    e.target.value = ''
    return
  }
  
  restoreLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('tiamo_token') || ''
    const res = await fetch('/api/system/restore', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    })
    const data = await res.json()
    if (data.code === 200) {
      toast.success('恢复成功！')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      toast.error(data.msg || '恢复失败')
    }
  } catch (e) {
    toast.error('恢复失败：' + (e.message || '未知错误'))
  } finally {
    restoreLoading.value = false
    e.target.value = ''
  }
}

const handleReset = async () => {
  const ok = await confirm('重置系统', 
    '即将清空所有业务数据（相册、视频、商品、日志等）。\n\n' +
    '此操作不可恢复，建议先备份！\n\n' +
    '确定要继续吗？', 
    'danger'
  )
  if (!ok) return
  
  // 二次确认
  const ok2 = await confirm('最后确认', '真的要清空所有数据吗？再点一次确认就会清空。', 'danger')
  if (!ok2) return
  
  resetLoading.value = true
  try {
    const token = localStorage.getItem('tiamo_token') || ''
    const res = await fetch('/api/system/reset', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    const data = await res.json()
    if (data.code === 200) {
      toast.success('系统重置成功！即将跳转到初始化页面')
      setTimeout(() => window.location.href = '/init', 2000)
    } else {
      toast.error(data.msg || '重置失败')
    }
  } catch (e) {
    toast.error('重置失败：' + (e.message || '未知错误'))
  } finally {
    resetLoading.value = false
  }
}

const onNav = (key) => {
  if (key === 'home') router.push('/dashboard')
  else if (key === 'album') router.push('/dashboard?tab=album')
  else if (key === 'add') router.push('/dashboard?tab=album&upload=1')
  else if (key === 'logs') router.push('/logs')
  else if (key === 'runlog') router.push('/run-log')
}

/* ---------- 当前账号 ---------- */
const profile = reactive({})

const loadProfile = async () => {
  try {
    const res = await systemApi.profile()
    if (res.code === 200 && res.data) Object.assign(profile, res.data)
  } catch (e) { toast.error(e?.response?.data?.msg || '获取账号信息失败') }
}

const formatTs = (ts) => {
  if (!ts) return '-'
  const d = new Date(Number(ts))
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}



/* ---------- 日志邮件推送 ---------- */
const logEmail = reactive({
  runLogEnabled: false,
  opLogEnabled: false,
  sendTime: '08:00'
})
const logEmailTo = ref('')
const emailLoading = ref(false)


const saveLogEmailConfig = async () => {
  emailLoading.value = true
  try {
    // 保存到邮件配置接口（字段名与后端对齐）
    const res = await configApi.updateEmail({
      realTimeEnabled: settings.emailRealtimeEnabled ? 'true' : 'false',
      toEmail: logEmailTo.value,
      enabled: logEmail.runLogEnabled ? 'true' : 'false',
      sendTime: logEmail.sendTime
    })
    if (res.code === 200) toast.success('推送配置已保存')
    else toast.error(res.msg || '保存失败')
  } catch (e) {
    toast.error(e?.response?.data?.msg || '保存失败')
  } finally {
    emailLoading.value = false
  }
}


const loadLogEmailConfig = async () => {
  try {
    const res = await configApi.getEmail()
    if (res.code === 200 && res.data) {
      const d = res.data
      settings.emailRealtimeEnabled = d.realTimeEnabled !== 'false'
      logEmailTo.value = d.toEmail || ''
      logEmail.sendTime = d.sendTime || '08:00'
      logEmail.runLogEnabled = d.enabled !== 'false'
      logEmail.opLogEnabled = false // 后端暂不支持区分，先禁用
    }
  } catch (e) { /* 忽略加载失败 */ }
}
/* ---------- 清理策略 ---------- */
const settings = reactive({
  opLogEnabled: true, opLogDays: 30,
  runLogEnabled: true, runLogDays: 15,
  cleanupTime: '02:00',
  emailRealtimeEnabled: true
})
const settingsLoading = ref(false)

const loadSettings = async () => {
  try {
    const res = await systemApi.getSettings()
    if (res.code === 200 && res.data) Object.assign(settings, res.data)
  } catch (e) { /* 忽略 */ }
}

const saveSettings = async () => {
  settingsLoading.value = true
  try {
    const res = await systemApi.saveSettings({ ...settings })
    if (res.code === 200) toast.success(res.msg || '设置已保存')
    else toast.error(res.msg || '保存失败')
  } catch (e) {
    toast.error(e?.response?.data?.msg || '保存失败')
  } finally {
    settingsLoading.value = false
  }
}

/* ---------- 数据清理 ---------- */
const preview = ref([])
const cleanTargets = ref([])
const keepDays = ref(0)
const cleanLoading = ref(false)
const cleanResult = ref(null)

const labelOf = (key) => (preview.value.find(p => p.key === key) || {}).label || key

const loadPreview = async () => {
  try {
    const res = await systemApi.cleanupPreview()
    if (res.code === 200 && Array.isArray(res.data)) preview.value = res.data
  } catch (e) { toast.error(e?.response?.data?.msg || '获取数据量失败') }
}

const doCleanup = async () => {
  if (!cleanTargets.value.length) { toast.warning('请至少选择一项'); return }
  const names = cleanTargets.value.map(labelOf).join('、')
  const scope = keepDays.value > 0 ? `最近 ${keepDays.value} 天内的数据会保留` : '将清理全部数据，不留任何记录'
  const ok = await confirm('高危操作确认', `即将清理：${names}。\n${scope}。\n\n此操作不可恢复，确定继续吗？`)
  if (!ok) return

  // 二次确认，必须手动输入 CONFIRM，避免误触
  const text = prompt('请手动输入 CONFIRM 以确认清理', '')
  if (text !== 'CONFIRM') { toast.warning('未输入 CONFIRM，已取消清理'); return }

  cleanLoading.value = true
  cleanResult.value = null
  try {
    const res = await systemApi.cleanup({
      targets: cleanTargets.value,
      keepDays: keepDays.value,
      confirmText: 'CONFIRM'
    })
    if (res.code === 200 || res.code === 207) {
      cleanResult.value = { msg: res.msg, detail: res.data?.detail || {}, errors: res.data?.errors || [] }
      toast.success(res.msg || '清理完成')
      loadPreview()
    } else {
      toast.error(res.msg || '清理失败')
    }
  } catch (e) {
    toast.error(e?.response?.data?.msg || '清理失败')
  } finally {
    cleanLoading.value = false
  }
}

/* ---------- 权限矩阵 ---------- */
const permissions = ref([])
const loadPermissions = async () => {
  try {
    const res = await systemApi.permissions()
    if (res.code === 200 && Array.isArray(res.data)) permissions.value = res.data
  } catch (e) { /* 忽略 */ }
}

const loadAll = () => {
  if (!isAdmin.value) return
  loadProfile()
  loadSettings()
  loadPreview()
  loadPermissions()
  loadLogEmailConfig()
  loadBackupInfo()
}

onMounted(loadAll)
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(90px + env(safe-area-inset-bottom));
}
.page-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
}
.page-title-bar h1 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }

.card {
  background: white;
  border-radius: 14px;
  margin: 0 16px 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f1f5f9;
}
.card-head h2 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
.card-body { padding: 14px 16px 16px; }

.kv {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px dashed #f1f5f9;
  font-size: 13px;
}
.kv:last-child { border-bottom: none; }
.kv span { color: #64748b; flex: 0 0 auto; }
.kv strong { color: #1e293b; text-align: right; word-break: break-all; }

.form-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin: 12px 0 6px;
}
.input { width: 100%; }
.pwd-strength { font-size: 12px; color: #64748b; margin: 8px 0; }
.btn-block { margin-top: 14px; }
.btn:disabled, .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.switch-title { font-size: 13px; font-weight: 600; color: #1e293b; }
.switch-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; flex: 0 0 auto; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; inset: 0; cursor: pointer;
  background: #cbd5e1; border-radius: 24px; transition: 0.2s;
}
.slider::before {
  content: ''; position: absolute; height: 18px; width: 18px;
  left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s;
}
.switch input:checked + .slider { background: #6366f1; }
.switch input:checked + .slider::before { transform: translateX(20px); }

.check-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'box label count' '. note note';
  gap: 4px 8px;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px dashed #f1f5f9;
  font-size: 13px;
}
.check-row input { grid-area: box; width: 16px; height: 16px; }
.check-label { grid-area: label; color: #1e293b; font-weight: 500; }
.check-count { grid-area: count; color: #6366f1; font-weight: 600; font-size: 12px; }
.check-note { grid-area: note; color: #94a3b8; font-size: 11px; }

.danger-tip {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  border-radius: 6px;
  font-size: 12px;
  color: #991b1b;
  line-height: 1.6;
}
.btn-danger { background: #ef4444; color: white; border-color: #ef4444; }

.clean-result {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
}
.clean-result-title { font-weight: 600; color: #1e293b; margin-bottom: 6px; }
.clean-result-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 3px 0;
  color: #475569;
}
.clean-result-row.error { color: #dc2626; }
.clean-result-row strong { text-align: right; word-break: break-all; }

.perm-row {
  padding: 10px 0;
  border-bottom: 1px dashed #f1f5f9;
}
.perm-row:last-child { border-bottom: none; }
.perm-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.perm-api {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 11px;
  color: #6366f1;
  background: #eef2ff;
  padding: 3px 6px;
  border-radius: 4px;
  margin: 4px 0;
  word-break: break-all;
  display: inline-block;
}
.perm-grid { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #475569; }
.perm-tag {
  display: inline-block;
  min-width: 62px;
  text-align: center;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  margin-right: 6px;
}
.perm-tag.admin { background: #ede9fe; color: #7c3aed; }
.perm-note { font-size: 11px; color: #94a3b8; margin-top: 3px; }
.empty-state { padding: 40px 16px; text-align: center; color: #94a3b8; font-size: 13px; }

@media (min-width: 769px) {
  .page-title-bar { padding: 16px 24px 12px; }
  .card { margin: 0 24px 12px; }
  .settings-page { padding-bottom: 24px; }
}
</style>















