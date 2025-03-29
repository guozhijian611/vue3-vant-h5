import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useRootStore } from '../store'
import { useUserStore } from '../store/user'
import router from '../router'

// 创建axios实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const rootStore = useRootStore()
    const userStore = useUserStore()
    
    // 设置加载状态
    rootStore.setLoading(true)
    
    // 添加token到请求头
    if (userStore.token && config.headers) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    
    return config
  },
  (error: AxiosError) => {
    const rootStore = useRootStore()
    rootStore.setLoading(false)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const rootStore = useRootStore()
    rootStore.setLoading(false)
    
    // 直接返回数据部分
    return response.data
  },
  (error: AxiosError) => {
    const rootStore = useRootStore()
    const userStore = useUserStore()
    
    rootStore.setLoading(false)
    
    if (error.response) {
      const status = error.response.status
      
      // 处理常见错误
      switch (status) {
        case 400:
          console.error('请求参数错误')
          break
        case 401:
          // 未授权，清除token并跳转到登录页
          userStore.clearToken()
          router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
          break
        case 403:
          console.error('没有权限访问该资源')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(`请求失败: ${status}`)
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('网络错误，请检查您的网络连接')
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default http
