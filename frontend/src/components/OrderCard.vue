<template>
  <div class="order-card">
    <!-- Order Header -->
    <div class="order-header">
      <div class="order-title-section">
        <h3 class="order-name">{{ order.name }}</h3>
        <div class="order-meta">
          <span class="item-count">{{ itemCount }} items</span>
          <span class="total-price">{{ formatPrice(total) }}</span>
          <span v-if="isActive" class="active-badge">Active</span>
        </div>
      </div>
      
      <!-- Container Tracking Summary -->
      <div class="container-summary">
        <div class="summary-item">
          <div class="summary-label">Volume</div>
          <div class="summary-value">{{ formatVolume(orderVolume) }}</div>
          <div class="summary-percent" :class="getVolumeWarningClass()">{{ formatPercent(volumePercent) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Weight</div>
          <div class="summary-value">{{ formatWeight(orderWeight) }}</div>
          <div class="summary-percent" :class="getWeightWarningClass()">{{ formatPercent(weightPercent) }}</div>
        </div>
      </div>
      
      <!-- Order Actions -->
      <div class="order-actions">
        <button 
          @click="setAsActive"
          class="action-btn primary"
          :class="{ disabled: isActive }"
          :disabled="isActive"
        >
          {{ isActive ? 'Active' : 'Set Active' }}
        </button>
        <button @click="exportOrder" class="action-btn secondary">
          Export
        </button>
        <button @click="deleteOrder" class="action-btn danger">
          Delete
        </button>
      </div>
    </div>
    
    <!-- Order Items Table -->
    <div v-if="orderItems.length > 0" class="order-items">
      <div class="items-table">
        <div class="table-header">
          <div class="col-thumbnail">Image</div>
          <div class="col-product">Product</div>
          <div class="col-fabric">Fabric</div>
          <div class="col-price">Price</div>
          <div class="col-quantity">Qty</div>
          <div class="col-subtotal">Subtotal</div>
          <div class="col-volume">Volume</div>
          <div class="col-weight">Weight</div>
          <div class="col-actions">Actions</div>
        </div>
        
        <div class="table-row" v-for="item in orderItems" :key="item.itemId">
          <div class="col-thumbnail">
            <div class="thumbnail-container">
              <img 
                :src="getProductImage(item.productId)" 
                :alt="getProductName(item.productId)"
                class="item-thumbnail"
                @error="handleImageError"
                @mouseenter="showImageZoom(item.productId, $event)"
                @mouseleave="hideImageZoom"
              >
              <div 
                v-if="zoomedImageId === item.productId"
                class="image-zoom-overlay"
                :style="zoomOverlayStyle"
              >
                <img 
                  :src="getProductImage(item.productId)" 
                  :alt="getProductName(item.productId)"
                  class="zoomed-image"
                >
              </div>
            </div>
          </div>
          <div class="col-product">
            <div class="product-info" @click="openProductPage(item.productId)">
              <div class="product-name">{{ getProductName(item.productId) }}</div>
              <div class="product-id">{{ item.productId }}</div>
            </div>
          </div>
          <div class="col-fabric">
            <div v-if="editingItem?.itemId !== item.itemId" class="fabric-preview" @click="viewFabric(item.fabric)">
              <img 
                :src="getFabricImage(item.fabric)" 
                :alt="item.fabric"
                class="fabric-thumbnail"
                @error="handleFabricImageError"
              >
              <div class="fabric-code">{{ item.fabric }}</div>
            </div>
            <div v-else class="fabric-edit">
              <button @click="openFabricPicker(item)" class="btn-fabric-change">
                <img 
                  :src="getFabricImage(item.fabric)" 
                  :alt="item.fabric"
                  class="fabric-thumbnail"
                  @error="handleFabricImageError"
                >
                <span class="fabric-code">{{ item.fabric }}</span>
              </button>
            </div>
          </div>
          <div class="col-price">
            <input 
              v-if="editingItem?.itemId === item.itemId"
              v-model="editPrice"
              type="number" 
              step="0.01" 
              min="0"
              class="inline-input"
              @change="updateEditingItem"
            >
            <span v-else class="price-value">{{ formatPrice(item.price) }}</span>
          </div>
          <div class="col-quantity">
            <input 
              v-if="editingItem?.itemId === item.itemId"
              v-model="editQuantity"
              type="number" 
              min="1"
              class="inline-input"
              @change="updateEditingItem"
            >
            <span v-else class="quantity-value">{{ item.quantity }}</span>
          </div>
          <div class="col-subtotal">
            <span class="subtotal-value">{{ formatPrice(getEditedSubtotal(item)) }}</span>
          </div>
          <div class="col-volume">
            <span class="volume-value">{{ formatVolume(getItemVolume(item)) }}</span>
          </div>
          <div class="col-weight">
            <span class="weight-value">{{ formatWeight(getItemWeight(item)) }}</span>
          </div>
          <div class="col-actions">
            <div v-if="editingItem?.itemId === item.itemId" class="edit-actions">
              <button @click="saveEdit()" class="mini-btn save">Save</button>
              <button @click="cancelEdit()" class="mini-btn cancel">Cancel</button>
            </div>
            <div v-else class="normal-actions">
              <button @click="startEdit(item)" class="mini-btn edit">Edit</button>
              <button @click="removeItem(item)" class="mini-btn delete">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="empty-items">
      <p>No items in this order yet.</p>
      <router-link to="/products" class="action-btn primary">
        Browse Products
      </router-link>
    </div>
    
    <!-- Compact Order Summary & Container Guide -->
    <div v-if="orderItems.length > 0" class="order-summary">
      <div class="summary-row">
        <div class="summary-stat">
          <span class="stat-label">Items:</span>
          <span class="stat-value">{{ itemCount }}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Value:</span>
          <span class="stat-value">{{ formatPrice(total) }}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Volume:</span>
          <span class="stat-value">{{ formatVolume(orderVolume) }}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Weight:</span>
          <span class="stat-value">{{ formatWeight(orderWeight) }}</span>
        </div>
      </div>
      
      <div class="container-guide">
        <div class="container-header">
          <h4>{{ containerType }} Container Capacity</h4>
          <button @click="toggleContainerType" class="container-toggle" :title="`Switch to ${containerType === '40ft' ? '20ft' : '40ft'}`">
            <span class="toggle-icon">⇄</span>
            <span class="toggle-text">{{ containerType === '40ft' ? '20ft' : '40ft' }}</span>
          </button>
        </div>
        <div class="capacity-bars">
          <div class="capacity-bar">
            <div class="capacity-label">
              <span>Volume</span>
              <span class="capacity-fraction">{{ formatVolume(orderVolume) }} / {{ formatVolume(currentContainerVolume) }}</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill volume" 
                :style="{ width: Math.min(volumePercent, 100) + '%' }"
                :class="getVolumeWarningClass()"
              ></div>
            </div>
            <div class="capacity-percent" :class="getVolumeWarningClass()">
              {{ formatPercent(volumePercent) }}
            </div>
          </div>
          
          <div class="capacity-bar">
            <div class="capacity-label">
              <span>Weight</span>
              <span class="capacity-fraction">{{ formatWeight(orderWeight) }} / {{ formatWeight(currentContainerWeight) }}</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill weight" 
                :style="{ width: Math.min(weightPercent, 100) + '%' }"
                :class="getWeightWarningClass()"
              ></div>
            </div>
            <div class="capacity-percent" :class="getWeightWarningClass()">
              {{ formatPercent(weightPercent) }}
            </div>
          </div>
        </div>
        
      </div>
    </div>
    
    <!-- Fabric Modal -->
    <FabricModal 
      v-if="viewingFabric"
      :fabric="viewingFabric"
      @close="viewingFabric = null"
    />
    
    <!-- Fabric Picker for Editing -->
    <FabricPicker 
      v-if="fabricPickerForItem"
      @fabric-selected="onFabricSelected"
      @close="fabricPickerForItem = null"
    />
    
    <!-- Export Modal -->
    <OrderExportModal 
      v-if="showExportModal"
      :order="order"
      @close="showExportModal = false"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import { useFabricsStore } from '@/stores/fabrics'
import FabricModal from '@/components/FabricModal.vue'
import FabricPicker from '@/components/FabricPicker.vue'
import OrderExportModal from '@/components/OrderExportModal.vue'

export default {
  name: 'OrderCard',
  components: {
    FabricModal,
    FabricPicker,
    OrderExportModal
  },
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const ordersStore = useOrdersStore()
    const productsStore = useProductsStore()
    const fabricsStore = useFabricsStore()
    const editingItem = ref(null)
    const viewingFabric = ref(null)
    const editPrice = ref(0)
    const editQuantity = ref(1)
    const fabricPickerForItem = ref(null)
    const zoomedImageId = ref(null)
    const zoomOverlayStyle = ref({})
    
    const isActive = computed(() => ordersStore.activeOrderId === props.order.id)
    const orderItems = computed(() => ordersStore.getOrderItemsWithId(props.order.id))
    const itemCount = computed(() => ordersStore.getOrderItemCount(props.order.id))
    const total = computed(() => ordersStore.getOrderTotal(props.order.id))
    const orderVolume = computed(() => ordersStore.getOrderVolume(props.order.id))
    const orderWeight = computed(() => ordersStore.getOrderWeight(props.order.id))
    const volumePercent = computed(() => ordersStore.getOrderContainerPercent(props.order.id))
    const weightPercent = computed(() => ordersStore.getOrderWeightPercent(props.order.id))
    const containerType = computed(() => ordersStore.containerType)
    const currentContainerVolume = computed(() => ordersStore.currentContainerVolume)
    const currentContainerWeight = computed(() => ordersStore.currentContainerWeight)
    
    const formatPrice = (price) => {
      return `€${price.toFixed(2)}`
    }
    
    const formatVolume = (volume) => {
      return `${volume.toFixed(2)} m³`
    }
    
    const formatWeight = (weight) => {
      return weight > 1000 ? `${(weight / 1000).toFixed(1)}t` : `${weight.toFixed(0)}kg`
    }
    
    const formatPercent = (percent) => {
      return `${percent.toFixed(1)}%`
    }
    
    const getVolumeWarningClass = () => {
      if (volumePercent.value >= 90) return 'warning-critical'
      if (volumePercent.value >= 70) return 'warning-high'
      return 'normal'
    }
    
    const getWeightWarningClass = () => {
      if (weightPercent.value >= 90) return 'warning-critical'
      if (weightPercent.value >= 70) return 'warning-high'
      return 'normal'
    }
    
    const getProductName = (productId) => {
      const product = productsStore.getProductById(productId)
      return product ? product.productName : `Product ${productId}`
    }
    
    const getProductImage = (productId) => {
      const product = productsStore.getProductById(productId)
      return product && product.images[0] ? product.images[0] : ''
    }
    
    const getItemVolume = (item) => {
      return ordersStore.getItemVolume(item)
    }
    
    const getItemWeight = (item) => {
      return ordersStore.getItemWeight(item)
    }
    
    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
    }
    
    const setAsActive = () => {
      ordersStore.setActiveOrder(props.order.id)
    }
    
    const deleteOrder = () => {
      if (confirm(`Are you sure you want to delete "${props.order.name}"?`)) {
        ordersStore.deleteOrder(props.order.id)
      }
    }
    
    const showExportModal = ref(false)
    
    const exportOrder = () => {
      showExportModal.value = true
    }
    
    const toggleContainerType = () => {
      const newType = containerType.value === '40ft' ? '20ft' : '40ft'
      ordersStore.setContainerType(newType)
    }
    
    const startEdit = (item) => {
      editingItem.value = item
      editPrice.value = item.price
      editQuantity.value = item.quantity
    }
    
    const cancelEdit = () => {
      editingItem.value = null
      editPrice.value = 0
      editQuantity.value = 1
    }
    
    const saveEdit = () => {
      if (editingItem.value) {
        ordersStore.updateOrderItem(props.order.id, editingItem.value.itemId, {
          price: parseFloat(editPrice.value),
          quantity: parseInt(editQuantity.value)
        })
        editingItem.value = null
      }
    }
    
    const updateEditingItem = () => {
      // Auto-save changes for real-time updates
      if (editingItem.value) {
        ordersStore.updateOrderItem(props.order.id, editingItem.value.itemId, {
          price: parseFloat(editPrice.value),
          quantity: parseInt(editQuantity.value)
        })
      }
    }
    
    const getEditedSubtotal = (item) => {
      if (editingItem.value?.itemId === item.itemId) {
        return parseFloat(editPrice.value) * parseInt(editQuantity.value)
      }
      return item.price * item.quantity
    }
    
    const openFabricPicker = (item) => {
      fabricPickerForItem.value = item
    }
    
    const onFabricSelected = (fabric) => {
      if (fabricPickerForItem.value) {
        ordersStore.updateOrderItem(props.order.id, fabricPickerForItem.value.itemId, {
          fabric: fabric.code
        })
        fabricPickerForItem.value = null
      }
    }
    
    
    const removeItem = (item) => {
      if (confirm('Remove this item from the order?')) {
        ordersStore.removeFromOrder(props.order.id, item.itemId)
      }
    }
    
    const getFabricImage = (fabricCode) => {
      const fabric = fabricsStore.getFabricByCode(fabricCode)
      return fabric ? fabric.thumbnail_url : ''
    }
    
    const handleFabricImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
    }
    
    const viewFabric = (fabricCode) => {
      const fabric = fabricsStore.getFabricByCode(fabricCode)
      if (fabric) {
        viewingFabric.value = fabric
      }
    }
    
    const showImageZoom = (productId, event) => {
      const rect = event.target.getBoundingClientRect()
      zoomedImageId.value = productId
      zoomOverlayStyle.value = {
        position: 'fixed',
        top: `${rect.top}px`,
        left: `${rect.right + 10}px`,
        zIndex: 9999,
        pointerEvents: 'none'
      }
    }
    
    const hideImageZoom = () => {
      zoomedImageId.value = null
      zoomOverlayStyle.value = {}
    }
    
    const openProductPage = (productId) => {
      window.open(`/products/${productId}`, '_blank')
    }
    
    
    return {
      editingItem,
      viewingFabric,
      editPrice,
      editQuantity,
      fabricPickerForItem,
      showExportModal,
      containerType,
      currentContainerVolume,
      currentContainerWeight,
      isActive,
      orderItems,
      itemCount,
      total,
      orderVolume,
      orderWeight,
      volumePercent,
      weightPercent,
      formatPrice,
      formatVolume,
      formatWeight,
      formatPercent,
      getVolumeWarningClass,
      getWeightWarningClass,
      getProductName,
      getProductImage,
      getItemVolume,
      getItemWeight,
      handleImageError,
      getFabricImage,
      handleFabricImageError,
      viewFabric,
      openProductPage,
      setAsActive,
      deleteOrder,
      exportOrder,
      startEdit,
      cancelEdit,
      saveEdit,
      updateEditingItem,
      getEditedSubtotal,
      openFabricPicker,
      onFabricSelected,
      removeItem,
      toggleContainerType,
      zoomedImageId,
      zoomOverlayStyle,
      showImageZoom,
      hideImageZoom
    }
  }
}
</script>

