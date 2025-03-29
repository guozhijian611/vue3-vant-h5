<template>
  <div class="asset-page">
    <!-- 资产总览 -->
    <div class="asset-overview card">
      <div class="overview-header">
        <h3 class="section-title">资产总览</h3>
        <van-button 
          size="small" 
          icon="refresh" 
          @click="refreshAssets"
          :loading="refreshing"
        >
          刷新
        </van-button>
      </div>
      
      <div class="total-assets">
        <div class="total-value">
          <span class="label">总资产折合(USDT)</span>
          <span class="value">{{ formatMoney(totalAssetValue) }}</span>
        </div>
        <div class="asset-change">
          <span 
            :class="assetChange >= 0 ? 'price-up' : 'price-down'"
          >
            {{ formatPriceChange(assetChange) }}
          </span>
          <span class="time">24h</span>
        </div>
      </div>
      
      <div class="asset-actions">
        <van-button type="primary" size="small" @click="navigateTo('/trade')">
          交易
        </van-button>
        <van-button plain size="small" @click="navigateTo('/asset/transfer')">
          划转
        </van-button>
        <van-button plain size="small" @click="navigateTo('/asset/deposit')">
          充值
        </van-button>
        <van-button plain size="small" @click="navigateTo('/asset/withdraw')">
          提现
        </van-button>
      </div>
    </div>
    
    <!-- 资产列表 -->
    <div class="asset-list card">
      <div class="list-header">
        <h3 class="section-title">我的资产</h3>
        <div class="filter-actions">
          <van-search
            v-model="searchKeyword"
            placeholder="搜索币种"
            shape="round"
            background="transparent"
          />
          <van-checkbox v-model="hideSmallAssets">隐藏小额资产</van-checkbox>
        </div>
      </div>
      
      <van-empty v-if="filteredAssets.length === 0" description="暂无资产" />
      
      <div v-else class="asset-items">
        <div 
          v-for="asset in filteredAssets" 
          :key="asset.currency"
          class="asset-item"
          @click="showAssetDetail(asset)"
        >
          <div class="asset-icon">
            <img :src="getCoinIcon(asset.currency)" :alt="asset.currency">
          </div>
          <div class="asset-info">
            <div class="asset-name">
              <span class="currency">{{ asset.currency }}</span>
              <span class="fullname">{{ getCoinName(asset.currency) }}</span>
            </div>
            <div class="asset-balance">
              <div class="total">
                <span class="label">总额</span>
                <span class="value">{{ formatBalance(asset.total) }}</span>
              </div>
              <div class="available">
                <span class="label">可用</span>
                <span class="value">{{ formatBalance(asset.available) }}</span>
              </div>
              <div class="frozen" v-if="asset.frozen > 0">
                <span class="label">冻结</span>
                <span class="value">{{ formatBalance(asset.frozen) }}</span>
              </div>
            </div>
          </div>
          <div class="asset-value">
            <span class="value">≈ {{ formatMoney(asset.totalInUsdt) }} USDT</span>
            <van-icon name="arrow" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 资产详情弹窗 -->
    <van-popup
      v-model:show="showDetailPopup"
      position="bottom"
      round
      :style="{ height: '70%' }"
    >
      <div class="asset-detail-popup" v-if="selectedAsset">
        <div class="popup-header">
          <div class="popup-title">{{ selectedAsset.currency }} 详情</div>
          <van-icon name="cross" @click="showDetailPopup = false" />
        </div>
        
        <div class="asset-detail-content">
          <div class="detail-overview">
            <div class="detail-icon">
              <img :src="getCoinIcon(selectedAsset.currency)" :alt="selectedAsset.currency">
            </div>
            <div class="detail-balance">
              <div class="total-balance">{{ formatBalance(selectedAsset.total) }}</div>
              <div class="balance-value">≈ {{ formatMoney(selectedAsset.totalInUsdt) }} USDT</div>
            </div>
          </div>
          
          <div class="balance-details">
            <div class="balance-item">
              <span class="label">可用</span>
              <span class="value">{{ formatBalance(selectedAsset.available) }}</span>
            </div>
            <div class="balance-item" v-if="selectedAsset.frozen > 0">
              <span class="label">冻结</span>
              <span class="value">{{ formatBalance(selectedAsset.frozen) }}</span>
            </div>
          </div>
          
          <div class="detail-actions">
            <van-button type="primary" block @click="navigateToTrade(selectedAsset.currency)">
              交易
            </van-button>
            <div class="action-buttons">
              <van-button plain @click="navigateTo('/asset/transfer')">划转</van-button>
              <van-button plain @click="navigateTo('/asset/deposit')">充值</van-button>
              <van-button plain @click="navigateTo('/asset/withdraw')">提现</van-button>
            </div>
          </div>
          
          <div class="transaction-history">
            <div class="history-header">
              <h4>最近交易记录</h4>
              <router-link to="/asset/history" class="view-all">
                查看全部 <van-icon name="arrow" />
              </router-link>
            </div>
            
            <van-empty v-if="recentTransactions.length === 0" description="暂无交易记录" />
            
            <div v-else class="history-items">
              <div 
                v-for="(transaction, index) in recentTransactions" 
                :key="index"
                class="history-item"
              >
                <div class="transaction-info">
                  <div class="transaction-type">{{ getTransactionType(transaction.type) }}</div>
                  <div class="transaction-time">{{ formatTime(transaction.time) }}</div>
                </div>
                <div class="transaction-amount">
                  <span :class="transaction.amount > 0 ? 'price-up' : 'price-down'">
                    {{ transaction.amount > 0 ? '+' : '' }}{{ formatBalance(transaction.amount) }} {{ transaction.currency }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showNotify } from 'vant'
