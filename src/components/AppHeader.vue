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
      <button class="avatar-btn" @click="goProfile">
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="头像" />
        <span v-else class="avatar-default">{{ avatarInitial }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../utils'

defineProps({
  showBack: { type: Boolean, default: false }
})
defineEmits(['back'])

const router = useRouter()
const user = computed(() => auth.getUser())
const avatarUrl = ref(localStorage.getItem('tiamo_avatar') || '')

const avatarInitial = computed(() => {
  const name = user.value?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const goProfile = () => {
  router.push('/profile')
}

// 监听头像更新事件
const handleAvatarUpdate = () => {
  avatarUrl.value = localStorage.getItem('tiamo_avatar') || ''
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

/* 小屏幕手机进一步压缩 */
@media (max-width: 360px) {
  .top-header { padding: 8px 10px; }
  .logo-text { font-size: 15px; }
  .avatar-btn { width: 32px; height: 32px; }
}
</style>

