<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo-container">
        <img src="../../assets/images/bh-logo.png" alt="BH标志" class="logo" />
      </div>
      <div class="ship-container">
        <img src="../../assets/images/golden-ship.png" alt="金色船只" class="ship-image" />
      </div>
    </div>
    
    <div class="login-form card">
      <h2 class="form-title">用户登录</h2>
      
      <div class="form-item">
        <label class="form-label">用户名</label>
        <van-field
          v-model="loginForm.username"
          placeholder="请输入用户名"
          :error="errors.username !== ''"
          :error-message="errors.username"
          @focus="clearError('username')"
        />
      </div>
      
      <div class="form-item">
        <label class="form-label">密码</label>
        <van-field
          v-model="loginForm.password"
          type="password"
          placeholder="请输入密码"
          :error="errors.password !== ''"
          :error-message="errors.password"
          @focus="clearError('password')"
        />
      </div>
      
      <div class="form-item captcha-container">
        <label class="form-label">验证码</label>
        <div class="captcha-input-group">
          <van-field
            v-model="loginForm.captchaCode"
            placeholder="请输入验证码"
            :error="errors.captchaCode !== ''"
            :error-message="errors.captchaCode"
            @focus="clearError('captchaCode')"
          />
          <div class="captcha-image" @click="refreshCaptcha">
            <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
            <div v-else class="captcha-loading">
              <van-loading type="spinner" size="20px" />
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <van-button type="primary" block :loading="isLoading" @click="handleLogin">
          登录
        </van-button>
      </div>
      
      <div class="form-footer">
        <span>还没有账号？</span>
        <router-link to="/user/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showNotify } from 'vant'
import { userApi } from '../../api'
import { useUserStore } from '../../store/user'

// 获取路由实例
const router = useRouter()
const route = useRoute()

// 获取用户状态
const userStore = useUserStore()

// 加载状态
const isLoading = ref(false)

// 验证码相关
const captchaImage = ref('')
const captchaId = ref('')

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  captchaCode: '',
  captchaId: ''
})

// 表单错误信息
const errors = reactive({
  username: '',
  password: '',
  captchaCode: ''
})

// 清除错误信息
const clearError = (field: string) => {
  errors[field as keyof typeof errors] = ''
}

// 验证表单
const validateForm = (): boolean => {
  let isValid = true
  
  if (!loginForm.username) {
    errors.username = '请输入用户名'
    isValid = false
  }
  
  if (!loginForm.password) {
    errors.password = '请输入密码'
    isValid = false
  }
  
  if (!loginForm.captchaCode) {
    errors.captchaCode = '请输入验证码'
    isValid = false
  }
  
  return isValid
}

// 获取验证码
const getCaptcha = async () => {
  try {
    const res = await userApi.getCaptcha()
    captchaImage.value = res.data.image
    captchaId.value = res.data.uuid
    loginForm.captchaId = res.data.uuid
  } catch (error) {
    showNotify({ type: 'danger', message: '获取验证码失败，请刷新页面重试' })
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  captchaImage.value = ''
  getCaptcha()
}

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  
  try {
    const res = await userApi.login(loginForm)
    
    // 保存token
    userStore.setToken(res.data.token)
    
    // 获取用户信息
    await userStore.fetchUserInfo()
    
    // 显示成功提示
    showNotify({ type: 'success', message: '登录成功' })
    
    // 跳转到首页或重定向页面
    const redirectPath = route.query.redirect as string || '/market'
    router.replace(redirectPath)
  } catch (error: any) {
    // 显示错误提示
    showNotify({ 
      type: 'danger', 
      message: error.response?.data?.message || '登录失败，请检查账号密码' 
    })
    
    // 刷新验证码
    refreshCaptcha()
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时获取验证码
onMounted(() => {
  getCaptcha()
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background-color: #0a2b5c; // 深蓝色背景
  padding: var(--padding-md);
  display: flex;
  flex-direction: column;
  
  .login-header {
    margin-bottom: var(--padding-xl);
    padding-top: 40px;
    
    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
      
      .logo {
        width: 120px;
        height: auto;
      }
    }
    
    .ship-container {
      display: flex;
      justify-content: center;
      
      .ship-image {
        width: 200px;
        height: auto;
      }
    }
  }
  
  .login-form {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: var(--border-radius-lg);
    padding: var(--padding-lg);
    
    .form-title {
      text-align: center;
      margin-bottom: 24px;
      color: #0a2b5c;
      font-size: 20px;
    }
    
    .form-item {
      margin-bottom: 16px;
      
      .form-label {
        display: block;
        margin-bottom: 6px;
        font-size: var(--font-size-md);
        color: var(--text-secondary);
      }
    }
    
    .captcha-container {
      .captcha-input-group {
        display: flex;
        align-items: center;
        
        .van-field {
          flex: 1;
        }
        
        .captcha-image {
          width: 120px;
          height: 40px;
          margin-left: 12px;
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          cursor: pointer;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .captcha-loading {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #f2f3f5;
          }
        }
      }
    }
    
    .form-actions {
      margin-top: 24px;
    }
    
    .form-footer {
      margin-top: 16px;
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      
      a {
        color: var(--primary-color);
        margin-left: 4px;
      }
    }
  }
}
</style>
