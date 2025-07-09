import { defineStore } from 'pinia'
import productsData from '@/data/products.json'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: productsData,
    searchQuery: '',
    productPrices: {} // { productId: defaultPrice }
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
      return state.productPrices[productId] || 0
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