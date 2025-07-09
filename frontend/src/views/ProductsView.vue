<template>
  <div class="products-view">
    <div class="container">
      <!-- Header Section: Search + Quick Add -->
      <div class="header-section mb-4">
        <div class="header-container">
          <!-- Search Section -->
          <div class="search-container">
            <input 
              v-model="searchQuery"
              type="text" 
              class="search-input"
              placeholder="Search products by name or ID..."
            >
            <span class="search-stats">{{ filteredProducts.length }} products</span>
          </div>
          
          <!-- Active Order Quick Add Panel -->
          <div v-if="activeOrder" class="quick-add-container">
            <div class="quick-add-info">
              <div class="order-name">{{ activeOrder.name }}</div>
              <div class="order-stats">{{ activeOrderItemCount }} items • {{ formatPrice(activeOrderTotal) }}</div>
            </div>
            <button @click="clearActiveOrder" class="btn-clear-order">
              Clear Active
            </button>
          </div>
        </div>
      </div>
      
      <!-- Products Grid -->
      <div class="products-grid">
        <ProductCard 
          v-for="product in filteredProducts" 
          :key="product.productId"
          :product="product"
          @product-click="openProductModal"
        />
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" class="empty-state text-center p-4">
        <p class="text-muted">No products found matching your search.</p>
      </div>
      
      <!-- Product Modal -->
      <ProductModal 
        v-if="selectedProduct"
        :product="selectedProduct"
        @close="closeProductModal"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useOrdersStore } from '@/stores/orders'
import ProductCard from '@/components/ProductCard.vue'
import ProductModal from '@/components/ProductModal.vue'

export default {
  name: 'ProductsView',
  components: {
    ProductCard,
    ProductModal
  },
  props: {
    productId: String
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const productsStore = useProductsStore()
    const ordersStore = useOrdersStore()
    
    const selectedProduct = ref(null)
    
    const searchQuery = computed({
      get: () => productsStore.searchQuery,
      set: (value) => productsStore.setSearchQuery(value)
    })
    
    const filteredProducts = computed(() => productsStore.filteredProducts)
    const activeOrder = computed(() => ordersStore.activeOrder)
    const activeOrderItemCount = computed(() => 
      activeOrder.value ? ordersStore.getOrderItemCount(activeOrder.value.id) : 0
    )
    const activeOrderTotal = computed(() => 
      activeOrder.value ? ordersStore.getOrderTotal(activeOrder.value.id) : 0
    )
    
    const formatPrice = (price) => {
      return `€${price.toFixed(2)}`
    }
    
    const openProductModal = (product) => {
      selectedProduct.value = product
      router.push(`/products/${product.productId}`)
    }
    
    const closeProductModal = () => {
      selectedProduct.value = null
      router.push('/products')
    }
    
    const clearActiveOrder = () => {
      ordersStore.setActiveOrder(null)
    }
    
    // Handle deep linking
    watch(() => route.params.productId, (productId) => {
      if (productId) {
        const product = productsStore.getProductById(productId)
        if (product) {
          selectedProduct.value = product
        } else {
          router.push('/products')
        }
      } else {
        selectedProduct.value = null
      }
    }, { immediate: true })
    
    return {
      searchQuery,
      filteredProducts,
      selectedProduct,
      activeOrder,
      activeOrderItemCount,
      activeOrderTotal,
      formatPrice,
      openProductModal,
      closeProductModal,
      clearActiveOrder
    }
  }
}
</script>

<style scoped>
.products-view {
  min-height: calc(100vh - 200px);
}

.header-section {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.search-input {
  width: 300px;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.search-stats {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.quick-add-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  color: white;
  min-width: 300px;
}

.quick-add-info {
  flex: 1;
}

.order-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.order-stats {
  font-size: 0.8rem;
  opacity: 0.9;
}

.btn-clear-order {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.btn-clear-order:hover {
  background: rgba(255, 255, 255, 0.3);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.empty-state {
  background: white;
  border-radius: 0.5rem;
  margin-top: 2rem;
}
</style>