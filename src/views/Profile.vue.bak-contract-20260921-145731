<template>
  <div class="profile-page">
    <AppHeader show-back @back="goBack" />

    <div class="profile-content">
      <!-- 头像区域 -->
      <section class="card avatar-section">
        <div class="avatar-wrapper" @click="triggerAvatarUpload">
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="头像" />
          <div v-else class="avatar-default">{{ avatarInitial }}</div>
          <div class="avatar-mask">
            <span>📷</span>
            <span class="avatar-tip">点击更换</span>
          </div>
        </div>
        <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
        <p class="avatar-name">{{ user?.nickname || user?.username || '用户' }}</p>
        <p class="avatar-email">{{ user?.email || '' }}</p>
      </section>

      <!-- 修改密码 -->
      <section class="card">
        <div class="card-head">
          <h2>🔑 修改密码</h2>
        </div>
        <div class="card-body">
          <label class="form-label">当前密码</label>
          <input v-model="pwdForm.oldPassword" type="password" class="input" placeholder="请输入当前密码" autocomplete="current-password" />

          <label class="form-label">新密码</label>
          <input v-model="pwdForm.newPassword" type="password" class="input" placeholder="至少8位，需同时包含字母和数字" autocomplete="new-password" />

          <label class="form-label">确认新密码</label>
          <input v-model="pwdForm.confirmPassword" type="password" class="input" placeholder="再次输入新密码" autocomplete="new-password" />

          <button class="btn-primary btn-block" :disabled="pwdLoading" @click="changePassword">
            {{ pwdLoading ? '提交中…' : '确认修改密码' }}
          </button>
        </div>
      </section>

      <!-- 退出登录 -->
      <section class="card">
        <div class="card-body">
          <button class="btn-danger btn-block" @click="handleLogout">
            🚪 退出登录
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { auth, toast, confirm } from '../utils'
import { systemApi } from '../api'

const router = useRouter()
const user = ref(auth.getUser())
const avatarInput = ref(null)

const avatarUrl = computed(() => {
  return localStorage.getItem('tiamo_avatar') || ''
})

const avatarInitial = computed(() => {
  const name = user.value?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const goBack = () => {
  router.back()
}

// 头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 简单压缩：转成 base64 存储
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const img = new Image()
    img.onload = () => {
      // 压缩到 100x100
      const canvas = document.createElement('canvas')
      const size = 100
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      
      // 居中裁剪
      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
      
      const compressed = canvas.toDataURL('image/jpeg', 0.8)
      localStorage.setItem('tiamo_avatar', compressed)
      toast.success('头像已更新')
      
      // 触发头部头像刷新
      window.dispatchEvent(new Event('avatar-updated'))
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// 修改密码
const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const pwdLoading = ref(false)

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
      newPassword: pwdForm.value.newPassword
    })
    if (res.code === 200) {
      toast.success('密码修改成功')
      pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      toast.error(res.message || '密码修改失败')
    }
  } catch (e) {
    toast.error(e.response?.data?.message || '密码修改失败')
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
.profile-content {
  padding: 16px 14px;
}
.card {
  background: white;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.card-head {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.card-head h2 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.card-body {
  padding: 16px;
}

/* 头像区域 */
.avatar-section {
  text-align: center;
  padding: 30px 16px;
}
.avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-default {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 32px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.5);
  color: white;
  font-size: 10px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}
.avatar-wrapper:hover .avatar-mask {
  opacity: 1;
}
.avatar-tip { font-size: 9px; }
.avatar-name {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px;
}
.avatar-email {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* 表单 */
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
  margin-top: 12px;
}
.form-label:first-child {
  margin-top: 0;
}
.input {
  width: 100%;
  padding: 10px 12px;
  background: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
}
.input:focus {
  outline: none;
  border-color: #6366f1;
}
.btn-block {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}
.btn-primary:disabled {
  opacity: 0.6;
}
.btn-danger {
  background: #ef4444;
  color: white;
}
</style>