<style scoped>
.order-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: box-shadow 0.2s;
}

.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Order Header */
.order-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.order-title-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.order-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.active-badge {
  background: #27ae60;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Container Summary */
.container-summary {
  display: flex;
  gap: 2rem;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.summary-value {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.summary-percent {
  font-size: 0.875rem;
  font-weight: 600;
}

.summary-percent.normal { color: #27ae60; }
.summary-percent.warning-high { color: #f39c12; }
.summary-percent.warning-critical { color: #e74c3c; }

/* Order Actions */
.order-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.action-btn.primary {
  background: #3498db;
  color: white;
}

.action-btn.primary:hover:not(.disabled) {
  background: #2980b9;
}

.action-btn.primary.disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:hover {
  background: #5a6268;
}

.action-btn.danger {
  background: #e74c3c;
  color: white;
}

.action-btn.danger:hover {
  background: #c0392b;
}

/* Items Table */
.order-items {
  padding: 0;
}

.items-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 2.5fr 1.5fr 0.8fr 0.6fr 0.8fr 0.8fr 0.8fr 1fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 2.5fr 1.5fr 0.8fr 0.6fr 0.8fr 0.8fr 0.8fr 1fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f3f4;
  align-items: center;
  transition: background-color 0.2s;
}

.table-row:hover {
  background: #f8f9fa;
}

.thumbnail-container {
  position: relative;
  display: inline-block;
}

.item-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.item-thumbnail:hover {
  transform: scale(1.05);
}

.image-zoom-overlay {
  position: fixed;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 300px;
  max-height: 300px;
}

.zoomed-image {
  width: 100%;
  height: auto;
  max-width: 300px;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
}

.product-info {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.product-info:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.product-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.product-info:hover .product-name {
  color: #3498db;
}

.product-id {
  font-size: 0.75rem;
  color: #6c757d;
}

.fabric-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.fabric-preview:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.fabric-thumbnail {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 0.25rem;
  background: white;
  border: 1px solid #e9ecef;
}

.fabric-code {
  font-weight: 500;
  color: #3498db;
  font-size: 0.875rem;
}

.price-value,
.quantity-value,
.subtotal-value,
.volume-value,
.weight-value {
  font-weight: 600;
  font-size: 0.875rem;
}

.mini-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  margin-right: 0.25rem;
}

.mini-btn.edit {
  background: #3498db;
  color: white;
}

.mini-btn.edit:hover {
  background: #2980b9;
}

.mini-btn.delete {
  background: #e74c3c;
  color: white;
}

.mini-btn.delete:hover {
  background: #c0392b;
}

.mini-btn.save {
  background: #27ae60;
  color: white;
}

.mini-btn.save:hover {
  background: #229954;
}

.mini-btn.cancel {
  background: #95a5a6;
  color: white;
}

.mini-btn.cancel:hover {
  background: #7f8c8d;
}


/* Inline Editing Styles */
.inline-input {
  width: 70px;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  background: white;
}

.inline-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.fabric-edit {
  display: flex;
  align-items: center;
}

.btn-fabric-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-fabric-change:hover {
  background: #e9ecef;
  border-color: #3498db;
}

.edit-actions,
.normal-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

/* Compact Order Summary & Container Guide */
.order-summary {
  background: #f8f9fa;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-around;
  background: white;
  border-radius: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.container-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.container-guide h4 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

.container-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  color: #6c757d;
}

.container-toggle:hover {
  background: #e9ecef;
  border-color: #3498db;
  color: #3498db;
}

.toggle-icon {
  font-size: 0.9rem;
  font-weight: bold;
}

.toggle-text {
  font-weight: 500;
}

/* Container Capacity */
.capacity-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.capacity-bar {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 1rem;
  align-items: center;
}

.capacity-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 500;
}

.capacity-fraction {
  color: #6c757d;
  font-size: 0.8rem;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.volume.normal { background: #27ae60; }
.progress-fill.volume.warning-high { background: #f39c12; }
.progress-fill.volume.warning-critical { background: #e74c3c; }

.progress-fill.weight.normal { background: #3498db; }
.progress-fill.weight.warning-high { background: #f39c12; }
.progress-fill.weight.warning-critical { background: #e74c3c; }

.capacity-percent {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}


/* Empty State */
.empty-items {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #6c757d;
}

.empty-items p {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}
</style>