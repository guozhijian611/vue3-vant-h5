import { createApp } from 'vue'
import App from './App.vue'

// 引入样式文件
import './assets/styles/index.scss'

// 引入路由
import router from './router'

// 引入状态管理
import { createPinia } from 'pinia'

// 引入UI组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 创建应用实例
const app = createApp(App)

// 挂载状态管理
app.use(createPinia())

// 挂载路由
app.use(router)

// 挂载UI组件库
app.use(Vant)

// 开发环境下引入调试工具
if (import.meta.env.DEV) {
  import('vconsole').then(({ default: VConsole }) => {
    new VConsole()
  })
}

// 挂载应用
app.mount('#app')
