import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      redirect: '/products' 
    },
    { 
      path: '/products', 
      name: 'Products',
      component: () => import('@/views/ProductsView.vue') 
    },
    { 
      path: '/products/:productId', 
      name: 'ProductDetail',
      component: () => import('@/views/ProductsView.vue'),
      props: true
    },
    { 
      path: '/orders', 
      name: 'Orders',
      component: () => import('@/views/OrdersView.vue') 
    }
  ]
})