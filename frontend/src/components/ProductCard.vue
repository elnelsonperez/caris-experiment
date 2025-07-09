<template>
  <div class="product-card card cursor-pointer" @click="openProduct">
    <div class="product-image-container">
      <img 
        :src="product.images[0]" 
        :alt="product.productName"
        @error="handleImageError"
        loading="lazy"
        class="product-image"
      >
    </div>
    <div class="card-body">
      <h3 class="product-name">{{ product.productName }}</h3>
      <p class="product-id text-muted">ID: {{ product.productId }}</p>
      
      <!-- Dimensions -->
      <div v-if="product.dimensions" class="dimensions mb-2">
        <small class="text-muted">
          {{ product.dimensions.width }}×{{ product.dimensions.height }}×{{ product.dimensions.depth }}cm
        </small>
      </div>
      
      <!-- Price Display -->
      <div class="price-section">
        <div class="price-display">
          <div class="price-row">
            <span class="price-label">Price:</span>
            <span class="price-value">{{ formatPrice(currentPrice) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useProductsStore } from '@/stores/products'

export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  emits: ['product-click'],
  setup(props, { emit }) {
    const productsStore = useProductsStore()
    
    const currentPrice = computed(() => 
      productsStore.getProductPrice(props.product.productId)
    )
    
    const formatPrice = (price) => {
      return price > 0 ? `€${price.toFixed(2)}` : 'No price set'
    }
    
    const openProduct = (event) => {
      // Check if Ctrl/Cmd key is pressed for new tab
      if (event.ctrlKey || event.metaKey) {
        window.open(`/products/${props.product.productId}`, '_blank')
      } else {
        emit('product-click', props.product)
      }
    }
    
    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
    }
    
    return {
      currentPrice,
      formatPrice,
      openProduct,
      handleImageError
    }
  }
}
</script>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.product-image-container {
  width: 100%;
  height: 240px;
  overflow: hidden;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-body {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-id {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  color: #7f8c8d;
  font-weight: 500;
}

.dimensions {
  font-size: 0.75rem;
  color: #95a5a6;
  margin-bottom: 0.75rem;
}

.price-section {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #ecf0f1;
}

.price-display {
  text-align: center;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.price-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 500;
}

.price-value {
  font-weight: 700;
  color: #27ae60;
  font-size: 1rem;
}

</style>