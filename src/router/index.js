import { createRouter, createWebHashHistory } from 'vue-router'
import { auth } from '../utils'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/init',
    name: 'Init',
    component: () => import('../views/Init.vue'),
    meta: { title: '初始化系统' }
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
    meta: { title: '操作日志', requiresAuth: true, requiresPerm: 'oplog' }
  },
  {
    path: '/run-log',
    name: 'RunLog',
    component: () => import('../views/RunLog.vue'),
    meta: { title: '运行日志', requiresAuth: true, requiresPerm: 'runlog' }
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

// 初始化状态探测：结果缓存 + 3 秒超时。
// 守卫原本每次都同步等待这个请求，后端一慢就会出现「点了 tab 半天没反应」；
// 因此只在首次真正请求，探测失败时放行，交给后续接口自行判断。
let initCheckPromise = null
const checkInitialized = () => {
  if (initCheckPromise) return initCheckPromise
  const task = (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)
    try {
      const res = await fetch('/api/auth/check-init', { signal: ctrl.signal })
      const data = await res.json()
      if (data.code === 200 && data.data) return !!data.data.initialized
      return true
    } catch (e) {
      return true
    } finally {
      clearTimeout(timer)
    }
  })()
  // 尚未初始化时不缓存结果，建号完成后需要重新探测
  task.then((ok) => { if (!ok) initCheckPromise = null })
  initCheckPromise = task
  return initCheckPromise
}

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：未登录 / Token 已过期 → 一律重定向到登录页，并记住原本要去的地址
router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - TiAmo 数据` : 'TiAmo 数据'

  // 先检查系统是否已初始化（带缓存与超时，不阻塞导航）
  const initialized = await checkInitialized()

  // 没初始化 → 跳转到初始化页面
  if (!initialized && to.path !== '/init') {
    next('/init')
    return
  }

  const loggedIn = auth.isAuthenticated()

  // 系统已初始化后，初始化页必须立即失效：
  // 未登录 -> 登录页；已登录 -> 控制台。避免任何人停在建号表单上。
  if (initialized && to.path === '/init') {
    next(loggedIn ? '/dashboard' : '/login')
    return
  }

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

  // 已登录但无对应权限的页面（日志类按 permissions 动态放行）
  if (to.meta.requiresPerm && loggedIn) {
    let perms = []
    try {
      const u = auth.getUser()
      if (u?.permissions) perms = JSON.parse(u.permissions)
    } catch (e) {}
    if (!auth.isAdmin() && !perms.includes(to.meta.requiresPerm)) {
      next('/dashboard')
      return
    }
  }

  // 已登录时不再停留在登录/注册页
  if (to.meta.guestOnly && loggedIn) {
    next('/dashboard')
    return
  }

  next()
})

export default router






