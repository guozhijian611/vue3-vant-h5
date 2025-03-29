import { defineStore } from 'pinia'

// 定义根状态类型
export interface RootState {
  theme: 'light' | 'dark'
  loading: boolean
}

// 创建根状态
export const useRootStore = defineStore('root', {
  state: (): RootState => ({
    theme: 'light',
    loading: false
  }),
  
  getters: {
    isDarkMode: (state) => state.theme === 'dark'
  },
  
  actions: {
    // 切换主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', this.theme)
      localStorage.setItem('theme', this.theme)
    },
    
    // 初始化主题
    initTheme() {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (savedTheme) {
        this.theme = savedTheme
      } else {
        // 检测系统主题
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        this.theme = prefersDark ? 'dark' : 'light'
      }
      document.documentElement.setAttribute('data-theme', this.theme)
    },
    
    // 设置加载状态
    setLoading(status: boolean) {
      this.loading = status
    }
  }
})
