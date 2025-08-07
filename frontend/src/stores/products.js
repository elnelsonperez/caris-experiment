import { defineStore } from 'pinia'
import productsData from '@/data/products.json'
import invoiceData from '@/data/invoice01.json'

// Helper function to load settings
const loadSettings = async () => {
  try {
    const response = await fetch('/api/settings')
    if (response.ok) {
      const settings = await response.json()
      return settings.blacklistedImages || []
    }
  } catch (error) {
    console.warn('Failed to load blacklist settings, proceeding without filtering:', error)
  }
  return []
}

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
    filteredProducts: [], // Products with blacklisted images removed
    searchQuery: '',
    productPrices: {}, // User-set prices
    defaultPrices: createDefaultPrices(), // Invoice-based default prices
    blacklistedImages: [], // Cached blacklist
    blacklistLoaded: false
  }),
  getters: {
    // Get products with blacklisted images filtered out
    productsWithoutBlacklisted: (state) => {
      if (!state.blacklistLoaded || state.blacklistedImages.length === 0) {
        return state.products
      }
      
      return state.products.map(product => {
        // Filter out blacklisted images from the images array
        const filteredImages = product.images ? 
          product.images.filter(imageUrl => !state.blacklistedImages.includes(imageUrl)) :
          []
        
        return {
          ...product,
          images: filteredImages
        }
      })
    },
    
    filteredProducts() {
      const productsToUse = this.productsWithoutBlacklisted
      if (!this.searchQuery) return productsToUse
      const query = this.searchQuery.toLowerCase()
      return productsToUse.filter(product => 
        product.productId.toLowerCase().includes(query) ||
        product.productName.toLowerCase().includes(query)
      )
    },
    getProductById() {
      return (id) => {
        return this.productsWithoutBlacklisted.find(product => product.productId === id)
      }
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
    },
    
    async loadBlacklist() {
      try {
        this.blacklistedImages = await loadSettings()
        this.blacklistLoaded = true
        console.log(`Loaded ${this.blacklistedImages.length} blacklisted images`)
      } catch (error) {
        console.error('Failed to load blacklist:', error)
        this.blacklistedImages = []
        this.blacklistLoaded = true
      }
    },
    
    refreshBlacklist() {
      // Force reload of blacklist
      this.blacklistLoaded = false
      return this.loadBlacklist()
    }
  }
})