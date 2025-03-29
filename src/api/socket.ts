import SockJS from 'sockjs-client'
import { useUserStore } from '../store/user'

// WebSocket连接状态
export enum SocketStatus {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed'
}

// WebSocket消息类型
export enum MessageType {
  PING = 'ping',          // 心跳
  PONG = 'pong',          // 心跳响应
  MARKET = 'market',      // 行情数据
  DEPTH = 'depth',        // 深度数据
  KLINE = 'kline',        // K线数据
  TRADE = 'trade',        // 交易数据
  ORDER = 'order',        // 订单更新
  POSITION = 'position',  // 持仓更新
  ASSET = 'asset',        // 资产更新
  NOTICE = 'notice'       // 系统通知
}

// WebSocket消息接口
export interface SocketMessage {
  type: MessageType
  data: any
  timestamp: number
}

// 订阅主题
export interface SubscribeTopic {
  channel: string
  symbol?: string
  interval?: string
}

class SocketClient {
  private socket: WebSocket | null = null
  private status: SocketStatus = SocketStatus.CLOSED
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private pingInterval = 30000
  private pingTimer: number | null = null
  private subscriptions: Set<string> = new Set()
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map()
  private statusChangeHandlers: ((status: SocketStatus) => void)[] = []
  
  // 获取WebSocket URL
  private getSocketUrl(): string {
    return import.meta.env.VITE_SOCKET_URL || '/ws'
  }
  
  // 连接WebSocket
  connect(): void {
    if (this.socket && (this.status === SocketStatus.CONNECTING || this.status === SocketStatus.OPEN)) {
      console.log('WebSocket已连接或正在连接中')
      return
    }
    
    this.setStatus(SocketStatus.CONNECTING)
    
    try {
      // 使用SockJS创建连接
      this.socket = new SockJS(this.getSocketUrl()) as unknown as WebSocket
      
      // 连接成功
      this.socket.onopen = this.onOpen.bind(this)
      
      // 接收消息
      this.socket.onmessage = this.onMessage.bind(this)
      
      // 连接关闭
      this.socket.onclose = this.onClose.bind(this)
      
      // 连接错误
      this.socket.onerror = this.onError.bind(this)
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.reconnect()
    }
  }
  
  // 连接成功回调
  private onOpen(): void {
    console.log('WebSocket连接成功')
    this.setStatus(SocketStatus.OPEN)
    this.reconnectAttempts = 0
    
    // 重新订阅之前的主题
    this.resubscribe()
    
    // 开始心跳检测
    this.startHeartbeat()
  }
  
  // 接收消息回调
  private onMessage(event: MessageEvent): void {
    try {
      const message: SocketMessage = JSON.parse(event.data)
      
      // 处理心跳响应
      if (message.type === MessageType.PONG) {
        return
      }
      
      // 触发消息处理器
      this.triggerMessageHandlers(message.type, message.data)
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  }
  
  // 连接关闭回调
  private onClose(): void {
    console.log('WebSocket连接关闭')
    this.setStatus(SocketStatus.CLOSED)
    this.stopHeartbeat()
    this.reconnect()
  }
  
  // 连接错误回调
  private onError(error: Event): void {
    console.error('WebSocket连接错误:', error)
    this.setStatus(SocketStatus.CLOSED)
    this.reconnect()
  }
  
  // 重新连接
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('WebSocket重连次数已达上限，停止重连')
      return
    }
    
    this.reconnectAttempts++
    console.log(`WebSocket ${this.reconnectAttempts}秒后重连...`)
    
    setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }
  
  // 开始心跳检测
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.pingTimer = window.setInterval(() => {
      this.sendPing()
    }, this.pingInterval)
  }
  
  // 停止心跳检测
  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
  
  // 发送心跳
  private sendPing(): void {
    this.send({
      type: MessageType.PING,
      data: null,
      timestamp: Date.now()
    })
  }
  
  // 发送消息
  send(message: SocketMessage): boolean {
    if (!this.socket || this.status !== SocketStatus.OPEN) {
      console.error('WebSocket未连接，无法发送消息')
      return false
    }
    
    try {
      this.socket.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('发送WebSocket消息失败:', error)
      return false
    }
  }
  
  // 订阅主题
  subscribe(topic: SubscribeTopic): void {
    const topicString = this.getTopicString(topic)
    
    if (this.subscriptions.has(topicString)) {
      return
    }
    
    this.subscriptions.add(topicString)
    
    if (this.status === SocketStatus.OPEN) {
      this.send({
        type: MessageType.PING,
        data: {
          action: 'subscribe',
          topic
        },
        timestamp: Date.now()
      })
    }
  }
  
  // 取消订阅
  unsubscribe(topic: SubscribeTopic): void {
    const topicString = this.getTopicString(topic)
    
    if (!this.subscriptions.has(topicString)) {
      return
    }
    
    this.subscriptions.delete(topicString)
    
    if (this.status === SocketStatus.OPEN) {
      this.send({
        type: MessageType.PING,
        data: {
          action: 'unsubscribe',
          topic
        },
        timestamp: Date.now()
      })
    }
  }
  
  // 重新订阅所有主题
  private resubscribe(): void {
    this.subscriptions.forEach(topicString => {
      const topic = JSON.parse(topicString)
      
      this.send({
        type: MessageType.PING,
        data: {
          action: 'subscribe',
          topic
        },
        timestamp: Date.now()
      })
    })
  }
  
  // 获取主题字符串
  private getTopicString(topic: SubscribeTopic): string {
    return JSON.stringify(topic)
  }
  
  // 添加消息处理器
  onMessage(type: MessageType, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    
    this.messageHandlers.get(type)?.push(handler)
  }
  
  // 移除消息处理器
  offMessage(type: MessageType, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      return
    }
    
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }
  
  // 触发消息处理器
  private triggerMessageHandlers(type: MessageType, data: any): void {
    if (!this.messageHandlers.has(type)) {
      return
    }
    
    const handlers = this.messageHandlers.get(type)
    handlers?.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error('执行消息处理器失败:', error)
      }
    })
  }
  
  // 添加状态变更处理器
  onStatusChange(handler: (status: SocketStatus) => void): void {
    this.statusChangeHandlers.push(handler)
  }
  
  // 移除状态变更处理器
  offStatusChange(handler: (status: SocketStatus) => void): void {
    const index = this.statusChangeHandlers.indexOf(handler)
    if (index !== -1) {
      this.statusChangeHandlers.splice(index, 1)
    }
  }
  
  // 设置状态并触发处理器
  private setStatus(status: SocketStatus): void {
    this.status = status
    
    this.statusChangeHandlers.forEach(handler => {
      try {
        handler(status)
      } catch (error) {
        console.error('执行状态变更处理器失败:', error)
      }
    })
  }
  
  // 获取当前状态
  getStatus(): SocketStatus {
    return this.status
  }
  
  // 关闭连接
  close(): void {
    if (!this.socket) {
      return
    }
    
    this.setStatus(SocketStatus.CLOSING)
    this.stopHeartbeat()
    this.socket.close()
  }
  
  // 清理资源
  destroy(): void {
    this.close()
    this.subscriptions.clear()
    this.messageHandlers.clear()
    this.statusChangeHandlers = []
  }
}

// 创建单例
const socketClient = new SocketClient()

// 自动连接（当用户已登录时）
const userStore = useUserStore()
if (userStore.isLogin) {
  socketClient.connect()
}

export default socketClient
