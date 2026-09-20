<template>
  <header class="top-header">
    <div class="header-left">
      <button v-if="showBack" class="head-back" @click="$emit('back')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <span>返回</span>
      </button>
      <div class="logo">
        <span class="logo-icon">🚀</span>
        <span class="logo-text">TiAmo 数据</span>
      </div>
    </div>
    <div class="header-right">
      <span class="user-name">{{ user?.username }}</span>
      <span class="user-role" :class="isAdmin ? 'admin' : 'user'">
        {{ isAdmin ? '管理员' : '普通用户' }}
      </span>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, toast, confirm } from '../utils'

defineProps({
  showBack: { type: Boolean, default: false }
})
defineEmits(['back'])

const router = useRouter()
const user = computed(() => auth.getUser())
const isAdmin = computed(() => user.value?.role === 1)

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
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.head-back {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  min-height: 36px;
}
.head-back:active { background: #e2e8f0; }
.logo { display: flex; align-items: center; gap: 8px; }
.logo-icon { font-size: 24px; }
.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.header-right { display: flex; align-items: center; gap: 10px; }
.user-name { font-size: 14px; font-weight: 500; color: #1e293b; }
.user-role {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}
.user-role.admin { background: #eef2ff; color: #6366f1; }
.user-role.user { background: #f0fdf4; color: #10b981; }
.logout-btn {
  padding: 6px 12px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
</style>
