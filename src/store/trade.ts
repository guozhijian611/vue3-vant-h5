import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { useMarketStore } from './market'
import Big from 'big.js'

// 订单类型
export enum OrderType {
  MARKET = 'market', // 市价单
  LIMIT = 'limit',   // 限价单
  STOP = 'stop'      // 条件单
}

// 订单方向
export enum OrderDirection {
  BUY = 'buy',   // 买入
  SELL = 'sell'  // 卖出
}

// 杠杆模式
export enum LeverageMode {
  ISOLATED = 'isolated', // 逐仓
  CROSS = 'cross'        // 全仓
}

// 订单状态
export enum OrderStatus {
  PENDING = 'pending',     // 待处理
  FILLED = 'filled',       // 已成交
  PARTIALLY = 'partially', // 部分成交
  CANCELED = 'canceled',   // 已取消
  REJECTED = 'rejected'    // 已拒绝
}

// 订单信息类型
export interface Order {
  id: string
  userId: string
  symbol: string
  type: OrderType
  direction: OrderDirection
  price: number
  amount: number
  filled: number
  status: OrderStatus
  leverage: number
  leverageMode: LeverageMode
  createTime: number
  updateTime: number
  fee: number
}

// 持仓信息类型
export interface Position {
  id: string
  userId: string
  symbol: string
  direction: OrderDirection
  amount: number
  entryPrice: number
  markPrice: number
  leverage: number
  leverageMode: LeverageMode
  marginAmount: number
  unrealizedPnl: number
  liquidationPrice: number
  createTime: number
  updateTime: number
}

// 交易状态类型
export interface TradeState {
  currentSymbol: string
  orderType: OrderType
  orderDirection: OrderDirection
  leverageMode: LeverageMode
  leverage: number
  price: number
  amount: number
  orders: Order[]
  positions: Position[]
  isLoading: boolean
}

