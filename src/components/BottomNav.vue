<template>
  <nav class="bottom-nav">
    <button class="nav-item" :class="{active: active === 'home'}" @click="onTab('home')">
      <span class="nav-icon">🏠</span>
      <span class="nav-text">首页</span>
    </button>
    <button class="nav-item" :class="{active: active === 'album'}" @click="onTab('album')">
      <span class="nav-icon">🖼️</span>
      <span class="nav-text">相册</span>
    </button>
    <button v-if="isAdmin || permissions.includes('oplog')" class="nav-item" :class="{active: active === 'logs'}" @click="onTab('logs')">
      <span class="nav-icon">📋</span>
      <span class="nav-text">操作日志</span>
    </button>
    <button v-if="isAdmin || permissions.includes('runlog')" class="nav-item" :class="{active: active === 'runlog'}" @click="onTab('runlog')">
      <span class="nav-icon">⚙️</span>
      <span class="nav-text">运行日志</span>
    </button>
    <button class="nav-item" :class="{active: active === 'me'}" @click="onTab('me')">
      <span class="nav-icon">👤</span>
      <span class="nav-text">我的</span>
    </button>
  </nav>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  active: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  permissions: { type: Array, default: () => [] }
})
const emit = defineEmits(['go'])

const router = useRouter()
const route = useRoute()

// 纯路由类页签统一在这里跳转。此前"我的"由各页面自己写 onNav 分支，
// Logs / RunLog / Settings 三个页面漏掉 me，导致点了完全没反应。
// 收进组件后，任何页面引入 BottomNav 都自动具备这几个页签的能力。
const ROUTE_MAP = { me: '/profile', logs: '/logs', runlog: '/run-log' }

const onTab = (key) => {
  const target = ROUTE_MAP[key]
  if (!target) {
    // 首页 / 相册 / 上传等依赖页面内部状态的页签，仍交给页面处理
    emit('go', key)
    return
  }
  if (route.path !== target) router.push(target)
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 6px 0;
  padding-bottom: calc(6px + env(safe-area-inset-bottom));
  z-index: 200;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 5px;
  color: #94a3b8;
  transition: all 0.2s;
}
.nav-item.active { color: #6366f1; }
.nav-icon { font-size: 18px; }
.nav-text { font-size: 10px; white-space: nowrap; }
@media (min-width: 769px) {
  .bottom-nav { display: none; }
}
</style>
