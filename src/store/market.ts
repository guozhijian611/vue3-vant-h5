import { defineStore } from 'pinia'

// 币种信息类型
export interface CoinInfo {
  id: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  volume24h: number
  marketCap: number
  high24h: number
  low24h: number
  isFavorite: boolean
}

// K线数据类型
export interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 行情状态类型
export interface MarketState {
  coinList: CoinInfo[]
  favoriteCoins: string[]
  activeCoin: CoinInfo | null
  klineData: KlineData[]
  klinePeriod: string
  isLoading: boolean
}

// 创建行情状态
export const useMarketStore = defineStore('market', {
  state: (): MarketState => ({
    coinList: [],
    favoriteCoins: JSON.parse(localStorage.getItem('favoriteCoins') || '[]'),
    activeCoin: null,
    klineData: [],
    klinePeriod: '1h',
    isLoading: false
  }),
  
  getters: {
    // 获取所有币种
    allCoins: (state) => state.coinList,
    
    // 获取收藏的币种
    favoriteCoinList: (state) => 
      state.coinList.filter(coin => state.favoriteCoins.includes(coin.id)),
    
    // 涨幅排序
    gainers: (state) => 
      [...state.coinList].sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h),
    
    // 跌幅排序
    losers: (state) => 
      [...state.coinList].sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h),
    
    // 交易量排序
    volumeLeaders: (state) => 
      [...state.coinList].sort((a, b) => b.volume24h - a.volume24h)
  },
  
  actions: {
    // 设置币种列表
    setCoinList(coinList: CoinInfo[]) {
      this.coinList = coinList.map(coin => ({
        ...coin,
        isFavorite: this.favoriteCoins.includes(coin.id)
      }))
    },
    
    // 设置当前选中的币种
    setActiveCoin(coinId: string) {
      this.activeCoin = this.coinList.find(coin => coin.id === coinId) || null
      if (this.activeCoin) {
        this.fetchKlineData(this.activeCoin.id, this.klinePeriod)
      }
    },
    
    // 切换收藏状态
    toggleFavorite(coinId: string) {
      const index = this.favoriteCoins.indexOf(coinId)
      if (index > -1) {
        this.favoriteCoins.splice(index, 1)
      } else {
        this.favoriteCoins.push(coinId)
      }
      
      // 更新币种列表中的收藏状态
      this.coinList = this.coinList.map(coin => {
        if (coin.id === coinId) {
          return { ...coin, isFavorite: !coin.isFavorite }
        }
        return coin
      })
      
      // 保存到本地存储
      localStorage.setItem('favoriteCoins', JSON.stringify(this.favoriteCoins))
    },
    
    // 设置K线周期
    setKlinePeriod(period: string) {
      this.klinePeriod = period
      if (this.activeCoin) {
        this.fetchKlineData(this.activeCoin.id, period)
      }
    },
    
    // 获取K线数据
    async fetchKlineData(coinId: string, period: string) {
      this.isLoading = true
      try {
        // 这里应该调用API获取K线数据
        // const { data } = await getKlineData(coinId, period)
        // this.klineData = data
        
        // 模拟数据
        this.klineData = this.generateMockKlineData(period)
      } catch (error) {
        console.error('获取K线数据失败', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取所有币种数据
    async fetchAllCoins() {
      this.isLoading = true
      try {
        // 这里应该调用API获取所有币种数据
        // const { data } = await getAllCoins()
        // this.setCoinList(data)
        
        // 模拟数据
        this.setCoinList(this.generateMockCoinList())
      } catch (error) {
        console.error('获取币种数据失败', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 生成模拟币种数据
    generateMockCoinList(): CoinInfo[] {
      const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'MATIC']
      const names = ['Bitcoin', 'Ethereum', 'Binance Coin', 'Solana', 'Cardano', 'Ripple', 'Polkadot', 'Dogecoin', 'Avalanche', 'Polygon']
      
      return symbols.map((symbol, index) => {
        const price = symbol === 'BTC' ? 35000 + Math.random() * 2000 : 
                      symbol === 'ETH' ? 2000 + Math.random() * 200 : 
                      10 + Math.random() * 100
        
        const priceChangePercent24h = (Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1)
        
        return {
          id: `coin_${index + 1}`,
          symbol,
          name: names[index],
          price,
          priceChange24h: price * priceChangePercent24h / 100,
          priceChangePercent24h,
          volume24h: Math.random() * 1000000000,
          marketCap: price * (1000000 + Math.random() * 10000000),
          high24h: price * (1 + Math.random() * 0.05),
          low24h: price * (1 - Math.random() * 0.05),
          isFavorite: false
        }
      })
    },
    
    // 生成模拟K线数据
    generateMockKlineData(period: string): KlineData[] {
      const now = Date.now()
      const periodInMs = period === '1h' ? 60 * 1000 : 
                         period === '4h' ? 4 * 60 * 60 * 1000 : 
                         period === '1d' ? 24 * 60 * 60 * 1000 : 
                         period === '1w' ? 7 * 24 * 60 * 60 * 1000 : 60 * 1000
      
      const count = 100
      const basePrice = this.activeCoin?.price || 100
      const volatility = 0.02
      
      const klineData: KlineData[] = []
      
      for (let i = 0; i < count; i++) {
        const time = now - (count - i) * periodInMs
        const open = i === 0 ? basePrice : klineData[i - 1].close
        const change = (Math.random() - 0.5) * volatility * open
        const close = open + change
        const high = Math.max(open, close) * (1 + Math.random() * 0.01)
        const low = Math.min(open, close) * (1 - Math.random() * 0.01)
        const volume = Math.random() * 1000000
        
        klineData.push({ time, open, high, low, close, volume })
      }
      
      return klineData
    }
  }
})
