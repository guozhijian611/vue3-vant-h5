import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 定义路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/market'
  },
  {
    path: '/market',
    name: 'Market',
    component: () => import('../pages/market/index.vue'),
    meta: {
      title: '行情',
      keepAlive: true
    }
  },
  {
    path: '/trade',
    name: 'Trade',
    component: () => import('../pages/trade/index.vue'),
    meta: {
      title: '交易',
      keepAlive: true
    }
  },
  {
    path: '/asset',
    name: 'Asset',
    component: () => import('../pages/asset/index.vue'),
    meta: {
      title: '资产',
      requiresAuth: false
    }
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('../pages/user/index.vue'),
    meta: {
      title: '我的',
      requiresAuth: false
    }
  },
  {
    path: '/user/login',
    name: 'Login',
    component: () => import('../pages/user/Login.vue'),
    meta: {
      title: '登录',
      hideNavbar: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFound.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '模拟交易所'}`
  
  // 权限验证 - 暂时注释掉以便测试
  // if (to.meta.requiresAuth) {
  //   const token = localStorage.getItem('token')
  //   if (!token) {
  //     next({ name: 'Login', query: { redirect: to.fullPath } })
  //     return
  //   }
  // }
  
  next()
})

export default router
