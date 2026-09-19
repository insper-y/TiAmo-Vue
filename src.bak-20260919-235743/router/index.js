import { createRouter, createWebHashHistory } from 'vue-router'
import { auth } from '../utils'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { title: '忘记密码' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '控制台', requiresAuth: true }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('../views/Logs.vue'),
    meta: { title: '操作日志', requiresAuth: true }
  },
  {
    path: '/run-log',
    name: 'RunLog',
    component: () => import('../views/RunLog.vue'),
    meta: { title: '运行日志', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - Tiamo AI` : 'Tiamo AI'

  if (to.meta.requiresAuth && !auth.getToken()) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && auth.getToken()) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
