<template>
    <div class="trade-page">
      <!-- 交易对选择器 -->
      <div class="symbol-selector">
        <div class="current-symbol" @click="showSymbolPopup = true">
          <span class="symbol-name">{{ currentSymbol.symbol }}</span>
          <span 
            class="price" 
            :class="currentSymbol.priceChangePercent24h >= 0 ? 'price-up' : 'price-down'"
          >
            {{ formatPrice(currentSymbol.price) }}
          </span>
          <van-icon name="arrow-down" />
        </div>
        <div class="price-change">
          <span 
            :class="currentSymbol.priceChangePercent24h >= 0 ? 'price-up' : 'price-down'"
          >
            {{ formatPriceChange(currentSymbol.priceChangePercent24h) }}
          </span>
        </div>
      </div>
      
      <!-- 交易图表 -->
      <div class="trade-chart">
        <div class="chart-header">
          <div class="time-selector">
            <van-button 
              v-for="period in timePeriods" 
              :key="period.value"
              size="small"
              :type="activePeriod === period.value ? 'primary' : 'default'"
              @click="changePeriod(period.value)"
            >
              {{ period.label }}
            </van-button>
          </div>
          <div class="chart-tools">
            <van-icon name="setting-o" @click="showChartSettings = true" />
          </div>
        </div>
        <div class="chart-container" ref="chartContainer">
          <!-- 这里将渲染K线图 -->
        </div>
      </div>
      
      <!-- 交易表单 -->
      <div class="trade-form">
        <van-tabs v-model:active="activeTradeTab" animated swipeable>
          <van-tab title="限价委托" name="limit">
            <div class="trade-type-selector">
              <van-button 
                :type="tradeType === 'buy' ? 'success' : 'default'"
                size="small"
                @click="tradeType = 'buy'"
              >
                买入
              </van-button>
              <van-button 
                :type="tradeType === 'sell' ? 'danger' : 'default'"
                size="small"
                @click="tradeType = 'sell'"
              >
                卖出
              </van-button>
            </div>
            
            <div class="form-item">
              <label>价格</label>
              <van-field
                v-model="limitForm.price"
                type="number"
                :placeholder="`${tradeType === 'buy' ? '买入' : '卖出'}价格`"
                :right-icon="currentSymbol.symbol.split('/')[1]"
              />
            </div>
            
            <div class="form-item">
              <label>数量</label>
              <van-field
                v-model="limitForm.amount"
                type="number"
                :placeholder="`${tradeType === 'buy' ? '买入' : '卖出'}数量`"
                :right-icon="currentSymbol.symbol.split('/')[0]"
              />
            </div>
            
            <div class="amount-slider">
              <van-slider
                v-model="amountPercent"
                :min="0"
                :max="100"
                :step="25"
                @update:model-value="updateAmount"
              >
                <template #button>
                  <div class="custom-slider-button">{{ amountPercent }}%</div>
                </template>
              </van-slider>
              <div class="slider-marks">
                <span v-for="mark in [0, 25, 50, 75, 100]" :key="mark">{{ mark }}%</span>
              </div>
            </div>
            
            <div class="trade-info">
              <div class="info-item">
                <span class="label">交易额</span>
                <span class="value">{{ calculateTotal() }} {{ currentSymbol.symbol.split('/')[1] }}</span>
              </div>
              <div class="info-item">
                <span class="label">可用</span>
                <span class="value">
                  {{ tradeType === 'buy' 
                    ? formatBalance(availableBalance.quote) + ' ' + currentSymbol.symbol.split('/')[1]
                    : formatBalance(availableBalance.base) + ' ' + currentSymbol.symbol.split('/')[0]
                  }}
                </span>
              </div>
            </div>
            
            <div class="trade-action">
              <van-button
                :type="tradeType === 'buy' ? 'success' : 'danger'"
                block
                :loading="submitting"
                @click="submitLimitOrder"
              >
                {{ tradeType === 'buy' ? '买入' : '卖出' }} {{ currentSymbol.symbol.split('/')[0] }}
              </van-button>
            </div>
          </van-tab>
          
          <van-tab title="市价委托" name="market">
            <!-- 市价委托表单内容 -->
            <div class="trade-type-selector">
              <van-button 
                :type="tradeType === 'buy' ? 'success' : 'default'"
                size="small"
                @click="tradeType = 'buy'"
              >
                买入
              </van-button>
              <van-button 
                :type="tradeType === 'sell' ? 'danger' : 'default'"
                size="small"
                @click="tradeType = 'sell'"
              >
                卖出
              </van-button>
            </div>
            
            <div class="form-item">
              <label>{{ tradeType === 'buy' ? '交易额' : '数量' }}</label>
              <van-field
                v-model="marketForm.amount"
                type="number"
                :placeholder="tradeType === 'buy' ? '买入金额' : '卖出数量'"
                :right-icon="tradeType === 'buy' ? currentSymbol.symbol.split('/')[1] : currentSymbol.symbol.split('/')[0]"
              />
            </div>
            
            <div class="amount-slider">
              <van-slider
                v-model="amountPercent"
                :min="0"
                :max="100"
                :step="25"
                @update:model-value="updateMarketAmount"
              >
                <template #button>
                  <div class="custom-slider-button">{{ amountPercent }}%</div>
                </template>
              </van-slider>
              <div class="slider-marks">
                <span v-for="mark in [0, 25, 50, 75, 100]" :key="mark">{{ mark }}%</span>
              </div>
            </div>
            
            <div class="trade-info">
              <div class="info-item">
                <span class="label">预计{{ tradeType === 'buy' ? '获得' : '卖出' }}</span>
                <span class="value">
                  {{ calculateMarketEstimate() }} 
                  {{ tradeType === 'buy' ? currentSymbol.symbol.split('/')[0] : currentSymbol.symbol.split('/')[1] }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">可用</span>
                <span class="value">
                  {{ tradeType === 'buy' 
                    ? formatBalance(availableBalance.quote) + ' ' + currentSymbol.symbol.split('/')[1]
                    : formatBalance(availableBalance.base) + ' ' + currentSymbol.symbol.split('/')[0]
                  }}
                </span>
              </div>
            </div>
            
            <div class="trade-action">
              <van-button
                :type="tradeType === 'buy' ? 'success' : 'danger'"
                block
                :loading="submitting"
                @click="submitMarketOrder"
              >
                {{ tradeType === 'buy' ? '买入' : '卖出' }} {{ currentSymbol.symbol.split('/')[0] }}
              </van-button>
            </div>
          </van-tab>
        </van-tabs>
      </div>
      
      <!-- 交易对选择弹窗 -->
      <van-popup
        v-model:show="showSymbolPopup"
        position="bottom"
        round
        :style="{ height: '60%' }"
      >
        <div class="symbol-popup">
          <div class="popup-header">
            <div class="popup-title">选择交易对</div>
            <van-icon name="cross" @click="showSymbolPopup = false" />
          </div>
          
          <van-search
            v-model="symbolSearchKeyword"
            placeholder="搜索交易对"
            shape="round"
          />
          
          <div class="symbol-tabs">
            <van-tabs v-model:active="activeSymbolTab">
              <van-tab title="全部" name="all"></van-tab>
              <van-tab title="自选" name="favorite"></van-tab>
            </van-tabs>
          </div>
          
          <div class="symbol-list">
            <div 
              v-for="symbol in filteredSymbols" 
              :key="symbol.id"
              class="symbol-item"
              @click="selectSymbol(symbol)"
            >
              <div class="symbol-info">
                <div class="symbol-name">{{ symbol.symbol }}</div>
                <div class="symbol-fullname">{{ symbol.name }}</div>
              </div>
              <div class="symbol-price">
                <div class="price">{{ formatPrice(symbol.price) }}</div>
                <div 
                  class="price-change" 
                  :class="symbol.priceChangePercent24h >= 0 ? 'price-up' : 'price-down'"
                >
                  {{ formatPriceChange(symbol.priceChangePercent24h) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-popup>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { showNotify } from 'vant'
  import * as echarts from 'echarts/core'
  import { CandlestickChart, LineChart, BarChart } from 'echarts/charts'
  import { 
    GridComponent, 
    TooltipComponent, 
    TitleComponent, 
    DataZoomComponent,
    LegendComponent
  } from 'echarts/components'
  import { SVGRenderer } from 'echarts/renderers'
  import { useMarketStore } from '../../store/market'
  import { useTradeStore, OrderType, OrderDirection } from '../../store/trade'
  import { useAssetStore } from '../../store/asset'
  import { useUserStore } from '../../store/user'
  
  // 注册必要的echarts组件
  echarts.use([
    CandlestickChart,
    LineChart,
    BarChart,
    GridComponent,
    TooltipComponent,
    TitleComponent,
    DataZoomComponent,
    LegendComponent,
    SVGRenderer
  ])
  
  // 获取路由实例
  const route = useRoute()
  const router = useRouter()
  
  // 获取状态
  const marketStore = useMarketStore()
  const tradeStore = useTradeStore()
  const assetStore = useAssetStore()
  const userStore = useUserStore()
  
  // 图表容器引用
  const chartContainer = ref<HTMLElement | null>(null)
  // 图表实例
  let chartInstance: echarts.ECharts | null = null
  
  // 交易对选择弹窗
  const showSymbolPopup = ref(false)
  const symbolSearchKeyword = ref('')
  const activeSymbolTab = ref('all')
  
  // 当前交易对
  const currentSymbol = computed(() => {
    return marketStore.activeCoin || {
      id: 'btcusdt',
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      price: 50000,
      priceChangePercent24h: 2.5,
      volume24h: 1000000000,
      isFavorite: false,
      high24h: 52000,
      low24h: 48000,
      marketCap: 950000000000,
      priceChange24h: 1250
    }
  })
  
  // 交易表单相关
  const activeTradeTab = ref('limit')
  const tradeType = ref('buy')
  const amountPercent = ref(0)
  const submitting = ref(false)
  
  // 限价委托表单
  const limitForm = reactive({
    price: '',
    amount: ''
  })
  
  // 市价委托表单
  const marketForm = reactive({
    amount: ''
  })
  
  // 可用余额
  const availableBalance = computed(() => {
    return {
      // 获取基础货币和计价货币的可用余额
      base: assetStore.currentAssets.find(asset => asset.coin === currentSymbol.value.symbol.split('/')[0])?.available || 0,
      quote: assetStore.currentAssets.find(asset => asset.coin === currentSymbol.value.symbol.split('/')[1])?.available || 0
    }
  })
  
  // 时间周期选项
  const timePeriods = [
    { label: '1分', value: '1m' },
    { label: '5分', value: '5m' },
    { label: '15分', value: '15m' },
    { label: '30分', value: '30m' },
    { label: '1小时', value: '1h' },
    { label: '4小时', value: '4h' },
    { label: '1天', value: '1d' },
    { label: '1周', value: '1w' }
  ]
  const activePeriod = ref('15m')
  
  // 图表设置弹窗
  const showChartSettings = ref(false)
  
  // 筛选后的交易对列表
  const filteredSymbols = computed(() => {
    let symbols = activeSymbolTab.value === 'favorite' 
      ? marketStore.favoriteCoinList 
      : marketStore.allCoins
    
    if (symbolSearchKeyword.value) {
      const keyword = symbolSearchKeyword.value.toLowerCase()
      symbols = symbols.filter(symbol => 
        symbol.symbol.toLowerCase().includes(keyword) || 
        symbol.name.toLowerCase().includes(keyword)
      )
    }
    
    return symbols
  })
  
  // 选择交易对
  const selectSymbol = (symbol: any) => {
    marketStore.setActiveCoin(symbol.id)
    showSymbolPopup.value = false
    
    // 更新K线图
    loadKlineData()
  }
  
  // 更新时间周期
  const changePeriod = (period: string) => {
    activePeriod.value = period
    loadKlineData()
  }
  
  // 加载K线数据
  const loadKlineData = async () => {
    try {
      await marketStore.fetchKlineData(currentSymbol.value.id, activePeriod.value)
      renderChart()
    } catch (error) {
      showNotify({ type: 'danger', message: '获取K线数据失败' })
    }
  }
  
  // 渲染K线图
  const renderChart = () => {
    if (!chartContainer.value) return
    
    if (!chartInstance) {
      chartInstance = echarts.init(chartContainer.value)
    }
    
    const klineData = marketStore.klineData
    
    // 处理数据格式
    const categoryData = klineData.map(item => item.time)
    const values = klineData.map(item => [item.open, item.close, item.low, item.high])
    const volumes = klineData.map(item => [item.time, item.volume, item.close > item.open ? 1 : -1])
    
    const option = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        textStyle: {
          color: '#333'
        }
      },
      axisPointer: {
        link: { xAxisIndex: 'all' },
        label: {
          backgroundColor: '#777'
        }
      },
      grid: [
        {
          left: '10%',
          right: '10%',
          top: '10%',
          height: '60%'
        },
        {
          left: '10%',
          right: '10%',
          top: '75%',
          height: '15%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: categoryData,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          splitNumber: 20,
          min: 'dataMin',
          max: 'dataMax',
          axisPointer: {
            z: 100
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: categoryData,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          splitNumber: 20,
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 50,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '92%',
          start: 50,
          end: 100
        }
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: values,
          itemStyle: {
            color: '#ef5350',
            color0: '#26a69a',
            borderColor: '#ef5350',
            borderColor0: '#26a69a'
          }
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes,
          itemStyle: {
            color: function(params: any) {
              return params.data[2] > 0 ? '#26a69a' : '#ef5350'
            }
          }
        }
      ]
    }
    
    chartInstance.setOption(option)
  }
  
  // 更新限价单数量
  const updateAmount = () => {
    if (tradeType.value === 'buy' && availableBalance.value.quote > 0) {
      const maxAmount = availableBalance.value.quote / parseFloat(limitForm.price || '0')
      limitForm.amount = ((maxAmount * amountPercent.value) / 100).toFixed(8)
    } else if (tradeType.value === 'sell' && availableBalance.value.base > 0) {
      limitForm.amount = ((availableBalance.value.base * amountPercent.value) / 100).toFixed(8)
    }
  }
  
  // 更新市价单数量
  const updateMarketAmount = () => {
    if (tradeType.value === 'buy' && availableBalance.value.quote > 0) {
      marketForm.amount = ((availableBalance.value.quote * amountPercent.value) / 100).toFixed(2)
    } else if (tradeType.value === 'sell' && availableBalance.value.base > 0) {
      marketForm.amount = ((availableBalance.value.base * amountPercent.value) / 100).toFixed(8)
    }
  }
  
  // 计算限价单总额
  const calculateTotal = () => {
    const price = parseFloat(limitForm.price || '0')
    const amount = parseFloat(limitForm.amount || '0')
    return (price * amount).toFixed(2)
  }
  
  // 计算市价单预估
  const calculateMarketEstimate = () => {
    const amount = parseFloat(marketForm.amount || '0')
    
    if (tradeType.value === 'buy') {
      // 买入时，预估获得的基础货币数量
      return (amount / currentSymbol.value.price).toFixed(8)
    } else {
      // 卖出时，预估获得的计价货币数量
      return (amount * currentSymbol.value.price).toFixed(2)
    }
  }
  
  // 提交限价单
  const submitLimitOrder = async () => {
    if (!userStore.isLogin) {
      showNotify({ type: 'warning', message: '请先登录' })
      router.push('/user/login?redirect=/trade')
      return
    }
    
    if (!limitForm.price || !limitForm.amount) {
      showNotify({ type: 'warning', message: '请输入价格和数量' })
      return
    }
    
    const price = parseFloat(limitForm.price)
    const amount = parseFloat(limitForm.amount)
    
    if (price <= 0 || amount <= 0) {
      showNotify({ type: 'warning', message: '价格和数量必须大于0' })
      return
    }
    
    // 检查余额
    if (tradeType.value === 'buy') {
      const total = price * amount
      if (total > availableBalance.value.quote) {
        showNotify({ type: 'warning', message: `${currentSymbol.value.symbol.split('/')[1]}余额不足` })
        return
      }
    } else {
      if (amount > availableBalance.value.base) {
        showNotify({ type: 'warning', message: `${currentSymbol.value.symbol.split('/')[0]}余额不足` })
        return
      }
    }
    
    submitting.value = true
    
    try {
      // 设置 tradeStore 的状态
      tradeStore.setCurrentSymbol(currentSymbol.value.symbol)
      tradeStore.setOrderDirection(tradeType.value === 'buy' ? OrderDirection.BUY : OrderDirection.SELL)
      tradeStore.setPrice(price)
      tradeStore.setAmount(amount)
      
      // 创建订单
      await tradeStore.createOrder()
      
      showNotify({ type: 'success', message: '委托成功' })
      
      // 重置表单
      limitForm.price = ''
      limitForm.amount = ''
      amountPercent.value = 0
      
      // 刷新资产
      assetStore.fetchAssets()
    } catch (error: any) {
      showNotify({ 
        type: 'danger', 
        message: error.response?.data?.message || '委托失败，请重试' 
      })
    } finally {
      submitting.value = false
    }
  }
  
  // 提交市价单
  const submitMarketOrder = async () => {
    if (!userStore.isLogin) {
      showNotify({ type: 'warning', message: '请先登录' })
      router.push('/user/login?redirect=/trade')
      return
    }
    
    if (!marketForm.amount) {
      showNotify({ 
        type: 'warning', 
        message: `请输入${tradeType.value === 'buy' ? '买入金额' : '卖出数量'}` 
      })
      return
    }
    
    const amount = parseFloat(marketForm.amount)
    
    if (amount <= 0) {
      showNotify({ type: 'warning', message: '数量必须大于0' })
      return
    }
    
    // 检查余额
    if (tradeType.value === 'buy') {
      if (amount > availableBalance.value.quote) {
        showNotify({ type: 'warning', message: `${currentSymbol.value.symbol.split('/')[1]}余额不足` })
        return
      }
    } else {
      if (amount > availableBalance.value.base) {
        showNotify({ type: 'warning', message: `${currentSymbol.value.symbol.split('/')[0]}余额不足` })
        return
      }
    }
    
    submitting.value = true
    
    try {
      // 设置 tradeStore 的状态
      tradeStore.setCurrentSymbol(currentSymbol.value.symbol)
      tradeStore.setOrderDirection(tradeType.value === 'buy' ? OrderDirection.BUY : OrderDirection.SELL)
      tradeStore.setOrderType(OrderType.MARKET)
      tradeStore.setAmount(amount)
      
      // 创建订单
      await tradeStore.createOrder()
      
      showNotify({ type: 'success', message: '委托成功' })
      
      // 重置表单
      marketForm.amount = ''
      amountPercent.value = 0
      
      // 刷新资产
      assetStore.fetchAssets()
    } catch (error: any) {
      showNotify({ 
        type: 'danger', 
        message: error.response?.data?.message || '委托失败，请重试' 
      })
    } finally {
      submitting.value = false
    }
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
  const formatPriceChange = (change: number): string => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }
  
  // 格式化余额
  const formatBalance = (balance: number): string => {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    })
  }
  
  // 监听窗口大小变化
  const handleResize = () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  }
  
  // 组件挂载时
  onMounted(async () => {
    // 获取交易对列表
    await marketStore.fetchAllCoins()
    
    // 从路由参数获取交易对
    const symbolId = route.params.id as string
    if (symbolId) {
      marketStore.setActiveCoin(symbolId)
    }
    
    // 加载K线数据
    loadKlineData()
    
    // 如果已登录，获取用户资产
    if (userStore.isLogin) {
      assetStore.fetchAssets()
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  })
  
  // 组件卸载前
  onBeforeUnmount(() => {
    // 销毁图表实例
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    
    // 移除窗口大小变化监听
    window.removeEventListener('resize', handleResize)
  })
  
  // 监听交易类型变化，重置表单
  watch(tradeType, () => {
    limitForm.price = ''
    limitForm.amount = ''
    marketForm.amount = ''
    amountPercent.value = 0
  })
  
  // 监听交易标签页变化，重置表单
  watch(activeTradeTab, () => {
    limitForm.price = ''
    limitForm.amount = ''
    marketForm.amount = ''
    amountPercent.value = 0
  })
  </script>
  
  <style lang="scss">
  @import '../../assets/styles/trade.scss';
  </style>