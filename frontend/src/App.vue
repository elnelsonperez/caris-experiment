<template>
  <div id="app">
    <AppNavbar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
import AppNavbar from '@/components/AppNavbar.vue'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'

export default {
  name: 'App',
  components: {
    AppNavbar
  },
  async created() {
    const ordersStore = useOrdersStore()
    const productsStore = useProductsStore()
    
    ordersStore.loadFromStorage()
    productsStore.loadPricesFromStorage()
  }
}
</script>