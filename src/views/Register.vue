<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1>注册账号</h1>
        <p>加入 TiAmo 数据管理平台</p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input v-model="form.username" type="text" class="form-input" placeholder="请输入用户名" required />
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="请输入邮箱" required />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="请输入密码（至少6位）" required />
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="请再次输入密码" required />
        </div>

        <div class="form-group">
          <label class="form-label">邀请码</label>
          <div class="input-with-btn">
            <input v-model="form.inviteCode" type="text" class="form-input" placeholder="请输入管理员提供的邀请码" required />
          </div>
          <p class="form-hint">邀请码由管理员生成，3分钟内有效</p>
        </div>

        <label class="checkbox-group agree">
          <input type="checkbox" v-model="form.agree" required />
          <span>我已阅读并同意 <a href="#" @click.prevent>用户协议</a> 和 <a href="#" @click.prevent>隐私政策</a></span>
        </label>

        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>已有账号？</span>
        <router-link to="/login" class="register-link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api'
import { toast } from '../utils'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
  agree: false
})

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    toast.error('两次输入的密码不一致')
    return
  }
  if (form.password.length < 6) {
    toast.error('密码至少6位')
    return
  }
  if (!form.agree) {
    toast.warning('请先同意用户协议和隐私政策')
    return
  }

  loading.value = true
  try {
    const res = await authApi.register({
      username: form.username,
      email: form.email,
      password: form.password,
      inviteCode: form.inviteCode
    })

    if (res.code === 200) {
      toast.success('注册成功，请登录')
      router.push('/login')
    } else {
      toast.error(res.msg || '注册失败')
    }
  } catch (err) {
    toast.error('网络请求失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}
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
  margin-bottom: 14px;
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
.form-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}
.agree {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 16px;
  cursor: pointer;
}
.agree input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}
.agree a {
  color: #6366f1;
  text-decoration: none;
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
  font-size: 13px;
  color: #64748b;
}
.register-link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}
</style>
