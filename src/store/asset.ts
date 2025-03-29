import { defineStore } from 'pinia'
import { useUserStore } from './user'
import Big from 'big.js'

// 账户类型
export enum AccountType {
  SPOT = 'spot',       // 现货账户
  CONTRACT = 'contract', // 合约账户
  FINANCIAL = 'financial' // 理财账户
}

// 资产类型
export interface Asset {
  id: string
  userId: string
  coin: string
  accountType: AccountType
  available: number
  frozen: number
  total: number
  usdtValue: number
  updateTime: number
}

// 账单类型
export enum BillType {
  DEPOSIT = 'deposit',     // 充值
  WITHDRAW = 'withdraw',   // 提现
  TRANSFER = 'transfer',   // 划转
  TRADE = 'trade',         // 交易
  FEE = 'fee',             // 手续费
  INTEREST = 'interest',   // 利息
  REWARD = 'reward',       // 奖励
  OTHER = 'other'          // 其他
}

// 账单信息
export interface Bill {
  id: string
  userId: string
  coin: string
  accountType: AccountType
  type: BillType
  amount: number
  fee: number
  status: 'success' | 'pending' | 'failed'
  createTime: number
  updateTime: number
  remark: string
}

// 资产状态类型
export interface AssetState {
  assets: Asset[]
  bills: Bill[]
  selectedAccountType: AccountType
  isLoading: boolean
}

