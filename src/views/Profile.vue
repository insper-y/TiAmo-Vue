<template>
  <div class="profile-page">
    <AppHeader show-back @back="goBack" />

    <div class="profile-content">
      <!-- 账号卡片：头像在账号前面，横向一行 -->
      <section class="card account-card">
        <div class="account-main">
          <div class="avatar-box" :class="{ uploading: avatarUploading }" @click="triggerAvatarUpload">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="头像" />
            <div v-else class="avatar-default">{{ avatarInitial }}</div>
            <span class="avatar-badge">{{ avatarUploading ? '…' : '📷' }}</span>
          </div>
          <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />

          <div class="account-info">
            <div class="account-line">
              <span class="account-label">账号</span>
              <strong class="account-name">{{ user?.username || '未登录' }}</strong>
              <span class="role-tag" :class="isAdminUser ? 'role-admin' : 'role-user'">
                {{ isAdminUser ? '管理员' : '普通用户' }}
              </span>
            </div>
            <div class="account-sub" v-if="user?.nickname && user.nickname !== user.username">
              昵称 {{ user.nickname }}
            </div>
            <div class="account-sub">{{ user?.email || '未绑定邮箱' }}</div>
            <div class="account-actions">
              <span class="account-tip" @click="triggerAvatarUpload">{{ avatarUploading ? '上传中…' : '点头像可更换' }}</span>
              <span v-if="avatarUrl" class="account-link" @click="removeAvatar">清除头像</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 修改密码 -->
      <section class="card">
        <div class="card-head">
          <h2><span class="head-icon">🔑</span>修改密码</h2>
        </div>
        <div class="card-body">
          <div class="form-item">
            <label class="form-label" for="pwd-old">当前密码</label>
            <div class="field">
              <input
                id="pwd-old"
                v-model="pwdForm.oldPassword"
                :type="showPwd.old ? 'text' : 'password'"
                class="input"
                placeholder="请输入当前密码"
                autocomplete="current-password"
              />
              <button class="eye" type="button" @click="togglePwd('old')" :aria-label="showPwd.old ? '隐藏密码' : '显示密码'">
                {{ showPwd.old ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label" for="pwd-new">新密码</label>
            <div class="field">
              <input
                id="pwd-new"
                v-model="pwdForm.newPassword"
                :type="showPwd.new ? 'text' : 'password'"
                class="input"
                placeholder="至少 8 位，需同时包含字母和数字"
                autocomplete="new-password"
              />
              <button class="eye" type="button" @click="togglePwd('new')" :aria-label="showPwd.new ? '隐藏密码' : '显示密码'">
                {{ showPwd.new ? '🙈' : '👁️' }}
              </button>
            </div>
            <div class="strength">
              <span class="strength-bar" v-for="i in 3" :key="i" :class="{ on: pwdStrength >= i }"></span>
              <span class="strength-text" :class="pwdStrength ? 'ok' : ''">{{ pwdStrengthText }}</span>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label" for="pwd-confirm">确认新密码</label>
            <div class="field">
              <input
                id="pwd-confirm"
                v-model="pwdForm.confirmPassword"
                :type="showPwd.confirm ? 'text' : 'password'"
                class="input"
                placeholder="再次输入新密码"
                autocomplete="new-password"
                @keyup.enter="changePassword"
              />
              <button class="eye" type="button" @click="togglePwd('confirm')" :aria-label="showPwd.confirm ? '隐藏密码' : '显示密码'">
                {{ showPwd.confirm ? '🙈' : '👁️' }}
              </button>
            </div>
            <div v-if="pwdForm.confirmPassword && pwdForm.confirmPassword !== pwdForm.newPassword" class="field-error">
              两次输入的密码不一致
            </div>
          </div>

          <button class="btn-primary btn-block" :disabled="pwdLoading || !canSubmit" @click="changePassword">
            {{ pwdLoading ? '提交中…' : '确认修改密码' }}
          </button>
        </div>
      </section>

      <!-- 退出登录：图标与文字整体居中 -->
      <section class="card">
        <div class="card-body logout-body">
          <button class="btn-logout" @click="handleLogout">
            <span class="logout-icon">🚪</span>
            <span>退出登录</span>
          </button>
          <p class="logout-tip">退出后需要用密码重新登录，账号数据不会被删除</p>
        </div>
      </section>
    </div>

    <BottomNav active="me" :is-admin="isAdmin" :permissions="userPermissions" @go="onNav" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import { auth, toast, confirm } from '../utils'
import { systemApi, avatarApi } from '../api'

const router = useRouter()
const user = ref(auth.getUser())
const avatarInput = ref(null)

const AVATAR_CACHE_KEY = 'tiamo_avatar'
const avatarUploading = ref(false)
// 服务端头像优先，本地缓存兜底
const avatarUrl = computed(() => user.value?.avatar || localStorage.getItem(AVATAR_CACHE_KEY) || '')
const isAdminUser = computed(() => user.value?.role === 1)
const avatarInitial = computed(() => {
  const name = user.value?.username || 'U'
  return name.charAt(0).toUpperCase()
})

onMounted(async () => {
  try {
    const res = await avatarApi.get()
    if (res.code === 200 && res.data) {
      const cur = auth.getUser() || {}
      cur.avatar = res.data.avatar || ''
      auth.setUser(cur)
      user.value = cur
      if (cur.avatar) localStorage.setItem(AVATAR_CACHE_KEY, cur.avatar)
    }
  } catch (e) {}
})

const goBack = () => {
  if (window.history.state && window.history.state.back) router.back()
  else router.push('/dashboard')
}

// 底部导航：操作日志 / 运行日志 / 我的由 BottomNav 组件自身跳转，
// 这里只处理需要回到控制台的入口；"我的"页active固定为me
const onNav = (key) => {
  if (key === 'home') router.push('/dashboard')
  else if (key === 'album') router.push('/dashboard?tab=album')
  else if (key === 'add') router.push('/dashboard?tab=album&upload=1')
}

// 与其它页面保持同一套入口控制：按真实角色与已分配权限渲染
const isAdmin = computed(() => auth.isAdmin())
const userPermissions = computed(() => auth.getPermissions())

// 头像：先在本机居中裁剪压缩，再上传到服务端落到 sys_user.avatar，
// 这样换设备、清缓存都还在；localStorage 只当即时缓存用
const triggerAvatarUpload = () => avatarInput.value?.click()

const AVATAR_SIZE = 256

const uploadToServer = (blob) => {
  const fd = new FormData()
  fd.append('file', blob, 'avatar.jpg')
  return avatarApi.upload(fd)
}

const applyAvatar = (url) => {
  const cur = auth.getUser() || {}
  cur.avatar = url
  auth.setUser(cur)
  user.value = cur
  localStorage.setItem(AVATAR_CACHE_KEY, url)
  window.dispatchEvent(new Event('avatar-updated'))
}

const handleAvatarUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!/^image\//.test(file.type)) {
    toast.error('请选择图片文件')
    e.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('图片过大，请选择 5MB 以内的图片')
    e.target.value = ''
    return
  }
  avatarUploading.value = true
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_SIZE
        canvas.height = AVATAR_SIZE
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
        canvas.toBlob(async (blob) => {
          if (!blob) {
            avatarUploading.value = false
            toast.error('图片处理失败')
            return
          }
          try {
            const res = await uploadToServer(blob)
            if (res.code === 200 && res.data?.avatar) {
              applyAvatar(res.data.avatar)
              toast.success('头像已保存到账号，换设备也能看到')
            } else {
              toast.error(res.msg || '头像保存失败')
            }
          } catch (err) {
            toast.error(err?.response?.data?.msg || '头像保存失败')
          } finally {
            avatarUploading.value = false
          }
        }, 'image/jpeg', 0.88)
      } catch (err) {
        avatarUploading.value = false
        toast.error('图片处理失败')
      }
    }
    img.onerror = () => {
      avatarUploading.value = false
      toast.error('图片读取失败，换一张试试')
    }
    img.src = ev.target.result
  }
  reader.onerror = () => {
    avatarUploading.value = false
    toast.error('文件读取失败')
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const removeAvatar = async () => {
  const ok = await confirm('清除头像', '确定要清除当前头像，恢复为默认字母头像吗？')
  if (!ok) return
  try {
    const res = await avatarApi.remove()
    if (res.code === 200) {
      applyAvatar('')
      localStorage.removeItem(AVATAR_CACHE_KEY)
      toast.success('已恢复默认头像')
    } else {
      toast.error(res.msg || '清除失败')
    }
  } catch (e) {
    toast.error('清除失败')
  }
}

// 修改密码
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const showPwd = ref({ old: false, new: false, confirm: false })
const pwdLoading = ref(false)

const togglePwd = (which) => { showPwd.value[which] = !showPwd.value[which] }

const pwdStrength = computed(() => {
  const p = pwdForm.value.newPassword || ''
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[a-zA-Z]/.test(p) && /\d/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p) && p.length >= 12) score++
  return score
})
const pwdStrengthText = computed(() => ['未填写', '偏弱', '合格', '很强'][pwdStrength.value] || '')

