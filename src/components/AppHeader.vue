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
    <!-- 桌面端主导航：移动端由 BottomNav 承担，≥769px 时由 CSS 切换显示 -->
    <nav class="pc-nav pc-only">
      <button
        v-for="n in navItems"
        :key="n.key"
        class="pc-nav-item"
        :class="{ active: isActive(n) }"
        @click="go(n)"
      >{{ n.name }}</button>
    </nav>
    <div class="header-right">
      <button class="avatar-btn" @click="goProfile">
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="头像" />
        <span v-else class="avatar-default">{{ avatarInitial }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { auth } from '../utils'

defineProps({
  showBack: { type: Boolean, default: false }
})
defineEmits(['back'])

const router = useRouter()
const route = useRoute()
const user = computed(() => auth.getUser())
const avatarUrl = ref((auth.getUser()?.avatar) || localStorage.getItem('tiamo_avatar') || '')

const avatarInitial = computed(() => {
  const name = user.value?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const goProfile = () => {
  router.push('/profile')
}

// 按登录角色与已分配权限生成导航，避免把入口指向进不去的页面
const userPermissions = computed(() => {
  try {
    const u = auth.getUser()
    return u?.permissions ? JSON.parse(u.permissions) : []
  } catch (e) { return [] }
})
const admin = computed(() => auth.isAdmin())
const navItems = computed(() => {
  const can = (perm) => admin.value || userPermissions.value.includes(perm)
  const items = [
    { key: 'home', name: '首页', tab: 'home' },
    { key: 'album', name: '相册', tab: 'album' }
  ]
  if (admin.value) items.push({ key: 'users', name: '用户管理', tab: 'users' })
  if (can('database')) items.push({ key: 'database', name: '数据库', tab: 'database' })
  if (can('export')) items.push({ key: 'export', name: '数据导出', tab: 'export' })
  if (admin.value) items.push({ key: 'recycle', name: '回收站', tab: 'recycle' })
  if (can('oplog')) items.push({ key: 'logs', name: '操作日志', path: '/logs' })
  if (can('runlog')) items.push({ key: 'runlog', name: '运行日志', path: '/run-log' })
  if (admin.value) items.push({ key: 'settings', name: '系统设置', path: '/settings' })
  items.push({ key: 'profile', name: '我的', path: '/profile' })
  return items
})
const isActive = (n) => {
  if (n.path) return route.path === n.path
  return route.path === '/dashboard' && (route.query.tab || 'home') === n.tab
}
const go = (n) => {
  if (n.path) { router.push(n.path); return }
  router.push({ path: '/dashboard', query: n.tab === 'home' ? {} : { tab: n.tab } })
}

// 监听头像更新事件
const handleAvatarUpdate = () => {
  avatarUrl.value = auth.getUser()?.avatar || localStorage.getItem('tiamo_avatar') || ''
}

onMounted(() => {
  window.addEventListener('avatar-updated', handleAvatarUpdate)
})

onUnmounted(() => {
  window.removeEventListener('avatar-updated', handleAvatarUpdate)
})
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
.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.avatar-btn:active {
  transform: scale(0.95);
  border-color: #6366f1;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-default {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pc-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 14px;
  overflow-x: auto;
  scrollbar-width: none;
}
.pc-nav::-webkit-scrollbar { display: none; }
.pc-nav-item {
  border: none;
  background: none;
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.pc-nav-item:hover { background: #f1f5f9; color: #334155; }
.pc-nav-item.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
.top-header { padding: 10px 24px; }
.header-left { flex: 0 0 auto; }
@media (max-width: 768px) { .pc-nav { display: none; } }

/* 小屏幕手机进一步压缩 */
@media (max-width: 360px) {
  .top-header { padding: 8px 10px; }
  .logo-text { font-size: 15px; }
  .avatar-btn { width: 32px; height: 32px; }
}
</style>

