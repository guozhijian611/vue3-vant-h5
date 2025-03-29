import { defineStore } from 'pinia'

// 用户信息类型
export interface UserInfo {
  id: string
  username: string
  avatar: string
  balance: number
  vipLevel: number
  isVerified: boolean
}

// 用户状态类型
export interface UserState {
  token: string | null
  userInfo: UserInfo | null
  isLogin: boolean
}

// 创建用户状态
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: null,
    isLogin: !!localStorage.getItem('token')
  }),
  
  getters: {
    // 获取用户ID
    userId: (state) => state.userInfo?.id,
    
    // 获取用户名
    username: (state) => state.userInfo?.username || '游客',
    
    // 获取用户头像
    avatar: (state) => state.userInfo?.avatar || '/default-avatar.png',
    
    // 获取用户余额
    balance: (state) => state.userInfo?.balance || 0,
    
    // 是否已认证
    isVerified: (state) => state.userInfo?.isVerified || false
  },
  
  actions: {
    // 设置Token
    setToken(token: string) {
      this.token = token
      this.isLogin = true
      localStorage.setItem('token', token)
    },
    
    // 清除Token
    clearToken() {
      this.token = null
      this.isLogin = false
      localStorage.removeItem('token')
    },
    
    // 设置用户信息
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
    },
    
    // 登出
    logout() {
      this.clearToken()
      this.userInfo = null
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      if (!this.token) return
      
      try {
        // 这里应该调用API获取用户信息
        // const { data } = await getUserInfo()
        // this.setUserInfo(data)
        
        // 模拟数据
        this.setUserInfo({
          id: '10001',
          username: '测试用户',
          avatar: '/avatar.png',
          balance: 10000,
          vipLevel: 1,
          isVerified: true
        })
      } catch (error) {
        console.error('获取用户信息失败', error)
      }
    }
  }
})
