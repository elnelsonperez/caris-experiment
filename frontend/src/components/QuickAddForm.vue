<template>
  <div class="quick-add-form">
    <form @submit.prevent="addToOrder" class="condensed-form">
      <!-- Fabric Selection -->
      <div class="form-group">
        <label class="form-label">Fabric(s) <span class="optional-label">(Optional)</span></label>
        <div class="fabric-input-group">
          <input 
            :value="fabricDisplayText" 
            type="text" 
            class="form-control"
            placeholder="Click to select or leave empty..."
            readonly
            @click="showFabricPicker = true"
          >
          <button 
            type="button" 
            @click="showFabricPicker = true" 
            class="btn-select"
          >
            Browse
          </button>
          <button 
            v-if="selectedFabrics.length > 0"
            type="button" 
            @click="clearFabrics" 
            class="btn-clear"
            title="Clear fabric selection"
          >
            Clear
          </button>
        </div>
      </div>
      
      <!-- Price & Quantity Row -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Price (€)</label>
          <input 
            v-model="price" 
            type="number" 
            step="0.01" 
            min="0"
            class="form-control"
            placeholder="0.00"
            required
          >
        </div>
        
        <div class="form-group">
          <label class="form-label">Qty</label>
          <input 
            v-model="quantity" 
            type="number" 
            min="1"
            class="form-control"
            required
          >
        </div>
      </div>
      
      <button 
        type="submit" 
        class="btn-add-order"
      >
        Add to Order
      </button>
    </form>
    
    <!-- Fabric Picker Modal -->
    <FabricPicker 
      v-if="showFabricPicker"
      :multiple="true"
      :initial-selection="selectedFabrics"
      @fabric-selected="onFabricSelected"
      @fabrics-selected="onFabricsSelected"
      @close="showFabricPicker = false"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import { useToast } from 'vue-toastification'
import FabricPicker from '@/components/FabricPicker.vue'

export default {
  name: 'QuickAddForm',
  components: {
    FabricPicker
  },
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const ordersStore = useOrdersStore()
    const productsStore = useProductsStore()
    const toast = useToast()
    
    const selectedFabrics = ref([])
    const price = ref('')
    const quantity = ref(1)
    const showFabricPicker = ref(false)
    
    const activeOrder = computed(() => ordersStore.activeOrder)
    
    // Set default price from product store
    watch(() => props.product, (product) => {
      if (product) {
        const defaultPrice = productsStore.getProductPrice(product.productId)
        price.value = defaultPrice > 0 ? defaultPrice.toString() : ''
      }
    }, { immediate: true })
    
    const onFabricSelected = (fabric) => {
      selectedFabrics.value = [fabric]
      showFabricPicker.value = false
    }
    
    const onFabricsSelected = (fabrics) => {
      selectedFabrics.value = fabrics
      showFabricPicker.value = false
    }
    
    const fabricDisplayText = computed(() => {
      if (selectedFabrics.value.length === 0) return ''
      if (selectedFabrics.value.length === 1) return selectedFabrics.value[0].code
      return `${selectedFabrics.value.length} fabrics selected`
    })
    
    const clearFabrics = () => {
      selectedFabrics.value = []
    }
    
    const addToOrder = () => {
      if (!activeOrder.value) return
      
      ordersStore.addToOrder(activeOrder.value.id, props.product.productId, {
        fabric: selectedFabrics.value.map(f => f.code),
        price: parseFloat(price.value),
        quantity: parseInt(quantity.value)
      })
      
      // Show success toast
      const fabricText = selectedFabrics.value.length === 0 
        ? 'No fabric'
        : selectedFabrics.value.length === 1 
          ? selectedFabrics.value[0].code
          : `${selectedFabrics.value.length} fabrics`
      toast.success(`Added ${props.product.productName} (${fabricText}) to ${activeOrder.value.name}`, {
        timeout: 2000,
        closeOnClick: true
      })
      
      // Reset form
      selectedFabrics.value = []
      quantity.value = 1
      
      // Update default price if changed
      const newPrice = parseFloat(price.value)
      if (newPrice > 0) {
        productsStore.setProductPrice(props.product.productId, newPrice)
      }
    }
    
    return {
      selectedFabrics,
      fabricDisplayText,
      price,
      quantity,
      showFabricPicker,
      activeOrder,
      onFabricSelected,
      onFabricsSelected,
      clearFabrics,
      addToOrder
    }
  }
}
</script>

<style scoped>
.quick-add-form {
  width: 100%;
}

.condensed-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  margin: 0;
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-control[readonly] {
  background-color: #f8f9fa;
  cursor: pointer;
}

.fabric-input-group {
  display: flex;
  gap: 0.5rem;
}

.fabric-input-group input {
  flex: 1;
}

.btn-select {
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.btn-select:hover {
  background-color: #5a6268;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.75rem;
}

.btn-add-order {
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.btn-add-order:hover:not(.disabled) {
  background-color: #229954;
}

.btn-add-order.disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-clear {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.btn-clear:hover {
  background-color: #c0392b;
}

.optional-label {
  font-weight: 400;
  color: #777;
  font-size: 0.75rem;
}
</style>