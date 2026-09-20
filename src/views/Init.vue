<template>
  <div class="init-page">
    <div class="init-card">
      <div class="init-icon">🚀</div>
      <h1>欢迎使用 TiAmo</h1>
      <p class="init-desc">系统首次使用，请创建管理员账号</p>
      
      <div class="form-group">
        <label>用户名</label>
        <input v-model="username" type="text" placeholder="请输入用户名" />
      </div>
      
      <div class="form-group">
        <label>密码</label>
        <input v-model="password" type="password" placeholder="请输入密码" />
      </div>
      
      <div class="form-group">
        <label>确认密码</label>
        <input v-model="confirmPwd" type="password" placeholder="请再次输入密码" />
      </div>
      
      <button class="btn-init" :disabled="loading" @click="handleInit">
        {{ loading ? '初始化中...' : '创建管理员账号' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '../utils'

const router = useRouter()
const username = ref('')
const password = ref('')
const confirmPwd = ref('')
const loading = ref(false)

const handleInit = async () => {
  if (!username.value.trim()) {
    toast.error('请输入用户名')
    return
  }
  if (!password.value) {
    toast.error('请输入密码')
    return
  }
  if (password.value !== confirmPwd.value) {
    toast.error('两次密码不一致')
    return
  }
  if (password.value.length < 6) {
    toast.error('密码至少6位')
    return
  }
  
  loading.value = true
  try {
    const res = await fetch('/api/auth/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value
      })
    })
    const data = await res.json()
    if (data.code === 200) {
      toast.success('初始化成功！请登录')
      router.push('/login')
    } else {
      toast.error(data.msg || '初始化失败')
    }
  } catch (e) {
    toast.error('初始化失败：' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.init-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.init-card {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.init-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}
h1 {
  text-align: center;
  font-size: 24px;
  margin: 0 0 8px 0;
  color: #1e293b;
}
.init-desc {
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin: 0 0 32px 0;
}
.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  font-size: 14px;
  color: #334155;
  margin-bottom: 8px;
  font-weight: 500;
}
input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.btn-init {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s;
}
.btn-init:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}
.btn-init:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>


