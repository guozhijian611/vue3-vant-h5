<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)

// 当前激活的标签页
const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/market')) return 'market'
  if (path.startsWith('/trade')) return 'trade'
  if (path.startsWith('/asset')) return 'asset'
  if (path.startsWith('/user')) return 'user'
  return ''
})

// 切换页面
const switchTab = (tab: string) => {
  try {
    router.push(`/${tab}`)
  } catch (error) {
    console.error('导航错误:', error)
  }
}

// 模拟加载完成
setTimeout(() => {
  isLoading.value = false
}, 500)
</script>

<template>
  <div class="app-container">
    <div v-if="isLoading" class="loading-screen">
      加载中...
    </div>
    <template v-else>
      <div class="page-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
      
      <div class="tab-bar" v-if="!route.meta.hideNavbar">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'market' }" 
          @click="switchTab('market')"
        >
          <i class="tab-icon market-icon"></i>
          <span class="tab-label">行情</span>
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'trade' }" 
          @click="switchTab('trade')"
        >
          <i class="tab-icon trade-icon"></i>
          <span class="tab-label">交易</span>
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'asset' }" 
          @click="switchTab('asset')"
        >
          <i class="tab-icon asset-icon"></i>
          <span class="tab-label">资产</span>
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'user' }" 
          @click="switchTab('user')"
        >
          <i class="tab-icon user-icon"></i>
          <span class="tab-label">我的</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
  color: #1989fa;
  font-size: 18px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.tab-bar {
  display: flex;
  height: 50px;
  background-color: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  transition: color 0.3s;
}

.tab-item.active {
  color: #1989fa;
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.market-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>');
}

.trade-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-5h5v5zm5-5h-3v5h3v-5zm0-5H7V7h10v5z"/></svg>');
}

.asset-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>');
}

.user-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>');
}
</style>