// 创建交易状态
export const useTradeStore = defineStore('trade', {
  state: (): TradeState => ({
    currentSymbol: 'BTC',
    orderType: OrderType.LIMIT,
    orderDirection: OrderDirection.BUY,
    leverageMode: LeverageMode.ISOLATED,
    leverage: 10,
    price: 0,
    amount: 0,
    orders: [],
    positions: [],
    isLoading: false
  }),
  
  getters: {
    // 获取当前币种价格
    currentPrice(): number {
      const marketStore = useMarketStore()
      const coin = marketStore.coinList.find(c => c.symbol === this.currentSymbol)
      return coin?.price || 0
    },
    
    // 计算订单总价值
    orderValue(): number {
      if (this.orderType === OrderType.MARKET) {
        return this.amount * this.currentPrice
      }
      return this.amount * this.price
    },
    
    // 计算保证金
    marginRequired(): number {
      return new Big(this.orderValue).div(this.leverage).toNumber()
    },
    
    // 计算手续费
    tradingFee(): number {
      // 假设手续费为0.05%
      return new Big(this.orderValue).mul(0.0005).toNumber()
    },
    
    // 计算强平价格
    liquidationPrice(): number {
      if (this.orderDirection === OrderDirection.BUY) {
        // 多仓强平价 = 开仓价格 * (1 - 1/杠杆 + 维持保证金率)
        return new Big(this.price || this.currentPrice)
          .mul(1 - 1/this.leverage + 0.005)
          .toNumber()
      } else {
        // 空仓强平价 = 开仓价格 * (1 + 1/杠杆 - 维持保证金率)
        return new Big(this.price || this.currentPrice)
          .mul(1 + 1/this.leverage - 0.005)
          .toNumber()
      }
    },
    
    // 获取活跃订单
    activeOrders(): Order[] {
      return this.orders.filter(order => 
        order.status === OrderStatus.PENDING || 
        order.status === OrderStatus.PARTIALLY
      )
    },
    
    // 获取历史订单
    historyOrders(): Order[] {
      return this.orders.filter(order => 
        order.status === OrderStatus.FILLED || 
        order.status === OrderStatus.CANCELED ||
        order.status === OrderStatus.REJECTED
      )
    },
    
    // 获取当前币种的持仓
    currentPositions(): Position[] {
      return this.positions.filter(position => position.symbol === this.currentSymbol)
    },
    
    // 计算总未实现盈亏
    totalUnrealizedPnl(): number {
      return this.positions.reduce((sum, position) => sum + position.unrealizedPnl, 0)
    }
  },
  
  actions: {
    // 设置当前交易币种
    setCurrentSymbol(symbol: string) {
      this.currentSymbol = symbol
      
      // 重置表单
      this.resetOrderForm()
      
      // 更新持仓的标记价格
      this.updatePositionsMarkPrice()
    },
    
    // 设置订单类型
    setOrderType(type: OrderType) {
      this.orderType = type
      
      // 如果是市价单，清空价格
      if (type === OrderType.MARKET) {
        this.price = 0
      } else {
        // 限价单默认使用当前价格
        this.price = this.currentPrice
      }
    },
    
    // 设置订单方向
    setOrderDirection(direction: OrderDirection) {
      this.orderDirection = direction
    },
    
    // 设置杠杆模式
    setLeverageMode(mode: LeverageMode) {
      this.leverageMode = mode
    },
    
    // 设置杠杆倍数
    setLeverage(leverage: number) {
      if (leverage < 1) leverage = 1
      if (leverage > 100) leverage = 100
      this.leverage = leverage
    },
    
    // 设置价格
    setPrice(price: number) {
      this.price = price
    },
    
    // 设置数量
    setAmount(amount: number) {
      this.amount = amount
    },
    
    // 重置订单表单
    resetOrderForm() {
      this.orderType = OrderType.LIMIT
      this.orderDirection = OrderDirection.BUY
      this.price = this.currentPrice
      this.amount = 0
    },
    
    // 创建订单
    async createOrder() {
      const userStore = useUserStore()
      
      if (!userStore.isLogin) {
        throw new Error('请先登录')
      }
      
      // 验证余额
      const requiredFunds = this.marginRequired + this.tradingFee
      if (userStore.balance < requiredFunds) {
        throw new Error('余额不足')
      }
      
      this.isLoading = true
      
      try {
        // 这里应该调用API创建订单
        // const { data } = await createOrder({...})
        
        // 模拟创建订单
        const newOrder: Order = {
          id: `order_${Date.now()}`,
          userId: userStore.userId || '',
          symbol: this.currentSymbol,
          type: this.orderType,
          direction: this.orderDirection,
          price: this.orderType === OrderType.MARKET ? this.currentPrice : this.price,
          amount: this.amount,
          filled: 0,
          status: OrderStatus.PENDING,
          leverage: this.leverage,
          leverageMode: this.leverageMode,
          createTime: Date.now(),
          updateTime: Date.now(),
          fee: this.tradingFee
        }
        
        this.orders.unshift(newOrder)
        
        // 模拟订单处理
        setTimeout(() => {
          this.processOrder(newOrder.id)
        }, 1000)
        
        return newOrder
      } catch (error) {
        console.error('创建订单失败', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 处理订单（模拟）
    processOrder(orderId: string) {
      const orderIndex = this.orders.findIndex(o => o.id === orderId)
      if (orderIndex === -1) return
      
      const order = this.orders[orderIndex]
      
      // 模拟成交
      if (order.type === OrderType.MARKET) {
        // 市价单立即成交
        this.orders[orderIndex] = {
          ...order,
          status: OrderStatus.FILLED,
          filled: order.amount,
          updateTime: Date.now()
        }
        
        // 创建持仓
        this.createPosition(this.orders[orderIndex])
      } else {
        // 限价单有50%的概率成交
        if (Math.random() > 0.5) {
          this.orders[orderIndex] = {
            ...order,
            status: OrderStatus.FILLED,
            filled: order.amount,
            updateTime: Date.now()
          }
          
          // 创建持仓
          this.createPosition(this.orders[orderIndex])
        }
      }
    },
    
    // 取消订单
    cancelOrder(orderId: string) {
      const orderIndex = this.orders.findIndex(o => o.id === orderId)
      if (orderIndex === -1) return
      
      // 只能取消待处理或部分成交的订单
      const order = this.orders[orderIndex]
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PARTIALLY) {
        return
      }
      
      this.orders[orderIndex] = {
        ...order,
        status: OrderStatus.CANCELED,
        updateTime: Date.now()
      }
    },
    
    // 创建持仓
    createPosition(order: Order) {
      // 检查是否已有相同币种和方向的持仓
      const existingPositionIndex = this.positions.findIndex(p => 
        p.symbol === order.symbol && p.direction === order.direction
      )
      
      if (existingPositionIndex > -1) {
        // 更新现有持仓
        const existingPosition = this.positions[existingPositionIndex]
        const totalAmount = existingPosition.amount + order.amount
        const entryPrice = (existingPosition.entryPrice * existingPosition.amount + order.price * order.amount) / totalAmount
        
        this.positions[existingPositionIndex] = {
          ...existingPosition,
          amount: totalAmount,
          entryPrice,
          markPrice: order.price,
          updateTime: Date.now()
        }
        
        // 更新未实现盈亏
        this.updatePositionPnl(existingPositionIndex)
      } else {
        // 创建新持仓
        const newPosition: Position = {
          id: `position_${Date.now()}`,
          userId: order.userId,
          symbol: order.symbol,
          direction: order.direction,
          amount: order.amount,
          entryPrice: order.price,
          markPrice: order.price,
          leverage: order.leverage,
          leverageMode: order.leverageMode,
          marginAmount: this.marginRequired,
          unrealizedPnl: 0,
          liquidationPrice: this.liquidationPrice,
          createTime: Date.now(),
          updateTime: Date.now()
        }
        
        this.positions.push(newPosition)
      }
    },
    
    // 平仓
    async closePosition(positionId: string, amount?: number) {
      const positionIndex = this.positions.findIndex(p => p.id === positionId)
      if (positionIndex === -1) return
      
      const position = this.positions[positionIndex]
      const closeAmount = amount || position.amount
      
      if (closeAmount > position.amount) {
        throw new Error('平仓数量不能大于持仓数量')
      }
      
      this.isLoading = true
      
      try {
        // 这里应该调用API平仓
        // const { data } = await closePosition(positionId, amount)
        
        // 创建平仓订单
        const closeOrder: Order = {
          id: `order_${Date.now()}`,
          userId: position.userId,
          symbol: position.symbol,
          type: OrderType.MARKET,
          direction: position.direction === OrderDirection.BUY ? OrderDirection.SELL : OrderDirection.BUY,
          price: this.currentPrice,
          amount: closeAmount,
          filled: closeAmount,
          status: OrderStatus.FILLED,
          leverage: position.leverage,
          leverageMode: position.leverageMode,
          createTime: Date.now(),
          updateTime: Date.now(),
          fee: new Big(this.currentPrice).mul(closeAmount).mul(0.0005).toNumber()
        }
        
        this.orders.unshift(closeOrder)
        
        // 更新持仓
        if (closeAmount === position.amount) {
          // 全部平仓，移除持仓
          this.positions.splice(positionIndex, 1)
        } else {
          // 部分平仓，更新持仓
          this.positions[positionIndex] = {
            ...position,
            amount: position.amount - closeAmount,
            updateTime: Date.now()
          }
          
          // 更新未实现盈亏
          this.updatePositionPnl(positionIndex)
        }
        
        return closeOrder
      } catch (error) {
        console.error('平仓失败', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新持仓的标记价格
    updatePositionsMarkPrice() {
      const marketStore = useMarketStore()
      
      this.positions.forEach((position, index) => {
        const coin = marketStore.coinList.find(c => c.symbol === position.symbol)
        if (coin) {
          this.positions[index] = {
            ...position,
            markPrice: coin.price,
            updateTime: Date.now()
          }
          
          // 更新未实现盈亏
          this.updatePositionPnl(index)
        }
      })
    },
    
    // 更新持仓的未实现盈亏
    updatePositionPnl(positionIndex: number) {
      const position = this.positions[positionIndex]
      
      let pnl = 0
      if (position.direction === OrderDirection.BUY) {
        // 多仓盈亏 = (标记价格 - 开仓价格) * 数量 * 杠杆
        pnl = new Big(position.markPrice - position.entryPrice)
          .mul(position.amount)
          .mul(position.leverage)
          .toNumber()
      } else {
        // 空仓盈亏 = (开仓价格 - 标记价格) * 数量 * 杠杆
        pnl = new Big(position.entryPrice - position.markPrice)
          .mul(position.amount)
          .mul(position.leverage)
          .toNumber()
      }
      
      this.positions[positionIndex] = {
        ...position,
        unrealizedPnl: pnl
      }
    },
    
    // 获取订单列表
    async fetchOrders() {
      const userStore = useUserStore()
      
      if (!userStore.isLogin) return
      
      this.isLoading = true
      
      try {
        // 这里应该调用API获取订单列表
        // const { data } = await getOrders()
        // this.orders = data
        
        // 模拟数据
        this.orders = this.generateMockOrders()
      } catch (error) {
        console.error('获取订单列表失败', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取持仓列表
    async fetchPositions() {
      const userStore = useUserStore()
      
      if (!userStore.isLogin) return
      
      this.isLoading = true
      
      try {
        // 这里应该调用API获取持仓列表
        // const { data } = await getPositions()
        // this.positions = data
        
        // 模拟数据
        this.positions = this.generateMockPositions()
        
        // 更新标记价格和未实现盈亏
        this.updatePositionsMarkPrice()
      } catch (error) {
        console.error('获取持仓列表失败', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 生成模拟订单数据
    generateMockOrders(): Order[] {
      const userStore = useUserStore()
      const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA']
      const orders: Order[] = []
      
      // 生成10个随机订单
      for (let i = 0; i < 10; i++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)]
        const direction = Math.random() > 0.5 ? OrderDirection.BUY : OrderDirection.SELL
        const type = Math.random() > 0.3 ? 
                    OrderType.LIMIT : 
                    Math.random() > 0.5 ? OrderType.MARKET : OrderType.STOP
        
        const price = symbol === 'BTC' ? 35000 + Math.random() * 2000 : 
                      symbol === 'ETH' ? 2000 + Math.random() * 200 : 
                      10 + Math.random() * 100
        
        const amount = Math.random() * 2
        const status = Math.random() > 0.7 ? OrderStatus.FILLED : 
                      Math.random() > 0.5 ? OrderStatus.PENDING : 
                      Math.random() > 0.5 ? OrderStatus.CANCELED : OrderStatus.PARTIALLY
        
        const filled = status === OrderStatus.FILLED ? amount : 
                      status === OrderStatus.PARTIALLY ? amount * Math.random() : 0
        
        const createTime = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        
        orders.push({
          id: `order_${i + 1}`,
          userId: userStore.userId || '',
          symbol,
          type,
          direction,
          price,
          amount,
          filled,
          status,
          leverage: Math.floor(Math.random() * 20) + 1,
          leverageMode: Math.random() > 0.5 ? LeverageMode.ISOLATED : LeverageMode.CROSS,
          createTime,
          updateTime: createTime + Math.floor(Math.random() * 60 * 60 * 1000),
          fee: price * amount * 0.0005
        })
      }
      
      return orders.sort((a, b) => b.createTime - a.createTime)
    },
    
    // 生成模拟持仓数据
    generateMockPositions(): Position[] {
      const userStore = useUserStore()
      const symbols = ['BTC', 'ETH', 'SOL']
      const positions: Position[] = []
      
      // 生成3个随机持仓
      for (let i = 0; i < 3; i++) {
        const symbol = symbols[i]
        const direction = Math.random() > 0.5 ? OrderDirection.BUY : OrderDirection.SELL
        
        const entryPrice = symbol === 'BTC' ? 35000 + Math.random() * 2000 : 
                          symbol === 'ETH' ? 2000 + Math.random() * 200 : 
                          10 + Math.random() * 100
        
        const markPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.1)
        const amount = Math.random() * 2
        const leverage = Math.floor(Math.random() * 20) + 1
        const leverageMode = Math.random() > 0.5 ? LeverageMode.ISOLATED : LeverageMode.CROSS
        
        let pnl = 0
        if (direction === OrderDirection.BUY) {
          pnl = (markPrice - entryPrice) * amount * leverage
        } else {
          pnl = (entryPrice - markPrice) * amount * leverage
        }
        
        const marginAmount = entryPrice * amount / leverage
        
        let liquidationPrice = 0
        if (direction === OrderDirection.BUY) {
          liquidationPrice = entryPrice * (1 - 1/leverage + 0.005)
        } else {
          liquidationPrice = entryPrice * (1 + 1/leverage - 0.005)
        }
        
        const createTime = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        
        positions.push({
          id: `position_${i + 1}`,
          userId: userStore.userId || '',
          symbol,
          direction,
          amount,
          entryPrice,
          markPrice,
          leverage,
          leverageMode,
          marginAmount,
          unrealizedPnl: pnl,
          liquidationPrice,
          createTime,
          updateTime: Date.now()
        })
      }
      
      return positions
    }
  }
})
