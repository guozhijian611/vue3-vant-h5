<template>
  <div class="not-found-page">
    <div class="container">
      <div class="error-code">404</div>
      <div class="error-message">页面不存在</div>
      <div class="error-desc">抱歉，您访问的页面不存在或已被删除</div>
      <van-button type="primary" @click="goHome">返回首页</van-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
  
  .container {
    text-align: center;
    padding: var(--padding-xl);
    
    .error-code {
      font-size: 80px;
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: var(--padding-md);
    }
    
    .error-message {
      font-size: var(--font-size-xl);
      font-weight: 500;
      color: var(--text-color);
      margin-bottom: var(--padding-md);
    }
    
    .error-desc {
      font-size: var(--font-size-md);
      color: var(--text-secondary);
      margin-bottom: var(--padding-lg);
    }
  }
}
</style>
