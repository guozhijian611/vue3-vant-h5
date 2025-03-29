<template>
  <div class="main-layout" :class="{ 'dark-theme': isDarkMode }">
    <!-- 页面内容区域 -->
    <div class="page-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" v-if="$route.meta.keepAlive" />
        </keep-alive>
        <component :is="Component" v-if="!$route.meta.keepAlive" />
      </router-view>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="tab-bar">
      <div 
        v-for="(tab, index) in tabs" 
        :key="index" 
        class="tab-item" 
        :class="{ active: $route.path === tab.path }"
        @click="navigateTo(tab.path)"
      >
        <van-icon :name="$route.path === tab.path ? tab.activeIcon : tab.icon" />
        <span>{{ tab.title }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRootStore } from '../store'

// 获取路由实例
const router = useRouter()

// 获取根状态
const rootStore = useRootStore()

// 是否为暗黑模式
const isDarkMode = computed(() => rootStore.isDarkMode)

// 底部导航栏配置
const tabs = ref([
  {
    title: '行情',
    path: '/market',
    icon: 'chart-trending-o',
    activeIcon: 'chart-trending'
  },
  {
    title: '交易',
    path: '/trade',
    icon: 'exchange-o',
    activeIcon: 'exchange'
  },
  {
    title: '资产',
    path: '/asset',
    icon: 'balance-o',
    activeIcon: 'balance-list'
  },
  {
    title: '我的',
    path: '/user',
    icon: 'user-o',
    activeIcon: 'user'
  }
])

// 导航方法
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
  
  &.dark-theme {
    --bg-color: #121212;
    --text-color: #ffffff;
    --border-color: #333333;
  }
  
  .page-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 50px;
  }
  
  .tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    background-color: var(--bg-color);
    border-top: 1px solid var(--border-color);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 100;
    
    .tab-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: var(--text-secondary);
      font-size: 12px;
      
      .van-icon {
        font-size: 20px;
        margin-bottom: 2px;
      }
      
      &.active {
        color: var(--primary-color);
      }
    }
  }
}
</style>
