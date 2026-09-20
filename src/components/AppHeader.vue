<template>
  <header class="top-header">
    <div class="header-left">
      <button v-if="showBack" class="head-back" @click="$emit('back')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="logo">
        <span class="logo-icon">🚀</span>
        <span class="logo-text">TiAmo</span>
      </div>
    </div>
    <div class="header-right">
      <span class="user-name">{{ user?.username }}</span>
      <span class="user-role" :class="isAdmin ? 'admin' : 'user'" v-if="isAdmin">
        管理员
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
  padding: 10px 14px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-left { display: flex; align-items: center; gap: 8px; }
.head-back {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  color: #475569;
}
.head-back:active { background: #e2e8f0; }
.logo { display: flex; align-items: center; gap: 6px; }
.logo-icon { font-size: 20px; }
.logo-text {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}
.header-right { display: flex; align-items: center; gap: 8px; }
.user-name { font-size: 13px; font-weight: 500; color: #1e293b; }
.user-role {
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 500;
}
.user-role.admin { background: #eef2ff; color: #6366f1; }
.logout-btn {
  padding: 5px 10px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
}

/* 小屏幕手机进一步压缩 */
@media (max-width: 360px) {
  .top-header { padding: 8px 10px; }
  .logo-text { font-size: 15px; }
  .user-name { font-size: 12px; }
  .logout-btn { padding: 4px 8px; font-size: 10px; }
}
</style>

