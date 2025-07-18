import { defineStore } from 'pinia'
import { useOrdersStore } from './orders'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    settings: {
      fixedCosts: 0,
      targetRevenue: 0,
      launchInvestment: 0,
      recoveryPeriod: 12,
      expectedVolume: 0,
      lastUpdated: null
    }
  }),
  
  getters: {
    // Connect to active order
    activeOrder: () => {
      const ordersStore = useOrdersStore()
      return ordersStore.activeOrder
    },
    
    // Basic order metrics
    orderTotal: (state) => {
      const ordersStore = useOrdersStore()
      if (!state.activeOrder) return 0
      return ordersStore.getOrderTotal(state.activeOrder.id)
    },
    
    orderItemCount: (state) => {
      const ordersStore = useOrdersStore()
      if (!state.activeOrder) return 0
      return ordersStore.getOrderItemCount(state.activeOrder.id)
    },
    
    // Calculate average prices per unit
    averageRetailPrice: (state) => {
      const ordersStore = useOrdersStore()
      if (!state.activeOrder || state.orderItemCount === 0) return 0
      
      let totalRetailValue = 0
      let totalUnits = 0
      
      Object.values(state.activeOrder.items).forEach(item => {
        const retailPrice = ordersStore.getItemRetailPrice(state.activeOrder.id, item)
        totalRetailValue += retailPrice * item.quantity
        totalUnits += item.quantity
      })
      
      return totalUnits > 0 ? totalRetailValue / totalUnits : 0
    },
    
    averageLandedCost: (state) => {
      const ordersStore = useOrdersStore()
      if (!state.activeOrder || state.orderItemCount === 0) return 0
      
      let totalLandedValue = 0
      let totalUnits = 0
      
      Object.values(state.activeOrder.items).forEach(item => {
        const landedCost = ordersStore.getItemLandedCost(state.activeOrder.id, item)
        totalLandedValue += landedCost * item.quantity
        totalUnits += item.quantity
      })
      
      return totalUnits > 0 ? totalLandedValue / totalUnits : 0
    },
    
    // Profit calculations
    profitPerUnit: (state) => {
      return state.averageRetailPrice - state.averageLandedCost
    },
    
    retailMarginPercent: (state) => {
      if (state.averageLandedCost === 0) return 0
      return ((state.averageRetailPrice - state.averageLandedCost) / state.averageLandedCost) * 100
    },
    
    // Launch cost calculations
    launchCostPerUnit: (state) => {
      if (state.settings.expectedVolume === 0) return 0
      return state.settings.launchInvestment / state.settings.expectedVolume
    },
    
    trueProfitPerUnit: (state) => {
      return state.profitPerUnit - state.launchCostPerUnit
    },
    
    // Break-even analysis
    breakEvenUnits: (state) => {
      if (state.profitPerUnit <= 0) return Infinity
      return Math.ceil(state.settings.fixedCosts / state.profitPerUnit)
    },
    
    // Target analysis
    targetUnits: (state) => {
      if (state.averageRetailPrice === 0) return 0
      return Math.ceil(state.settings.targetRevenue / state.averageRetailPrice)
    },
    
    // Time-based projections
    unitsPerWeek: (state) => {
      return Math.ceil(state.targetUnits / 4.33) // Average weeks per month
    },
    
    unitsPerDay: (state) => {
      return Math.ceil(state.targetUnits / 30) // Average days per month
    },
    
    // Monthly profit projection
    monthlyProfit: (state) => {
      return state.targetUnits * state.profitPerUnit - state.settings.fixedCosts
    },
    
    // Recovery timeline
    timeToBreakEven: (state) => {
      if (state.trueProfitPerUnit <= 0) return Infinity
      const unitsNeeded = state.settings.launchInvestment / state.trueProfitPerUnit
      return Math.ceil(unitsNeeded / state.targetUnits) // Months to recover
    },
    
    // ROI calculation
    roi: (state) => {
      if (state.settings.launchInvestment === 0) return 0
      const monthlyTrueProfit = state.targetUnits * state.trueProfitPerUnit
      if (monthlyTrueProfit <= 0) return -100
      return (monthlyTrueProfit / state.settings.launchInvestment) * 100 // Monthly ROI %
    },
    
    // Status indicators
    isOrderProfitable: (state) => state.profitPerUnit > 0,
    isTargetRealistic: (state) => state.unitsPerDay <= 50, // Arbitrary realistic daily sales limit
    isBreakEvenAchievable: (state) => state.breakEvenUnits < state.targetUnits,
    isLaunchRecoverable: (state) => state.timeToBreakEven <= state.settings.recoveryPeriod
  },
  
  actions: {
    updateSettings(newSettings) {
      Object.assign(this.settings, newSettings)
      this.settings.lastUpdated = new Date().toISOString()
      this.saveToStorage()
    },
    
    loadFromStorage() {
      try {
        const saved = localStorage.getItem('business_analytics')
        if (saved) {
          const data = JSON.parse(saved)
          this.settings = { ...this.settings, ...data }
        }
      } catch (error) {
        console.error('Failed to load analytics from localStorage:', error)
      }
    },
    
    saveToStorage() {
      try {
        localStorage.setItem('business_analytics', JSON.stringify(this.settings))
      } catch (error) {
        console.error('Failed to save analytics to localStorage:', error)
      }
    },
    
    resetSettings() {
      this.settings = {
        fixedCosts: 0,
        targetRevenue: 0,
        launchInvestment: 0,
        recoveryPeriod: 12,
        expectedVolume: 0,
        lastUpdated: null
      }
      this.saveToStorage()
    }
  }
})