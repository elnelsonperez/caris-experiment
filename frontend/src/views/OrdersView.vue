<template>
  <div class="orders-view">
    <div class="container">
      <div class="orders-header mb-4">
        <div class="flex justify-between align-center">
          <h2>Orders</h2>
          <button @click="showCreateOrder = true" class="btn">
            Create New Order
          </button>
        </div>
      </div>
      
      <!-- Orders List -->
      <div v-if="orderList.length > 0" class="orders-list">
        <OrderCard 
          v-for="order in orderList" 
          :key="order.id"
          :order="order"
        />
      </div>
      
      <!-- Empty State -->
      <div v-else class="empty-state card text-center p-4">
        <h3>No Orders Yet</h3>
        <p class="text-muted mb-3">Create your first order to start managing products.</p>
        <button @click="showCreateOrder = true" class="btn">
          Create Your First Order
        </button>
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
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import OrderCard from '@/components/OrderCard.vue'

export default {
  name: 'OrdersView',
  components: {
    OrderCard
  },
  setup() {
    const ordersStore = useOrdersStore()
    const showCreateOrder = ref(false)
    const newOrderName = ref('')
    const orderNameInput = ref(null)
    
    const orderList = computed(() => ordersStore.orderList)
    
    const createOrder = async () => {
      if (newOrderName.value.trim()) {
        const orderId = ordersStore.createOrder(newOrderName.value.trim())
        ordersStore.setActiveOrder(orderId)
        newOrderName.value = ''
        showCreateOrder.value = false
      }
    }
    
    // Focus input when modal opens
    const watchCreateOrder = async (newVal) => {
      if (newVal) {
        await nextTick()
        orderNameInput.value?.focus()
      }
    }
    
    return {
      orderList,
      showCreateOrder,
      newOrderName,
      orderNameInput,
      createOrder
    }
  }
}
</script>

<style scoped>
.orders-view {
  min-height: calc(100vh - 200px);
}

.orders-view .container {
  max-width: 1400px;
}

.orders-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.orders-list {
  /* Orders will stack vertically, no grid needed */
}

.empty-state {
  max-width: 500px;
  margin: 2rem auto;
}
</style>