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
    meta: { title: '登录', guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '注册', guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { title: '忘记密码', guestOnly: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '控制台', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '个人设置', requiresAuth: true }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('../views/Logs.vue'),
    meta: { title: '操作日志', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/run-log',
    name: 'RunLog',
    component: () => import('../views/RunLog.vue'),
    meta: { title: '运行日志', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '系统设置', requiresAuth: true, requiresAdmin: true }
  },
  // 兜底：任何未知路径都先回控制台，再由守卫判断登录态，
  // 避免出现「未登录也能停在空白页」的情况
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：未登录 / Token 已过期 → 一律重定向到登录页，并记住原本要去的地址
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - TiAmo 数据` : 'TiAmo 数据'

  const loggedIn = auth.isAuthenticated()

  if (to.meta.requiresAuth && !loggedIn) {
    // 带上 redirect，登录成功后回到用户原本想访问的页面
    const redirect = to.fullPath && to.fullPath !== '/' ? to.fullPath : undefined
    next(redirect ? { path: '/login', query: { redirect } } : '/login')
    return
  }

  // 已登录但访问管理员专属页面
  if (to.meta.requiresAdmin && loggedIn && !auth.isAdmin()) {
    next('/dashboard')
    return
  }

  // 已登录时不再停留在登录/注册页
  if (to.meta.guestOnly && loggedIn) {
    next('/dashboard')
    return
  }

  next()
})

export default router




