<template>
  <nav class="navbar">
    <div class="container">
      <div class="navbar-content">
        <div class="flex align-center gap-3">
          <h1 class="navbar-brand">Product Browser Tool</h1>
          <ul class="navbar-nav">
            <li>
              <router-link to="/products" class="nav-link" :class="{ active: $route.path.startsWith('/products') }">
                Products
              </router-link>
            </li>
            <li>
              <router-link to="/orders" class="nav-link" :class="{ active: $route.path === '/orders' }">
                Orders
              </router-link>
            </li>
          </ul>
        </div>
        
        <div class="flex align-center gap-3">
          <!-- Active Order Indicator -->
          <div v-if="activeOrder" class="active-order-indicator">
            <span class="text-muted">Active Order:</span>
            <strong>{{ activeOrder.name }}</strong>
            <span class="badge" v-if="activeOrderItemCount > 0">{{ activeOrderItemCount }}</span>
          </div>
          
          <!-- Order Actions -->
          <div class="flex gap-2">
            <button @click="showCreateOrder = true" class="btn btn-sm">
              New Order
            </button>
            <div v-if="orderList.length > 0" class="relative">
              <button @click="showOrderSelector = !showOrderSelector" class="btn btn-sm btn-secondary">
                Set Active
              </button>
              <div v-if="showOrderSelector" class="order-dropdown">
                <button 
                  v-for="order in orderList" 
                  :key="order.id"
                  @click="setActiveOrder(order.id)"
                  class="dropdown-item"
                  :class="{ active: order.id === activeOrderId }"
                >
                  {{ order.name }}
                </button>
                <button @click="setActiveOrder(null)" class="dropdown-item">
                  Clear Active
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create Order Modal -->
    <div v-if="showCreateOrder" class="modal" @click.self="showCreateOrder = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create New Order</h3>
          <button @click="showCreateOrder = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createOrder">
            <div class="mb-3">
              <label for="orderName">Order Name:</label>
              <input 
                id="orderName"
                v-model="newOrderName" 
                type="text" 
                class="form-control"
                placeholder="Enter order name..."
                required
                ref="orderNameInput"
              >
            </div>
            <div class="flex gap-2 justify-between">
              <button type="button" @click="showCreateOrder = false" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn">
                Create Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { useOrdersStore } from '@/stores/orders'
import { computed, ref, nextTick } from 'vue'

export default {
  name: 'AppNavbar',
  setup() {
    const ordersStore = useOrdersStore()
    const showCreateOrder = ref(false)
    const showOrderSelector = ref(false)
    const newOrderName = ref('')
    const orderNameInput = ref(null)
    
    const activeOrder = computed(() => ordersStore.activeOrder)
    const activeOrderId = computed(() => ordersStore.activeOrderId)
    const orderList = computed(() => ordersStore.orderList)
    const activeOrderItemCount = computed(() => 
      activeOrder.value ? ordersStore.getOrderItemCount(activeOrder.value.id) : 0
    )
    
    const createOrder = async () => {
      if (newOrderName.value.trim()) {
        const orderId = ordersStore.createOrder(newOrderName.value.trim())
        ordersStore.setActiveOrder(orderId)
        newOrderName.value = ''
        showCreateOrder.value = false
      }
    }
    
    const setActiveOrder = (orderId) => {
      ordersStore.setActiveOrder(orderId)
      showOrderSelector.value = false
    }
    
    // Focus input when modal opens
    const watchCreateOrder = async (newVal) => {
      if (newVal) {
        await nextTick()
        orderNameInput.value?.focus()
      }
    }
    
    return {
      activeOrder,
      activeOrderId,
      orderList,
      activeOrderItemCount,
      showCreateOrder,
      showOrderSelector,
      newOrderName,
      orderNameInput,
      createOrder,
      setActiveOrder
    }
  }
}
</script>

<style scoped>
.navbar-brand {
  font-size: 1.25rem;
  font-weight: bold;
  color: #007bff;
}

.active-order-indicator {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.relative {
  position: relative;
}

.order-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.active {
  background-color: #007bff;
  color: white;
}

.dropdown-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .navbar-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .active-order-indicator {
    order: -1;
  }
}
</style>