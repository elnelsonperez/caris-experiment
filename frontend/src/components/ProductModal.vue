<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ product.productName }}</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="product-layout">
          <!-- Left Column: Image Gallery -->
          <div class="image-section">
            <div class="main-image mb-3" ref="imageContainer">
              <div 
                class="image-zoom-container"
                @mousemove="handleMouseMove"
                @mouseenter="showZoom = true"
                @mouseleave="showZoom = false"
              >
                <img 
                  :src="currentImage" 
                  :alt="product.productName"
                  class="main-product-image"
                  @error="handleImageError"
                  ref="mainImage"
                >
                <div 
                  v-show="showZoom"
                  class="zoom-lens"
                  :style="lensStyle"
                ></div>
              </div>
              
              <!-- Zoom Result -->
              <div 
                v-show="showZoom"
                class="zoom-result"
                :style="zoomStyle"
              >
                <img 
                  :src="currentImage"
                  :alt="product.productName"
                  class="zoom-image"
                  @error="handleImageError"
                >
              </div>
            </div>
            <div v-if="product.images.length > 1" class="image-thumbnails">
              <img 
                v-for="(image, index) in product.images" 
                :key="index"
                :src="image"
                :alt="`${product.productName} ${index + 1}`"
                class="thumbnail cursor-pointer"
                :class="{ active: currentImageIndex === index }"
                @click="currentImageIndex = index"
                @error="handleImageError"
              >
            </div>
          </div>
          
          <!-- Middle Column: Product Info -->
          <div class="info-section">
            <div class="product-info mb-4">
              <p><strong>Product ID:</strong> {{ product.productId }}</p>
              <p v-if="product.url"><strong>Source:</strong> <a :href="product.url" target="_blank" class="source-link">View in Caris</a></p>
              
              <!-- Price Setting -->
              <div class="price-setting mt-3">
                <div v-if="!editingPrice" class="price-display-modal">
                  <p><strong>Default Price:</strong> {{ formatPrice(currentPrice) }}</p>
                  <button @click="startEditingPrice" class="btn btn-sm">
                    {{ currentPrice > 0 ? 'Edit Price' : 'Set Price' }}
                  </button>
                </div>
                <div v-else class="price-edit-modal">
                  <p><strong>Set Default Price:</strong></p>
                  <div class="price-input-group">
                    <input 
                      v-model="editPrice" 
                      type="number" 
                      step="0.01" 
                      min="0"
                      class="form-control"
                      placeholder="0.00"
                      @keyup.enter="savePrice"
                      @keyup.escape="cancelEditPrice"
                      ref="priceInput"
                    >
                    <button @click="savePrice" class="btn btn-sm">Save</button>
                    <button @click="cancelEditPrice" class="btn btn-sm btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Dimensions -->
            <div v-if="product.dimensions" class="dimensions-section mb-4">
              <h4 class="dimensions-title">Dimensions</h4>
              <div class="dimensions-table">
                <div class="dimension-row" v-if="product.dimensions.width">
                  <span>Width:</span> <span>{{ product.dimensions.width }} cm</span>
                </div>
                <div class="dimension-row" v-if="product.dimensions.height">
                  <span>Height:</span> <span>{{ product.dimensions.height }} cm</span>
                </div>
                <div class="dimension-row" v-if="product.dimensions.depth">
                  <span>Depth:</span> <span>{{ product.dimensions.depth }} cm</span>
                </div>
                <div class="dimension-row" v-if="product.dimensions.weight">
                  <span>Weight:</span> <span>{{ product.dimensions.weight }} kg</span>
                </div>
                <div class="dimension-row" v-if="product.dimensions.floor_to_chair_height_cm">
                  <span>Seat Height:</span> <span>{{ product.dimensions.floor_to_chair_height_cm }} cm</span>
                </div>
              </div>
              
              <!-- Dimensions Image -->
              <div v-if="product.dimensionsImage" class="dimensions-image mt-3">
                <img 
                  :src="product.dimensionsImage" 
                  :alt="`${product.productName} dimensions`"
                  class="w-full h-auto"
                  @error="handleImageError"
                >
              </div>
            </div>
          </div>
          
          <!-- Right Column: Quick Add Form (if active order exists) -->
          <div v-if="activeOrder" class="quick-add-section">
            <div class="quick-add-header">
              <h4>Add to Order</h4>
              <div class="active-order-info">{{ activeOrder.name }}</div>
            </div>
            <QuickAddForm 
              :product="product"
              class="condensed-form"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import QuickAddForm from '@/components/QuickAddForm.vue'

