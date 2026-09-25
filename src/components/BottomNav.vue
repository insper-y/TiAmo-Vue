<template>
  <nav class="bottom-nav">
    <button class="nav-item" :class="{active: active === 'home'}" @click="$emit('go', 'home')">
      <span class="nav-icon">🏠</span>
      <span class="nav-text">首页</span>
    </button>
    <button class="nav-item" :class="{active: active === 'album'}" @click="$emit('go', 'album')">
      <span class="nav-icon">🖼️</span>
      <span class="nav-text">相册</span>
    </button>
    <button v-if="isAdmin" class="nav-item" :class="{active: active === 'logs'}" @click="$emit('go', 'logs')">
      <span class="nav-icon">📋</span>
      <span class="nav-text">操作日志</span>
    </button>
    <button v-if="isAdmin" class="nav-item" :class="{active: active === 'runlog'}" @click="$emit('go', 'runlog')">
      <span class="nav-icon">⚙️</span>
      <span class="nav-text">运行日志</span>
    </button>
    <button class="nav-item" :class="{active: active === 'me'}" @click="$emit('go', 'me')">
      <span class="nav-icon">👤</span>
      <span class="nav-text">我的</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  active: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false }
})
defineEmits(['go'])
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

