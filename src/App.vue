<template>
  <div id="app">
    <router-view />
    <footer class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">鄂ICP备2026052817号-1</a>
    </footer>
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
  display: flex;
  flex-direction: column;
}

/* 视图原本各自写死 min-height:100vh，又都为 fixed 的底部导航预留了 80~90px
   padding-bottom，两者叠加会把备案号整段推到一屏之外。这里统一收敛：
   视图只负责填满剩余空间，导航让位的高度改由 footer 自己处理。
   id 选择器的优先级高于视图 scoped 样式里的类选择器，因此能稳定覆盖。 */
#app > *:not(.icp-footer) {
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 0;
}

.icp-footer {
  flex: 0 0 auto;
  text-align: center;
  padding: 14px 16px 16px;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
  background: transparent;
}

/* 一条极浅的分隔线，把备案号与上方内容分成两层，不再像悬空飘在那里 */
.icp-footer::before {
  content: "";
  display: block;
  height: 1px;
  margin: 0 auto 10px;
  background: rgba(148, 163, 184, 0.26);
}

/* 链接保持克制但可读，并把点击区撑到手指的舒适尺寸 */
.icp-footer a {
  display: inline-block;
  padding: 4px 8px;
  color: #64748b;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.icp-footer a:hover,
.icp-footer a:active {
  color: #475569;
}

/* 移动端：底部导航 fixed（约 50px + 安全区）。备案号留在正常文档流里，
   靠自身下内边距让开这段高度——滚动时不压内容，也不会被导航盖住。 */
@media (max-width: 768px) {
  .icp-footer {
    padding: 12px 12px calc(62px + env(safe-area-inset-bottom));
  }
}
</style>

