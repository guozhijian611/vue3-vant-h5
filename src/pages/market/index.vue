<template>
  <div class="market-page">
    <!-- 顶部搜索和筛选 -->
    <div class="market-header">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索币种"
        shape="round"
        background="transparent"
      />
      <div class="market-tabs">
        <van-tabs v-model:active="activeTab" animated swipeable>
          <van-tab title="全部" name="all"></van-tab>
          <van-tab title="自选" name="favorite"></van-tab>
          <van-tab title="涨幅榜" name="gainers"></van-tab>
          <van-tab title="跌幅榜" name="losers"></van-tab>
          <van-tab title="成交额" name="volume"></van-tab>
        </van-tabs>
      </div>
    </div>
    
    <!-- 币种列表 -->
    <div class="coin-list">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div 
            v-for="coin in displayCoins" 
            :key="coin.id" 
            class="coin-item"
            @click="navigateToDetail(coin.id)"
          >
            <div class="coin-info">
              <div class="coin-name">
                <span class="symbol">{{ coin.symbol }}</span>
                <span class="name">{{ coin.name }}</span>
              </div>
              <div 
                class="favorite-icon" 
                @click.stop="toggleFavorite(coin.id)"
              >
                <van-icon 
                  :name="coin.isFavorite ? 'star' : 'star-o'" 
                  :class="{ 'is-favorite': coin.isFavorite }"
                />
              </div>
            </div>
            
            <div class="coin-price-info">
              <div class="price">{{ formatPrice(coin.price) }}</div>
              <div 
                class="price-change" 
                :class="coin.priceChangePercent24h >= 0 ? 'price-up' : 'price-down'"
              >
                {{ formatPriceChange(coin.priceChangePercent24h) }}
              </div>
            </div>
            
            <div class="coin-chart">
              <mini-chart 
                :data="generateMockChartData(coin.priceChangePercent24h)" 
                :color="coin.priceChangePercent24h >= 0 ? '#26a69a' : '#ef5350'"
              />
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketStore } from '../../store/market'
import MiniChart from '../../components/market/MiniChart.vue'

// 获取路由实例
const router = useRouter()

// 获取行情状态
const marketStore = useMarketStore()

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的标签页
const activeTab = ref('all')

// 下拉刷新和加载更多状态
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)

// 监听标签页变化
watch(activeTab, () => {
  // 重置列表状态
  finished.value = false
  // 模拟加载数据
  setTimeout(() => {
    finished.value = true
  }, 500)
})

// 计算显示的币种列表
const displayCoins = computed(() => {
  let coins = []
  
  // 根据标签页筛选
  switch (activeTab.value) {
    case 'all':
      coins = marketStore.allCoins
      break
    case 'favorite':
      coins = marketStore.favoriteCoinList
      break
    case 'gainers':
      coins = marketStore.gainers
      break
    case 'losers':
      coins = marketStore.losers
      break
    case 'volume':
      coins = marketStore.volumeLeaders
      break
    default:
      coins = marketStore.allCoins
  }
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    coins = coins.filter(coin => 
      coin.symbol.toLowerCase().includes(keyword) || 
      coin.name.toLowerCase().includes(keyword)
    )
  }
  
  return coins
})

// 下拉刷新回调
const onRefresh = async () => {
  try {
    await marketStore.fetchAllCoins()
  } finally {
    refreshing.value = false
  }
}

// 加载更多回调
const onLoad = () => {
  // 模拟加载更多数据
  setTimeout(() => {
    // 标记加载完成
    finished.value = true
    loading.value = false
  }, 500)
}

// 切换收藏状态
const toggleFavorite = (coinId: string) => {
  marketStore.toggleFavorite(coinId)
}

// 跳转到币种详情
const navigateToDetail = (coinId: string) => {
  marketStore.setActiveCoin(coinId)
  router.push(`/market/detail/${coinId}`)
}

// 格式化价格
const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    })
  } else {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }
}

// 格式化价格变化
const formatPriceChange = (change: number | undefined): string => {
  if (change === undefined || isNaN(change)) {
    return '0.00%'
  }
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

// 生成模拟图表数据
const generateMockChartData = (priceChange: number) => {
  const points = 24
  const data = []
  
  // 基于涨跌幅生成趋势数据
  const trend = priceChange >= 0 ? 1 : -1
  const volatility = Math.abs(priceChange) / 10
  
  let value = 100
  
  for (let i = 0; i < points; i++) {
    // 添加一些随机波动，但保持整体趋势
    const change = (Math.random() - 0.5) * volatility + (trend * volatility / 2)
    value += change
    data.push(value)
  }
  
  return data
}

// 组件挂载时获取币种数据
onMounted(async () => {
  await marketStore.fetchAllCoins()
})
</script>

<style lang="scss" scoped>
.market-page {
  min-height: 100vh;
  background-color: var(--bg-color);
  
  .market-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--bg-color);
    
    .market-tabs {
      border-bottom: 1px solid var(--border-color);
    }
  }
  
  .coin-list {
    padding: 0 var(--padding-md);
    
    .coin-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--padding-md) 0;
      border-bottom: 1px solid var(--border-color);
      
      .coin-info {
        flex: 1;
        display: flex;
        align-items: center;
        
        .coin-name {
          display: flex;
          flex-direction: column;
          
          .symbol {
            font-size: var(--font-size-lg);
            font-weight: 500;
            color: var(--text-color);
          }
          
          .name {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin-top: 2px;
          }
        }
        
        .favorite-icon {
          margin-left: var(--padding-sm);
          padding: 4px;
          
          .van-icon {
            font-size: 18px;
            color: var(--text-light);
            
            &.is-favorite {
              color: #f6b93b;
            }
          }
        }
      }
      
      .coin-price-info {
        flex: 1;
        text-align: right;
        margin-right: var(--padding-md);
        
        .price {
          font-size: var(--font-size-md);
          font-weight: 500;
          color: var(--text-color);
        }
        
        .price-change {
          font-size: var(--font-size-sm);
          margin-top: 4px;
        }
      }
      
      .coin-chart {
        width: 80px;
        height: 40px;
      }
    }
  }
}
</style>
