<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from './utils'

const router = useRouter()
let timer = null

// 登录态看门狗：Token 到期后即使不触发任何请求，也要把用户送回登录页。
// 路由守卫只在跳转时校验，长时间停留在同一页面时靠这里兜底。
const checkAuth = () => {
  const token = localStorage.getItem('tiamo_token')
  if (!token) return
  if (auth.isExpired()) {
    auth.logout()
    const current = router.currentRoute.value
    if (current && current.path !== '/login') {
      const redirect = current.fullPath && current.fullPath !== '/' ? current.fullPath : undefined
      router.replace(redirect ? { path: '/login', query: { redirect } } : '/login')
    }
  }
}

onMounted(() => {
  checkAuth()
  timer = setInterval(checkAuth, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
