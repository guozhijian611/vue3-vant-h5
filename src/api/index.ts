import http from './http'

// 用户相关接口
export const userApi = {
  // 登录
  login: (data: { username: string; password: string; captchaId: string; captchaCode: string }) => {
    return http.post('/login/index', data)
  },
  
  // 获取验证码
  getCaptcha: () => {
    return http.get('/login/captcha')
  },
  
  // 注册
  register: (data: { username: string; password: string; confirmPassword: string; captchaId: string; captchaCode: string }) => {
    return http.post('/user/register', data)
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return http.get('/user/info')
  },
  
  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    return http.post('/user/change-password', data)
  },
  
  // 退出登录
  logout: () => {
    return http.post('/user/logout')
  }
}

// 行情相关接口
export const marketApi = {
  // 获取所有币种
  getAllCoins: () => {
    return http.get('/market/coins')
  },
  
  // 获取K线数据
  getKlineData: (symbol: string, period: string) => {
    return http.get(`/market/kline?symbol=${symbol}&period=${period}`)
  },
  
  // 获取深度数据
  getDepthData: (symbol: string) => {
    return http.get(`/market/depth?symbol=${symbol}`)
  },
  
  // 获取最新成交
  getRecentTrades: (symbol: string) => {
    return http.get(`/market/trades?symbol=${symbol}`)
  }
}

// 交易相关接口
export const tradeApi = {
  // 创建订单
  createOrder: (data: {
    symbol: string;
    type: string;
    direction: string;
    price?: number;
    amount: number;
    leverage: number;
    leverageMode: string;
  }) => {
    return http.post('/trade/create-order', data)
  },
  
  // 取消订单
  cancelOrder: (orderId: string) => {
    return http.post('/trade/cancel-order', { orderId })
  },
  
  // 获取订单列表
  getOrders: (params?: { symbol?: string; status?: string; page?: number; size?: number }) => {
    return http.get('/trade/orders', { params })
  },
  
  // 获取订单详情
  getOrderDetail: (orderId: string) => {
    return http.get(`/trade/order/${orderId}`)
  },
  
  // 获取持仓列表
  getPositions: (params?: { symbol?: string }) => {
    return http.get('/trade/positions', { params })
  },
  
  // 平仓
  closePosition: (positionId: string, amount?: number) => {
    return http.post('/trade/close-position', { positionId, amount })
  }
}

// 资产相关接口
export const assetApi = {
  // 获取资产列表
  getAssets: () => {
    return http.get('/asset/list')
  },
  
  // 获取账单列表
  getBills: (params?: { 
    coin?: string; 
    type?: string; 
    startTime?: number; 
    endTime?: number; 
    page?: number; 
    size?: number 
  }) => {
    return http.get('/asset/bills', { params })
  },
  
  // 资产划转
  transferAsset: (data: {
    fromAccount: string;
    toAccount: string;
    coin: string;
    amount: number;
  }) => {
    return http.post('/asset/transfer', data)
  },
  
  // 导出账单
  exportBills: (params?: { 
    coin?: string; 
    type?: string; 
    startTime?: number; 
    endTime?: number; 
  }) => {
    return http.get('/asset/export-bills', { 
      params,
      responseType: 'blob'
    })
  }
}
