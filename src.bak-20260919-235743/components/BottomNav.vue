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
    <button class="nav-item nav-add" @click="$emit('go', 'add')">
      <span class="nav-icon">➕</span>
    </button>
    <button class="nav-item" :class="{active: active === 'logs'}" @click="$emit('go', 'logs')">
      <span class="nav-icon">📋</span>
      <span class="nav-text">操作日志</span>
    </button>
    <button class="nav-item" :class="{active: active === 'runlog'}" @click="$emit('go', 'runlog')">
      <span class="nav-icon">⚙️</span>
      <span class="nav-text">运行日志</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  // 'home' | 'album' | 'logs' | 'runlog' | ''
  active: { type: String, default: '' }
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
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  z-index: 200;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  color: #94a3b8;
  transition: all 0.2s;
}
.nav-item.active { color: #6366f1; }
.nav-icon { font-size: 20px; }
.nav-text { font-size: 10px; white-space: nowrap; }
.nav-add {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  color: white;
  margin-top: -20px;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}
.nav-add .nav-icon { font-size: 24px; }
@media (min-width: 769px) {
  .bottom-nav { display: none; }
}
</style>
