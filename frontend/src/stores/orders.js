import { defineStore } from 'pinia'
import { useProductsStore } from './products'

// Container limits
const CONTAINER_20FT_VOLUME = 33.2 // cubic meters
const CONTAINER_20FT_WEIGHT = 24000 // kg (24 tons max payload)
const CONTAINER_40FT_VOLUME = 67.5 // cubic meters
const CONTAINER_40FT_WEIGHT = 28000 // kg (28 tons max payload)

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: {},
    activeOrderId: null,
    containerType: '40ft', // '20ft' or '40ft'
    CONTAINER_20FT_VOLUME,
    CONTAINER_20FT_WEIGHT,
    CONTAINER_40FT_VOLUME,
    CONTAINER_40FT_WEIGHT
  }),
  getters: {
    orderList: (state) => Object.values(state.orders),
    activeOrder: (state) => state.orders[state.activeOrderId],
    getOrderItemsWithId: (state) => (orderId) => {
      const order = state.orders[orderId]
      if (!order) return []
      return Object.entries(order.items)
        .map(([itemId, item]) => ({
          ...item,
          itemId
        }))
        .sort((a, b) => a.productId.localeCompare(b.productId))
    },
    getOrderTotal: (state) => (orderId) => {
      const order = state.orders[orderId]
      if (!order) return 0
      return Object.values(order.items).reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
    getOrderItemCount: (state) => (orderId) => {
      const order = state.orders[orderId]
      if (!order) return 0
      return Object.values(order.items).reduce((sum, item) => sum + item.quantity, 0)
    },
    getOrderVolume: (state) => (orderId) => {
      const order = state.orders[orderId]
      if (!order) return 0
      
      // We need access to products store for dimensions
      const productsStore = useProductsStore()
      
      let totalVolume = 0
      Object.values(order.items).forEach(item => {
        const product = productsStore.getProductById(item.productId)
        if (product && product.dimensions) {
          const boxVolume = (product.dimensions.boxWidth || 0) * 
                           (product.dimensions.boxHeight || 0) * 
                           (product.dimensions.boxDepth || 0) / 1000000 // Convert cm³ to m³
          const qtyPerBox = product.dimensions.qtyPerBox || 1
          const boxes = Math.ceil((parseInt(item.quantity) || 0) / qtyPerBox)
          totalVolume += boxVolume * boxes
        }
      })
      return totalVolume
    },
    getOrderWeight: (state) => (orderId) => {
      const order = state.orders[orderId]
      if (!order) return 0
      
      const productsStore = useProductsStore()
      
      let totalWeight = 0
      Object.values(order.items).forEach(item => {
        const product = productsStore.getProductById(item.productId)
        if (product && product.dimensions && product.dimensions.weight) {
          totalWeight += (product.dimensions.weight * (parseInt(item.quantity) || 0))
        }
      })
      return totalWeight
    },
    currentContainerVolume: (state) => {
      return state.containerType === '20ft' ? state.CONTAINER_20FT_VOLUME : state.CONTAINER_40FT_VOLUME
    },
    currentContainerWeight: (state) => {
      return state.containerType === '20ft' ? state.CONTAINER_20FT_WEIGHT : state.CONTAINER_40FT_WEIGHT
    },
    getOrderContainerPercent: (state) => (orderId) => {
      const volume = state.getOrderVolume(orderId)
      const containerVolume = state.containerType === '20ft' ? state.CONTAINER_20FT_VOLUME : state.CONTAINER_40FT_VOLUME
      return (volume / containerVolume) * 100
    },
    getOrderWeightPercent: (state) => (orderId) => {
      const weight = state.getOrderWeight(orderId)
      const containerWeight = state.containerType === '20ft' ? state.CONTAINER_20FT_WEIGHT : state.CONTAINER_40FT_WEIGHT
      return (weight / containerWeight) * 100
    },
    getItemVolume: (state) => (item) => {
      const productsStore = useProductsStore()
      const product = productsStore.getProductById(item.productId)
      
      if (product && product.dimensions && product.dimensions.boxWidth && product.dimensions.boxHeight && product.dimensions.boxDepth) {
        const boxVolume = (product.dimensions.boxWidth * product.dimensions.boxHeight * product.dimensions.boxDepth) / 1000000
        const qtyPerBox = product.dimensions.qtyPerBox || 1
        const boxes = Math.ceil((parseInt(item.quantity) || 0) / qtyPerBox)
        return boxVolume * boxes
      }
      return 0
    },
    getItemWeight: (state) => (item) => {
      const productsStore = useProductsStore()
      const product = productsStore.getProductById(item.productId)
      
      if (product && product.dimensions && product.dimensions.weight) {
        return product.dimensions.weight * (parseInt(item.quantity) || 0)
      }
      return 0
    }
  },
  actions: {
    createOrder(name) {
      const id = 'order_' + Date.now()
      this.orders[id] = { 
        id, 
        name, 
        items: {}, 
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      this.saveToStorage()
      return id
    },
    setActiveOrder(orderId) {
      this.activeOrderId = orderId
      this.saveToStorage()
    },
    setContainerType(type) {
      this.containerType = type
      this.saveToStorage()
    },
    addToOrder(orderId, productId, { fabric, price, quantity, notes = '' }) {
      if (!this.orders[orderId]) return
      
      // Ensure fabric is always an array
      const fabricArray = Array.isArray(fabric) ? fabric : [fabric]
      
      // Generate unique item ID based on product + fabrics + timestamp
      const fabricKey = fabricArray.join('_')
      const itemId = `${productId}_${fabricKey}_${Date.now()}`
      
      this.orders[orderId].items[itemId] = { 
        productId, 
        fabric: fabricArray, 
        price: Number(price), 
        quantity: Number(quantity),
        notes: notes || ''
      }
      this.orders[orderId].updatedAt = Date.now()
      this.saveToStorage()
    },
    updateOrderItem(orderId, itemId, updates) {
      if (this.orders[orderId]?.items[itemId]) {
        Object.assign(this.orders[orderId].items[itemId], updates)
        this.orders[orderId].updatedAt = Date.now()
        this.saveToStorage()
      }
    },
    removeFromOrder(orderId, itemId) {
      if (this.orders[orderId]?.items[itemId]) {
        delete this.orders[orderId].items[itemId]
        this.orders[orderId].updatedAt = Date.now()
        this.saveToStorage()
      }
    },
    deleteOrder(orderId) {
      if (this.orders[orderId]) {
        delete this.orders[orderId]
        if (this.activeOrderId === orderId) {
          this.activeOrderId = null
        }
        this.saveToStorage()
      }
    },
    saveToStorage() {
      localStorage.setItem('orders', JSON.stringify({
        orders: this.orders,
        activeOrderId: this.activeOrderId
      }))
    },
    loadFromStorage() {
      try {
        const saved = localStorage.getItem('orders')
        if (saved) {
          const data = JSON.parse(saved)
          this.orders = data.orders || {}
          this.activeOrderId = data.activeOrderId || null
          
          // Migration: Convert old format to new format
          this.migrateOrdersFormat()
        }
      } catch (error) {
        console.error('Failed to load orders from localStorage:', error)
      }
    },
    
    migrateOrdersFormat() {
      let needsMigration = false
      
      // Check if any orders need migration
      for (const [orderId, order] of Object.entries(this.orders)) {
        if (order.items) {
          for (const [itemKey, item] of Object.entries(order.items)) {
            // Check for old format: itemKey equals productId
            // OR fabric is not an array (new requirement)
            if ((itemKey === item.productId && !itemKey.includes('_')) || 
                (item.fabric && !Array.isArray(item.fabric))) {
              needsMigration = true
              break
            }
          }
        }
        if (needsMigration) break
      }
      
      if (needsMigration) {
        console.log('Migrating orders to new format...')
        
        // Create backup of existing data before migration
        const backupKey = `orders_backup_${Date.now()}`
        const currentData = localStorage.getItem('orders')
        if (currentData) {
          localStorage.setItem(backupKey, currentData)
          console.log(`Backup created at key: ${backupKey}`)
        }
        
        try {
          for (const [orderId, order] of Object.entries(this.orders)) {
            if (order.items) {
              const newItems = {}
              
              for (const [itemKey, item] of Object.entries(order.items)) {
                // Check if this is old format (itemKey equals productId)
                if (itemKey === item.productId && !itemKey.includes('_')) {
                  // Generate new itemId for migrated data
                  const fabricArray = Array.isArray(item.fabric) ? item.fabric : [item.fabric]
                  const fabricKey = fabricArray.join('_')
                  const newItemId = `${item.productId}_${fabricKey}_migrated_${Date.now()}`
                  newItems[newItemId] = {
                    ...item,
                    fabric: fabricArray,
                    notes: item.notes || '' // Ensure notes field exists
                  }
                } else if (item.fabric && !Array.isArray(item.fabric)) {
                  // New format itemKey but fabric is still string - convert to array
                  const fabricArray = [item.fabric]
                  newItems[itemKey] = {
                    ...item,
                    fabric: fabricArray,
                    notes: item.notes || ''
                  }
                } else {
                  // Already fully migrated format, ensure notes field exists
                  newItems[itemKey] = {
                    ...item,
                    fabric: item.fabric || [],
                    notes: item.notes || ''
                  }
                }
              }
              
              this.orders[orderId].items = newItems
              this.orders[orderId].updatedAt = Date.now()
            }
          }
          
          // Save migrated data
          this.saveToStorage()
          console.log('Orders migration completed')
        } catch (error) {
          console.error('Migration failed, attempting to restore from backup:', error)
          // Restore from backup if migration fails
          if (currentData) {
            localStorage.setItem('orders', currentData)
            console.log('Restored from backup due to migration failure')
          }
          throw error
        }
      }
    }
  }
})