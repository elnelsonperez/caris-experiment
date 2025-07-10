<template>
  <div class="order-item-form card">
    <div class="card-body p-3">
      <div class="item-layout grid grid-cols-1 md:grid-cols-4 gap-3 align-center">
        <!-- Product Info -->
        <div class="product-info">
          <div class="product-thumbnail">
            <img 
              :src="productImage" 
              :alt="productName"
              class="thumbnail-img"
              @error="handleImageError"
            >
          </div>
          <div class="product-details">
            <div class="product-name">{{ productName }}</div>
            <div class="product-id text-muted">{{ item.productId }}</div>
          </div>
        </div>
        
        <!-- Fabric Selection -->
        <div class="fabric-section">
          <label class="form-label">Fabric:</label>
          <div class="fabric-display flex align-center gap-2">
            <span class="fabric-code">{{ item.fabric }}</span>
            <button @click="showFabricPicker = true" class="btn btn-sm btn-secondary">
              Change
            </button>
          </div>
        </div>
        
        <!-- Price -->
        <div class="price-section">
          <label class="form-label">Price:</label>
          <input 
            v-model="editPrice" 
            type="number" 
            step="0.01" 
            min="0"
            class="form-control"
            @change="updateItem"
          >
        </div>
        
        <!-- Quantity & Actions -->
        <div class="actions-section">
          <label class="form-label">Quantity:</label>
          <div class="quantity-controls flex gap-2 mb-2">
            <input 
              v-model="editQuantity" 
              type="number" 
              min="1"
              class="form-control"
              @change="updateItem"
            >
          </div>
          <div class="item-actions flex gap-1">
            <button @click="duplicateItem" class="btn btn-sm btn-secondary">
              Duplicate
            </button>
            <button @click="removeItem" class="btn btn-sm btn-danger">
              Remove
            </button>
          </div>
        </div>
      </div>
      
      <!-- Line Total -->
      <div class="line-total text-right mt-2 pt-2" style="border-top: 1px solid #eee;">
        <strong>Line Total: {{ formatPrice(lineTotal) }}</strong>
      </div>
      
      <!-- Fabric Picker Modal -->
      <FabricPicker 
        v-if="showFabricPicker"
        @fabric-selected="onFabricSelected"
        @close="showFabricPicker = false"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import FabricPicker from '@/components/FabricPicker.vue'

export default {
  name: 'OrderItemForm',
  components: {
    FabricPicker
  },
  props: {
    orderId: {
      type: String,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const ordersStore = useOrdersStore()
    const productsStore = useProductsStore()
    
    const editPrice = ref(props.item.price)
    const editQuantity = ref(props.item.quantity)
    const showFabricPicker = ref(false)
    
    const product = computed(() => productsStore.getProductById(props.item.productId))
    const productName = computed(() => product.value?.productName || `Product ${props.item.productId}`)
    const productImage = computed(() => product.value?.images[0] || '')
    const lineTotal = computed(() => editPrice.value * editQuantity.value)
    
    // Watch for prop changes
    watch(() => props.item.price, (newPrice) => {
      editPrice.value = newPrice
    })
    
    watch(() => props.item.quantity, (newQuantity) => {
      editQuantity.value = newQuantity
    })
    
    const formatPrice = (price) => {
      return `€${price.toFixed(2)}`
    }
    
    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
    }
    
    const updateItem = () => {
      ordersStore.updateOrderItem(props.orderId, props.item.itemId, {
        price: parseFloat(editPrice.value),
        quantity: parseInt(editQuantity.value)
      })
    }
    
    const onFabricSelected = (fabric) => {
      ordersStore.updateOrderItem(props.orderId, props.item.itemId, {
        fabric: fabric.code
      })
      showFabricPicker.value = false
    }
    
    const duplicateItem = () => {
      // addToOrder expects productId as second parameter, not itemId
      ordersStore.addToOrder(props.orderId, props.item.productId, {
        fabric: props.item.fabric,
        price: props.item.price,
        quantity: props.item.quantity
      })
    }
    
    const removeItem = () => {
      if (confirm('Remove this item from the order?')) {
        ordersStore.removeFromOrder(props.orderId, props.item.itemId)
      }
    }
    
    return {
      editPrice,
      editQuantity,
      showFabricPicker,
      productName,
      productImage,
      lineTotal,
      formatPrice,
      handleImageError,
      updateItem,
      onFabricSelected,
      duplicateItem,
      removeItem
    }
  }
}
</script>

<style scoped>
.order-item-form {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
}

.item-layout {
  gap: 1rem;
}

.product-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.product-thumbnail {
  flex-shrink: 0;
}

.thumbnail-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 0.25rem;
  background-color: white;
}

.product-name {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.2;
}

.product-id {
  font-size: 0.75rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.25rem;
  display: block;
}

.fabric-code {
  font-weight: 600;
  color: #007bff;
  font-size: 0.875rem;
}

.quantity-controls input {
  max-width: 80px;
}

.item-actions {
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .item-layout {
    grid-template-columns: 1fr;
  }
  
  .product-info {
    justify-content: center;
    text-align: center;
  }
  
  .fabric-display,
  .quantity-controls,
  .item-actions {
    justify-content: center;
  }
}
</style>