// 创建资产状态
export const useAssetStore = defineStore('asset', {
  state: (): AssetState => ({
    assets: [],
    bills: [],
    selectedAccountType: AccountType.SPOT,
    isLoading: false
  }),
  
  getters: {
    // 获取当前账户类型的资产
    currentAssets(): Asset[] {
      return this.assets.filter(asset => asset.accountType === this.selectedAccountType)
    },
    
    // 计算总资产价值（USDT）
    totalAssetValue(): number {
      return this.assets.reduce((sum, asset) => sum + asset.usdtValue, 0)
    },
    
    // 按账户类型计算资产价值
    assetValueByType(): Record<AccountType, number> {
      const result = {
        [AccountType.SPOT]: 0,
        [AccountType.CONTRACT]: 0,
        [AccountType.FINANCIAL]: 0
      }
      
      this.assets.forEach(asset => {
        result[asset.accountType] += asset.usdtValue
      })
      
      return result
    },
    
    // 获取资产分布数据（用于饼图）
    assetDistribution(): Array<{name: string, value: number}> {
      const distribution: Record<string, number> = {}
      
      this.assets.forEach(asset => {
        if (distribution[asset.coin]) {
          distribution[asset.coin] += asset.usdtValue
        } else {
          distribution[asset.coin] = asset.usdtValue
        }
      })
      
      return Object.entries(distribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    },
    
    // 获取最近30天的账单
    recentBills(): Bill[] {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      return this.bills
        .filter(bill => bill.createTime >= thirtyDaysAgo)
        .sort((a, b) => b.createTime - a.createTime)
    }
  },
  
  actions: {
    // 设置当前选择的账户类型
    setSelectedAccountType(type: AccountType) {
      this.selectedAccountType = type
    },
    
    // 获取资产列表
    async fetchAssets() {
      const userStore = useUserStore()
      
      if (!userStore.isLogin) return
      
      this.isLoading = true
      
      try {
        // 这里应该调用API获取资产列表
        // const { data } = await getAssets()
        // this.assets = data
        
        // 模拟数据
        this.assets = this.generateMockAssets()
      } catch (error) {
        console.error('获取资产列表失败', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取账单列表
    async fetchBills() {
      const userStore = useUserStore()
      
      if (!userStore.isLogin) return
      
      this.isLoading = true
      
      try {
        // 这里应该调用API获取账单列表
        // const { data } = await getBills()
        // this.bills = data
        
        // 模拟数据
        this.bills = this.generateMockBills()
      } catch (error) {
        console.error('获取账单列表失败', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // 资产划转
    async transferAsset(params: {
      fromAccount: AccountType,
      toAccount: AccountType,
      coin: string,
      amount: number
    }) {
      const { fromAccount, toAccount, coin, amount } = params
      
      // 验证参数
      if (fromAccount === toAccount) {
        throw new Error('转出账户和转入账户不能相同')
      }
      
      if (amount <= 0) {
        throw new Error('转账金额必须大于0')
      }
      
      // 验证余额
      const fromAsset = this.assets.find(
        asset => asset.accountType === fromAccount && asset.coin === coin
      )
      
      if (!fromAsset || fromAsset.available < amount) {
        throw new Error('可用余额不足')
      }
      
      this.isLoading = true
      
      try {
        // 这里应该调用API进行资产划转
        // const { data } = await transferAsset(params)
        
        // 模拟划转
        const userStore = useUserStore()
        const transferTime = Date.now()
        
        // 创建划转账单
        const newBill: Bill = {
          id: `bill_${transferTime}`,
          userId: userStore.userId || '',
          coin,
          accountType: fromAccount,
          type: BillType.TRANSFER,
          amount: -amount,
          fee: 0,
          status: 'success',
          createTime: transferTime,
          updateTime: transferTime,
          remark: `划转至${toAccount}账户`
        }
        
        this.bills.unshift(newBill)
        
        // 创建接收账单
        const receiveBill: Bill = {
          id: `bill_${transferTime + 1}`,
          userId: userStore.userId || '',
          coin,
          accountType: toAccount,
          type: BillType.TRANSFER,
          amount: amount,
          fee: 0,
          status: 'success',
          createTime: transferTime,
          updateTime: transferTime,
          remark: `从${fromAccount}账户划转`
        }
        
        this.bills.unshift(receiveBill)
        
        // 更新资产
        this.updateAssetAfterTransfer(fromAccount, toAccount, coin, amount)
        
        return { fromBill: newBill, toBill: receiveBill }
      } catch (error) {
        console.error('资产划转失败', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新资产（划转后）
    updateAssetAfterTransfer(fromAccount: AccountType, toAccount: AccountType, coin: string, amount: number) {
      // 更新转出账户资产
      const fromAssetIndex = this.assets.findIndex(
        asset => asset.accountType === fromAccount && asset.coin === coin
      )
      
      if (fromAssetIndex > -1) {
        const fromAsset = this.assets[fromAssetIndex]
        this.assets[fromAssetIndex] = {
          ...fromAsset,
          available: new Big(fromAsset.available).minus(amount).toNumber(),
          total: new Big(fromAsset.total).minus(amount).toNumber(),
          updateTime: Date.now()
        }
      }
      
      // 更新转入账户资产
      const toAssetIndex = this.assets.findIndex(
        asset => asset.accountType === toAccount && asset.coin === coin
      )
      
      if (toAssetIndex > -1) {
        // 已有该币种资产
        const toAsset = this.assets[toAssetIndex]
        this.assets[toAssetIndex] = {
          ...toAsset,
          available: new Big(toAsset.available).plus(amount).toNumber(),
          total: new Big(toAsset.total).plus(amount).toNumber(),
          updateTime: Date.now()
        }
      } else {
        // 没有该币种资产，创建新资产
        const fromAsset = this.assets.find(
          asset => asset.accountType === fromAccount && asset.coin === coin
        )
        
        if (fromAsset) {
          const usdtValue = new Big(amount)
            .div(fromAsset.total)
            .mul(fromAsset.usdtValue)
            .toNumber()
          
          this.assets.push({
            id: `asset_${Date.now()}`,
            userId: fromAsset.userId,
            coin,
            accountType: toAccount,
            available: amount,
            frozen: 0,
            total: amount,
            usdtValue,
            updateTime: Date.now()
          })
        }
      }
    },
    
    // 生成模拟资产数据
    generateMockAssets(): Asset[] {
      const userStore = useUserStore()
      const coins = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL']
      const assets: Asset[] = []
      
      // 为每种账户类型生成资产
      Object.values(AccountType).forEach(accountType => {
        coins.forEach(coin => {
          // 随机决定是否有该币种
          if (Math.random() > 0.3) {
            const total = coin === 'BTC' ? Math.random() * 2 : 
                          coin === 'ETH' ? Math.random() * 20 : 
                          coin === 'USDT' ? Math.random() * 10000 : 
                          Math.random() * 100
            
            const frozen = Math.random() > 0.7 ? total * Math.random() * 0.3 : 0
            const available = total - frozen
            
            const price = coin === 'BTC' ? 35000 + Math.random() * 2000 : 
                          coin === 'ETH' ? 2000 + Math.random() * 200 : 
                          coin === 'USDT' ? 1 : 
                          coin === 'BNB' ? 300 + Math.random() * 50 : 
                          20 + Math.random() * 10
            
            const usdtValue = total * price
            
            assets.push({
              id: `asset_${accountType}_${coin}`,
              userId: userStore.userId || '',
              coin,
              accountType,
              available,
              frozen,
              total,
              usdtValue,
              updateTime: Date.now()
            })
          }
        })
      })
      
      return assets
    },
    
    // 生成模拟账单数据
    generateMockBills(): Bill[] {
      const userStore = useUserStore()
      const coins = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL']
      const bills: Bill[] = []
      
      // 生成30条随机账单
      for (let i = 0; i < 30; i++) {
        const coin = coins[Math.floor(Math.random() * coins.length)]
        const accountType = Object.values(AccountType)[Math.floor(Math.random() * 3)]
        const billType = Object.values(BillType)[Math.floor(Math.random() * Object.values(BillType).length)]
        
        const amount = coin === 'BTC' ? Math.random() * 0.5 : 
                      coin === 'ETH' ? Math.random() * 5 : 
                      coin === 'USDT' ? Math.random() * 1000 : 
                      Math.random() * 20
        
        // 对于交易类型，有50%概率是负数（卖出）
        const finalAmount = billType === BillType.TRADE && Math.random() > 0.5 ? -amount : amount
        
        const fee = Math.abs(finalAmount) * 0.001
        const createTime = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
        
        let remark = ''
        switch (billType) {
          case BillType.DEPOSIT:
            remark = '充值'
            break
          case BillType.WITHDRAW:
            remark = '提现'
            break
          case BillType.TRANSFER:
            const otherAccount = Object.values(AccountType).find(type => type !== accountType)
            remark = finalAmount > 0 ? `从${otherAccount}账户划转` : `划转至${otherAccount}账户`
            break
          case BillType.TRADE:
            remark = finalAmount > 0 ? '买入' : '卖出'
            break
          case BillType.FEE:
            remark = '交易手续费'
            break
          case BillType.INTEREST:
            remark = '利息收入'
            break
          case BillType.REWARD:
            remark = '活动奖励'
            break
          default:
            remark = '其他'
        }
        
        bills.push({
          id: `bill_${i + 1}`,
          userId: userStore.userId || '',
          coin,
          accountType,
          type: billType,
          amount: finalAmount,
          fee,
          status: Math.random() > 0.9 ? 'pending' : 'success',
          createTime,
          updateTime: createTime + Math.floor(Math.random() * 60 * 60 * 1000),
          remark
        })
      }
      
      return bills.sort((a, b) => b.createTime - a.createTime)
    }
  }
})