export default {
  name: 'ProductModal',
  components: {
    QuickAddForm
  },
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props) {
    const ordersStore = useOrdersStore()
    const productsStore = useProductsStore()
    const currentImageIndex = ref(0)
    const editingPrice = ref(false)
    const editPrice = ref('')
    const priceInput = ref(null)
    const imageContainer = ref(null)
    const mainImage = ref(null)
    const showZoom = ref(false)
    const lensPosition = ref({ x: 0, y: 0 })
    const zoomFactor = 2.5
    
    const activeOrder = computed(() => ordersStore.activeOrder)
    const currentImage = computed(() => 
      props.product.images[currentImageIndex.value] || props.product.images[0]
    )
    const currentPrice = computed(() => 
      productsStore.getProductPrice(props.product.productId)
    )
    
    const formatPrice = (price) => {
      return price > 0 ? `€${price.toFixed(2)}` : 'No price set'
    }
    
    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
    }
    
    const startEditingPrice = async () => {
      editingPrice.value = true
      editPrice.value = currentPrice.value > 0 ? currentPrice.value.toString() : ''
      await nextTick()
      priceInput.value?.focus()
    }
    
    const savePrice = () => {
      const price = parseFloat(editPrice.value)
      if (!isNaN(price) && price >= 0) {
        productsStore.setProductPrice(props.product.productId, price)
      }
      editingPrice.value = false
    }
    
    const cancelEditPrice = () => {
      editingPrice.value = false
      editPrice.value = ''
    }
    
    const handleMouseMove = (event) => {
      if (!mainImage.value || !imageContainer.value) return
      
      const rect = mainImage.value.getBoundingClientRect()
      const containerRect = imageContainer.value.getBoundingClientRect()
      
      // Calculate mouse position relative to the image
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Update lens position (150px lens = 75px radius)
      lensPosition.value = {
        x: Math.max(0, Math.min(x - 75, rect.width - 150)), // 75 is half lens size
        y: Math.max(0, Math.min(y - 75, rect.height - 150))
      }
    }
    
    const lensStyle = computed(() => ({
      left: `${lensPosition.value.x}px`,
      top: `${lensPosition.value.y}px`
    }))
    
    const zoomStyle = computed(() => {
      if (!mainImage.value) return {}
      
      const backgroundX = -(lensPosition.value.x * zoomFactor)
      const backgroundY = -(lensPosition.value.y * zoomFactor)
      
      return {
        backgroundImage: `url(${currentImage.value})`,
        backgroundPosition: `${backgroundX}px ${backgroundY}px`,
        backgroundSize: `${mainImage.value.offsetWidth * zoomFactor}px ${mainImage.value.offsetHeight * zoomFactor}px`
      }
    })
    
    return {
      currentImageIndex,
      currentImage,
      activeOrder,
      editingPrice,
      editPrice,
      priceInput,
      imageContainer,
      mainImage,
      showZoom,
      lensPosition,
      currentPrice,
      formatPrice,
      handleImageError,
      startEditingPrice,
      savePrice,
      cancelEditPrice,
      handleMouseMove,
      lensStyle,
      zoomStyle
    }
  }
}
</script>

<style scoped>
.modal-content {
  max-width: 1400px;
  width: 95vw;
  max-height: 90vh;
}

.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 300px;
  gap: 2rem;
  min-height: 500px;
}

.image-section {
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-image {
  position: relative;
  display: flex;
  gap: 1rem;
}

.image-zoom-container {
  position: relative;
  cursor: crosshair;
  overflow: hidden;
  border-radius: 0.25rem;
  background-color: #f8f9fa;
  flex: 1;
}

.main-product-image {
  max-height: 400px;
  width: 100%;
  object-fit: contain;
  display: block;
  border-radius: 0.25rem;
}

.zoom-lens {
  position: absolute;
  width: 150px;
  height: 150px;
  border: 2px solid #3498db;
  background-color: rgba(52, 152, 219, 0.1);
  pointer-events: none;
  z-index: 10;
}

.zoom-result {
  position: absolute;
  right: -370px;
  top: 0;
  width: 350px;
  height: 350px;
  border: 2px solid #3498db;
  border-radius: 0.25rem;
  background-repeat: no-repeat;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.zoom-image {
  display: none; /* We use background-image instead for better control */
}

/* Responsive adjustments for zoom */
@media (max-width: 1600px) {
  .zoom-result {
    right: -320px;
    width: 300px;
    height: 300px;
  }
}

@media (max-width: 1400px) {
  .zoom-result {
    display: none; /* Hide zoom on smaller screens */
  }
  
  .image-zoom-container {
    cursor: default;
  }
}

.image-thumbnails {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 2px solid transparent;
  border-radius: 0.25rem;
  transition: border-color 0.2s;
}

.thumbnail:hover,
.thumbnail.active {
  border-color: #007bff;
}

.info-section {
  padding-right: 1rem;
  border-right: 1px solid #e9ecef;
}

.quick-add-section {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  height: fit-content;
}

.quick-add-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
}

.quick-add-header h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.active-order-info {
  font-size: 0.875rem;
  color: #3498db;
  font-weight: 600;
}

.dimensions-table {
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  padding: 1rem;
}

.dimension-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
}

.dimension-row:last-child {
  border-bottom: none;
}

.dimensions-image img {
  max-height: 200px;
  object-fit: contain;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
}

.source-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.source-link:hover {
  color: #2980b9;
  text-decoration: underline;
}

.dimensions-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
}

.price-setting {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
}

.price-display-modal p {
  margin-bottom: 0.5rem;
}

.price-edit-modal p {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.price-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.price-input-group input {
  flex: 1;
  max-width: 120px;
}
</style>