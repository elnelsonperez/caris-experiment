import { defineStore } from 'pinia'
import { useOrdersStore } from './orders'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    settings: {
      fixedCosts: 0,
      launchInvestment: 0,
      recoveryPeriod: 12,
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
    
    // Break-even analysis
    breakEvenUnits: (state) => {
      if (state.profitPerUnit <= 0) return Infinity
      return Math.ceil(state.settings.fixedCosts / state.profitPerUnit)
    },
    
    // Scenario projections
    scenario1x: (state) => {
      const units = state.breakEvenUnits
      return {
        units,
        revenue: units * state.averageRetailPrice,
        totalProfit: units * state.profitPerUnit - state.settings.fixedCosts,
        unitsPerWeek: Math.ceil(units / 4.33),
        unitsPerDay: Math.ceil(units / 30),
        description: "Break-even (covers fixed costs only)"
      }
    },
    
    scenario2x: (state) => {
      const units = state.breakEvenUnits * 2
      return {
        units,
        revenue: units * state.averageRetailPrice,
        totalProfit: units * state.profitPerUnit - state.settings.fixedCosts,
        unitsPerWeek: Math.ceil(units / 4.33),
        unitsPerDay: Math.ceil(units / 30),
        description: "2x break-even (comfortable profit margin)"
      }
    },
    
    scenario3x: (state) => {
      const units = state.breakEvenUnits * 3
      return {
        units,
        revenue: units * state.averageRetailPrice,
        totalProfit: units * state.profitPerUnit - state.settings.fixedCosts,
        unitsPerWeek: Math.ceil(units / 4.33),
        unitsPerDay: Math.ceil(units / 30),
        description: "3x break-even (strong growth scenario)"
      }
    },
    
    // Launch cost recovery scenarios
    launchRecoveryAt1x: (state) => {
      if (state.settings.launchInvestment === 0) return 0
      const monthlyProfit = state.scenario1x.totalProfit
      if (monthlyProfit <= 0) return Infinity
      return Math.ceil(state.settings.launchInvestment / monthlyProfit)
    },
    
    launchRecoveryAt2x: (state) => {
      if (state.settings.launchInvestment === 0) return 0
      const monthlyProfit = state.scenario2x.totalProfit
      if (monthlyProfit <= 0) return Infinity
      return Math.ceil(state.settings.launchInvestment / monthlyProfit)
    },
    
    launchRecoveryAt3x: (state) => {
      if (state.settings.launchInvestment === 0) return 0
      const monthlyProfit = state.scenario3x.totalProfit
      if (monthlyProfit <= 0) return Infinity
      return Math.ceil(state.settings.launchInvestment / monthlyProfit)
    },
    
    // Margin analysis
    marginAnalysis: (state) => {
      const margin = state.retailMarginPercent
      let category = 'poor'
      let recommendation = 'Consider increasing prices or reducing costs'
      
      if (margin >= 50) {
        category = 'excellent'
        recommendation = 'Strong margin - good pricing power'
      } else if (margin >= 30) {
        category = 'good'
        recommendation = 'Healthy margin for furniture business'
      } else if (margin >= 15) {
        category = 'fair'
        recommendation = 'Acceptable but could be improved'
      }
      
      return { category, recommendation, margin }
    },
    
    // Status indicators
    isOrderProfitable: (state) => state.profitPerUnit > 0,
    hasReasonableMargin: (state) => state.retailMarginPercent >= 15
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
        launchInvestment: 0,
        recoveryPeriod: 12,
        lastUpdated: null
      }
      this.saveToStorage()
    }
  }
})