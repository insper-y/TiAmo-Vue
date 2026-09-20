<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1>TiAmo 数据</h1>
        <p>智能数据管理平台</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">账号</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码"
              required
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-group">
            <input type="checkbox" v-model="form.remember" />
            <span>记住密码</span>
          </label>
          <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
        </div>

        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="register-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '../api'
import { auth, toast } from '../utils'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

onMounted(() => {
  // 只回填用户名。原先连明文密码一起存在 localStorage 里，
  // 任何 XSS 或共用设备都能直接读到，现在改为靠长效 Token 实现「记住我」。
  const saved = localStorage.getItem('tiamo_remember')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (typeof data === 'string') {
        form.username = data
      } else {
        form.username = data.username || ''
      }
      form.remember = true
    } catch (e) {
      localStorage.removeItem('tiamo_remember')
    }
  }
  // 清理历史遗留的明文密码
  try {
    const legacy = localStorage.getItem('tiamo_remember')
    if (legacy && legacy.includes('password')) {
      const d = JSON.parse(legacy)
      if (d && d.password) localStorage.setItem('tiamo_remember', JSON.stringify({ username: d.username || '' }))
    }
  } catch (e) { /* 忽略 */ }
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    toast.warning('请输入账号和密码')
    return
  }

  loading.value = true
  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password,
      // 勾选后由后端签发 7 天 Token，未勾选为 12 小时
      remember: !!form.remember
    })

    if (res.code === 200 && res.data) {
      auth.setToken(res.data.token, res.data.expiresAt)
      auth.setUser(res.data)

      if (form.remember) {
        localStorage.setItem('tiamo_remember', JSON.stringify({ username: form.username }))
      } else {
        localStorage.removeItem('tiamo_remember')
      }

      toast.success('登录成功')
      // 登录前被守卫拦下的目标页，登录成功后回到原处
      const redirect = route.query.redirect
      if (redirect && typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/login')) {
        router.replace(redirect)
      } else {
        router.push('/dashboard')
      }
    } else {
      toast.error(res.msg || '登录失败')
    }
  } catch (err) {
    toast.error('网络请求失败，请检查网络连接')
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
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
  padding: 32px 24px;
  box-shadow: 0 10px 40px rgba(99,102,241,0.15);
}
.auth-logo {
  text-align: center;
  margin-bottom: 28px;
}
.logo-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}
.auth-logo h1 {
  font-size: 24px;
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
.input-wrapper {
  position: relative;
}
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
}
.form-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #1e293b;
  transition: all 0.2s;
  min-height: 46px;
}
.form-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}
.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
}
.checkbox-group input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.forgot-link {
  font-size: 13px;
  color: #6366f1;
  text-decoration: none;
}
.forgot-link:hover {
  text-decoration: underline;
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
  margin-top: 20px;
  font-size: 13px;
  color: #64748b;
}
.register-link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}
.register-link:hover {
  text-decoration: underline;
}
</style>