const canSubmit = computed(() => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  return !!(oldPassword && newPassword && confirmPassword)
    && newPassword.length >= 8
    && newPassword === confirmPassword
})

const changePassword = async () => {
  if (!pwdForm.value.oldPassword) {
    toast.error('请输入当前密码')
    return
  }
  if (!pwdForm.value.newPassword || pwdForm.value.newPassword.length < 8) {
    toast.error('新密码至少8位')
    return
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    toast.error('两次输入的新密码不一致')
    return
  }

  pwdLoading.value = true
  try {
    const res = await systemApi.changePassword({
      oldPassword: pwdForm.value.oldPassword,
      newPassword: pwdForm.value.newPassword,
      confirmPassword: pwdForm.value.confirmPassword
    })
    if (res.code === 200) {
      toast.success('密码修改成功')
      pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      toast.error(res.message || res.msg || '密码修改失败')
    }
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.msg || '密码修改失败')
  } finally {
    pwdLoading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  const ok = await confirm('退出登录', '确定要退出登录吗？')
  if (ok) {
    auth.logout()
    router.push('/login')
    toast.success('已退出登录')
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 40px;
}

/* 移动端底部导航是 fixed 定位（约 50px + 安全区），不留出等高空间的话
   页面末尾的"退出登录"会被压住点不到 */
@media (max-width: 768px) {
  .profile-page {
    padding-bottom: calc(74px + env(safe-area-inset-bottom));
  }
}
.profile-content {
  padding: 14px;
  max-width: 640px;
  margin: 0 auto;
}
.card {
  background: #fff;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.card-head {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.card-head h2 {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.head-icon { font-size: 15px; }
.card-body { padding: 16px; }

/* ---------- 账号卡片 ---------- */
.account-card { padding: 16px; }
.account-main {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar-box {
  position: relative;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  overflow: visible;
  transition: border-color 0.2s;
}
.avatar-box:active { border-color: #6366f1; }
.avatar-img,
.avatar-default {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-default {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e2e8f0;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}
.account-info { min-width: 0; flex: 1; }
.account-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.account-label { font-size: 12px; color: #94a3b8; }
.account-name {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-all;
}
.role-tag {
  font-size: 11px;
  line-height: 18px;
  padding: 0 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.role-admin { background: #ede9fe; color: #6d28d9; }
.role-user { background: #e0f2fe; color: #0369a1; }
.account-sub {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
  word-break: break-all;
}
.account-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}
.account-tip {
  font-size: 11px;
  color: #cbd5e1;
  cursor: pointer;
}
.account-link {
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  text-decoration: underline;
}
.account-link:active { color: #dc2626; }
.avatar-box.uploading { opacity: 0.6; pointer-events: none; }

/* ---------- 表单 ---------- */
.form-item { margin-bottom: 14px; }
.form-item:last-of-type { margin-bottom: 0; }
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}
.field { position: relative; }
.input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  background: #fff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input::placeholder { color: #94a3b8; }
.input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.eye {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  padding: 6px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
}
.eye:active { opacity: 1; }
.strength {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 7px;
}
.strength-bar {
  width: 26px;
  height: 3px;
  border-radius: 2px;
  background: #e2e8f0;
  transition: background 0.2s;
}
.strength-bar.on { background: #6366f1; }
.strength-text { font-size: 12px; color: #64748b; margin-left: 4px; font-weight: 500; }
.strength-text.ok { color: #059669; }
.strength-bar.on:nth-child(1) { background: #ef4444; }
.strength-bar.on:nth-child(2) { background: #f59e0b; }
.strength-bar.on:nth-child(3) { background: #10b981; }
.field-error {
  font-size: 12px;
  color: #dc2626;
  margin-top: 6px;
}

/* ---------- 按钮 ---------- */
.btn-block {
  display: block;
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
}
.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.logout-body { text-align: center; }
.btn-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff5f5;
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-logout:hover { background: #fef2f2; border-color: #fca5a5; }
.btn-logout:active { background: #fee2e2; }
.logout-icon { font-size: 14px; }
.logout-tip {
  font-size: 11px;
  color: #94a3b8;
  margin: 9px 0 0;
}

@media (min-width: 769px) {
  .profile-content { padding: 20px; }
  .avatar-box { width: 62px; height: 62px; }
}

/* ---------- 桌面端：账号卡与表单并排更紧凑，危险操作按钮不再满屏铺满 ---------- */
@media (min-width: 769px) {
  .profile-content { max-width: 900px; padding: 20px 24px 40px; }
  .account-card { padding: 20px 22px; }
  .avatar-box { width: 66px; height: 66px; }
  .card-body { padding: 20px 22px; }
  .btn-logout { width: auto; min-width: 180px; padding: 10px 26px; }
  .logout-body { display: flex; flex-direction: column; align-items: center; gap: 2px; }
}
</style>