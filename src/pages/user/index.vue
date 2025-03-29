<template>
  <div class="user-page">
    <!-- 用户信息卡片 -->
    <div class="user-card card">
      <div v-if="userStore.isLogin" class="user-info">
        <div class="avatar">
          <img :src="userInfo.avatar || defaultAvatar" alt="用户头像" />
        </div>
        <div class="info">
          <div class="username">{{ userInfo.username }}</div>
          <div class="user-id">ID: {{ userInfo.id }}</div>
        </div>
        <div class="vip-level" v-if="userInfo.vipLevel">
          <van-tag type="warning">VIP{{ userInfo.vipLevel }}</van-tag>
        </div>
      </div>
      
      <div v-else class="not-logged-in">
        <div class="login-tip">登录后体验更多功能</div>
        <div class="login-actions">
          <van-button type="primary" size="small" @click="navigateTo('/user/login')">
            登录
          </van-button>
          <van-button plain size="small" @click="navigateTo('/user/register')">
            注册
          </van-button>
        </div>
      </div>
    </div>
    
    <!-- 功能菜单 -->
    <div class="menu-section card">
      <div class="section-title">账户管理</div>
      <van-cell-group inset>
        <van-cell title="个人资料" is-link @click="navigateTo('/user/profile')" />
        <van-cell title="安全设置" is-link @click="navigateTo('/user/security')" />
        <van-cell title="实名认证" is-link @click="navigateTo('/user/kyc')" />
        <van-cell title="地址管理" is-link @click="navigateTo('/user/address')" />
      </van-cell-group>
    </div>
    
    <div class="menu-section card">
      <div class="section-title">交易管理</div>
      <van-cell-group inset>
        <van-cell title="我的订单" is-link @click="navigateTo('/user/orders')" />
        <van-cell title="交易历史" is-link @click="navigateTo('/user/history')" />
        <van-cell title="收益记录" is-link @click="navigateTo('/user/earnings')" />
      </van-cell-group>
    </div>
    
    <div class="menu-section card">
      <div class="section-title">其他服务</div>
      <van-cell-group inset>
        <van-cell title="帮助中心" is-link @click="navigateTo('/user/help')" />
        <van-cell title="关于我们" is-link @click="navigateTo('/user/about')" />
        <van-cell title="设置" is-link @click="navigateTo('/user/settings')" />
        <van-cell v-if="userStore.isLogin" title="退出登录" @click="handleLogout" />
      </van-cell-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog, showNotify } from 'vant'
import { useUserStore } from '../../store/user'

// 获取路由实例
const router = useRouter()

// 获取用户状态
const userStore = useUserStore()

// 默认头像
const defaultAvatar = '/assets/images/default-avatar.png'

// 用户信息
const userInfo = computed(() => {
  return userStore.userInfo || {
    id: '',
    username: '',
    avatar: '',
    balance: 0,
    vipLevel: 0,
    isVerified: false
  }
})

// 导航到指定路由
const navigateTo = (path: string) => {
  router.push(path)
}

// 处理退出登录
const handleLogout = () => {
  showDialog({
    title: '退出登录',
    message: '确定要退出登录吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    confirmButtonColor: '#ee0a24'
  }).then(() => {
    // 执行退出登录
    userStore.logout()
    
    // 显示提示
    showNotify({ type: 'success', message: '已退出登录' })
    
    // 跳转到登录页
    router.push('/user/login')
  }).catch(() => {
    // 取消退出
  })
}

// 组件挂载时
onMounted(() => {
  // 如果已登录，获取用户信息
  if (userStore.isLogin && !userStore.userInfo) {
    userStore.fetchUserInfo()
  }
})
</script>

<style lang="scss">
.user-page {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding: var(--padding-md);
  
  .user-card {
    margin-bottom: var(--padding-md);
    
    .user-info {
      display: flex;
      align-items: center;
      
      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: var(--padding-md);
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      .info {
        flex: 1;
        
        .username {
          font-size: var(--font-size-lg);
          font-weight: 500;
          color: var(--text-color);
          margin-bottom: 4px;
        }
        
        .user-id {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
      }
      
      .vip-level {
        margin-left: var(--padding-md);
      }
    }
    
    .not-logged-in {
      padding: var(--padding-md) 0;
      text-align: center;
      
      .login-tip {
        font-size: var(--font-size-md);
        color: var(--text-secondary);
        margin-bottom: var(--padding-md);
      }
      
      .login-actions {
        display: flex;
        justify-content: center;
        
        .van-button {
          margin: 0 var(--padding-xs);
        }
      }
    }
  }
  
  .menu-section {
    margin-bottom: var(--padding-md);
    
    .section-title {
      padding: 0 var(--padding-md);
      margin-bottom: var(--padding-xs);
    }
  }
}
</style>