import { useAssetStore } from '../../store/asset'
import { useMarketStore } from '../../store/market'
import { useUserStore } from '../../store/user'
import dayjs from 'dayjs'

// 获取路由实例
const router = useRouter()

// 获取状态
const assetStore = useAssetStore()
const marketStore = useMarketStore()
const userStore = useUserStore()

// 刷新状态
const refreshing = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 隐藏小额资产
const hideSmallAssets = ref(false)

// 资产详情弹窗
const showDetailPopup = ref(false)
const selectedAsset = ref<any>(null)

// 总资产价值
const totalAssetValue = computed(() => {
  return assetStore.totalAssetValue
})

// 资产24小时变化
const assetChange = computed(() => {
  return assetStore.assetChange
})

// 筛选后的资产列表
const filteredAssets = computed(() => {
  let assets = assetStore.userAssets
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    assets = assets.filter(asset => 
      asset.currency.toLowerCase().includes(keyword) || 
      getCoinName(asset.currency).toLowerCase().includes(keyword)
    )
  }
  
  // 隐藏小额资产
  if (hideSmallAssets.value) {
    assets = assets.filter(asset => asset.totalInUsdt >= 1)
  }
  
  // 按价值排序
  return assets.sort((a, b) => b.totalInUsdt - a.totalInUsdt)
})

// 最近交易记录
const recentTransactions = computed(() => {
  if (!selectedAsset.value) return []
  
  return assetStore.getTransactionHistory(selectedAsset.value.currency).slice(0, 5)
})

// 刷新资产
const refreshAssets = async () => {
  if (!userStore.isLoggedIn) {
    showNotify({ type: 'warning', message: '请先登录' })
    router.push('/user/login?redirect=/asset')
    return
  }
  
  refreshing.value = true
  
  try {
    await assetStore.fetchUserAssets()
    showNotify({ type: 'success', message: '资产刷新成功' })
  } catch (error) {
    showNotify({ type: 'danger', message: '资产刷新失败，请重试' })
  } finally {
    refreshing.value = false
  }
}

// 显示资产详情
const showAssetDetail = (asset: any) => {
  selectedAsset.value = asset
  showDetailPopup.value = true
  
  // 获取交易记录
  assetStore.fetchTransactionHistory(asset.currency)
}

// 导航到指定路由
const navigateTo = (path: string) => {
  router.push(path)
}

// 导航到交易页面
const navigateToTrade = (currency: string) => {
  // 查找对应的交易对
  const symbol = marketStore.allCoins.find(coin => 
    coin.baseCurrency === currency || coin.quoteCurrency === currency
  )
  
  if (symbol) {
    marketStore.setActiveCoin(symbol.id)
    router.push(`/trade/${symbol.id}`)
  } else {
    router.push('/trade')
  }
}

// 获取币种图标
const getCoinIcon = (currency: string): string => {
  return `/assets/images/coins/${currency.toLowerCase()}.png`
}

// 获取币种全名
const getCoinName = (currency: string): string => {
  const coin = marketStore.getCoinBySymbol(currency)
  return coin ? coin.name : currency
}

// 获取交易类型名称
const getTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    deposit: '充值',
    withdraw: '提现',
    buy: '买入',
    sell: '卖出',
    transfer_in: '转入',
    transfer_out: '转出',
    fee: '手续费',
    reward: '奖励',
    other: '其他'
  }
  
  return typeMap[type] || type
}

// 格式化余额
const formatBalance = (balance: number): string => {
  return balance.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  })
}

// 格式化金额
const formatMoney = (amount: number): string => {
  return amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 格式化价格变化
const formatPriceChange = (change: number): string => {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时
onMounted(async () => {
  // 获取币种列表
  await marketStore.fetchAllCoins()
  
  // 如果已登录，获取用户资产
  if (userStore.isLoggedIn) {
    assetStore.fetchUserAssets()
  } else {
    showNotify({ type: 'warning', message: '请先登录' })
    router.push('/user/login?redirect=/asset')
  }
})
</script>

<style lang="scss">
@import '../../assets/styles/asset.scss';
</style>
