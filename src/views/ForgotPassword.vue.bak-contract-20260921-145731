<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1>找回密码</h1>
        <p>通过邮箱验证重置您的密码</p>
      </div>

      <!-- 步骤1：输入邮箱 -->
      <form v-if="step === 1" @submit.prevent="sendCode">
        <div class="form-group">
          <label class="form-label">邮箱地址</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="请输入注册时的邮箱" required />
        </div>
        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          {{ loading ? '发送中...' : '发送验证码' }}
        </button>
      </form>

      <!-- 步骤2：验证验证码 -->
      <form v-if="step === 2" @submit.prevent="verifyCode">
        <div class="form-group">
          <label class="form-label">邮箱验证码</label>
          <div class="input-with-btn">
            <input v-model="form.code" type="text" class="form-input" placeholder="请输入6位验证码" maxlength="6" required />
            <button type="button" class="btn-code" @click="resendCode" :disabled="countdown > 0">
              {{ countdown > 0 ? countdown + 's' : '重新发送' }}
            </button>
          </div>
          <p class="form-hint">验证码已发送至 {{ form.email }}，有效期5分钟</p>
        </div>
        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          {{ loading ? '验证中...' : '验证' }}
        </button>
      </form>

      <!-- 步骤3：重置密码 -->
      <form v-if="step === 3" @submit.prevent="resetPassword">
        <div class="form-group">
          <label class="form-label">新密码</label>
          <input v-model="form.newPassword" type="password" class="form-input" placeholder="请输入新密码（至少6位）" required />
        </div>
        <div class="form-group">
          <label class="form-label">确认新密码</label>
          <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="请再次输入新密码" required />
        </div>
        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          {{ loading ? '重置中...' : '重置密码' }}
        </button>
      </form>

      <div class="auth-footer">
        <router-link to="/login" class="register-link">← 返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api'
import { toast } from '../utils'

const router = useRouter()
const loading = ref(false)
const step = ref(1)
const countdown = ref(0)
let timer = null

const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const startCountdown = () => {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const sendCode = async () => {
  if (!form.email) {
    toast.warning('请输入邮箱地址')
    return
  }
  loading.value = true
  try {
    const res = await authApi.sendCode(form.email)
    if (res.code === 200) {
      toast.success('验证码已发送')
      step.value = 2
      startCountdown()
    } else {
      toast.error(res.msg || '发送失败')
    }
  } catch (err) {
    toast.error('网络请求失败')
  } finally {
    loading.value = false
  }
}

const resendCode = () => {
  if (countdown.value > 0) return
  sendCode()
}

const verifyCode = async () => {
  if (!form.code || form.code.length !== 6) {
    toast.warning('请输入6位验证码')
    return
  }
  loading.value = true
  try {
    const res = await authApi.verifyCode({
      email: form.email,
      code: form.code
    })
    if (res.code === 200) {
      toast.success('验证成功')
      step.value = 3
    } else {
      toast.error(res.msg || '验证码错误或已过期')
    }
  } catch (err) {
    toast.error('网络请求失败')
  } finally {
    loading.value = false
  }
}

const resetPassword = async () => {
  if (form.newPassword.length < 6) {
    toast.error('密码至少6位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    toast.error('两次输入的密码不一致')
    return
  }
  loading.value = true
  try {
    const res = await authApi.resetPassword({
      email: form.email,
      code: form.code,
      newPassword: form.newPassword
    })
    if (res.code === 200) {
      toast.success('密码重置成功，请登录')
      router.push('/login')
    } else {
      toast.error(res.msg || '重置失败')
    }
  } catch (err) {
    toast.error('网络请求失败')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf4ff 100%);
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 10px 40px rgba(99,102,241,0.15);
}
.auth-logo {
  text-align: center;
  margin-bottom: 24px;
}
.logo-icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}
.auth-logo h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}
.auth-logo p {
  font-size: 13px;
  color: #64748b;
}
.form-group {
  margin-bottom: 16px;
}
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #1e293b;
  transition: all 0.2s;
  min-height: 44px;
}
.form-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}
.input-with-btn {
  display: flex;
  gap: 8px;
}
.input-with-btn .form-input {
  flex: 1;
}
.btn-code {
  padding: 0 14px;
  background: #eef2ff;
  color: #6366f1;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  min-width: 90px;
}
.btn-code:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.form-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
}
.btn-block {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  min-height: 48px;
}
.btn-block:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-footer {
  text-align: center;
  margin-top: 18px;
}
.register-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}
</style>
