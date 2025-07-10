import { defineStore } from 'pinia'
import productsData from '@/data/products.json'
import invoiceData from '@/data/invoice01.json'

// Create default prices map from invoice data
const createDefaultPrices = () => {
  const defaultPrices = {}
  invoiceData.forEach(item => {
    if (item.productId && item.discountedPrice) {
      defaultPrices[item.productId] = item.discountedPrice
    }
  })
  return defaultPrices
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: productsData,
    searchQuery: '',
    productPrices: {}, // User-set prices
    defaultPrices: createDefaultPrices() // Invoice-based default prices
  }),
  getters: {
    filteredProducts: (state) => {
      if (!state.searchQuery) return state.products
      const query = state.searchQuery.toLowerCase()
      return state.products.filter(product => 
        product.productId.toLowerCase().includes(query) ||
        product.productName.toLowerCase().includes(query)
      )
    },
    getProductById: (state) => (id) => {
      return state.products.find(product => product.productId === id)
    },
    getProductPrice: (state) => (productId) => {
      // Return user-set price if available, otherwise default price from invoice, otherwise 0
      return state.productPrices[productId] || state.defaultPrices[productId] || 0
    },
    hasDefaultPrice: (state) => (productId) => {
      return !!state.defaultPrices[productId]
    },
    getDefaultPrice: (state) => (productId) => {
      return state.defaultPrices[productId] || 0
    }
  },
  actions: {
    setSearchQuery(query) {
      this.searchQuery = query
    },
    setProductPrice(productId, price) {
      this.productPrices[productId] = Number(price)
      this.savePricesToStorage()
    },
    savePricesToStorage() {
      localStorage.setItem('productPrices', JSON.stringify(this.productPrices))
    },
    loadPricesFromStorage() {
      try {
        const saved = localStorage.getItem('productPrices')
        if (saved) {
          this.productPrices = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Failed to load product prices from localStorage:', error)
      }
    }
  }
})