# Vue Product Browser - Frontend Implementation Specifications

## Requirements

### Core Functionality
1. **Product Listing**: Display all products from `result.json` with search functionality
2. **Order Creation**: Create and manage multiple orders with unique names
3. **Active Order System**: Set one order as "active" for quick product additions while browsing
4. **Order Editing**: Modify order items (fabric, price, quantity), remove items
5. **Volume Calculations**: Automatic totals for order quantities and pricing
6. **Fabric Selection**: Browse and select fabrics from `fabrics.json` for each order item
7. **Data Persistence**: Save orders to localStorage, restore on app load
8. **Product Details**: View product images, dimensions, and specifications
9. **Print-Friendly Export**: Generate table view optimized for copying to Google Sheets

### User Experience Improvements
Since we're moving to Vue with routing capabilities, we can improve the UX:
- **Navigation**: Use proper navbar with routes instead of sidebar tabs
- **Deep Linking**: Shareable URLs for specific products and orders
- **Better Mobile**: Responsive design that works well on all screen sizes
- **Quick Actions**: Streamlined quick-add flow when browsing products

### Data Sources
- **Products**: `caris-scraper-python/result.json` - Product catalog with images, dimensions, and metadata
- **Fabrics**: `caris-scraper-python/fabrics.json` - Available fabric options with images

## Application Architecture

### Simplified Project Structure
```
vue-product-browser/
├── src/
│   ├── views/
│   │   ├── ProductsView.vue    # Product browsing page
│   │   └── OrdersView.vue      # Order management page
│   ├── components/
│   │   ├── AppNavbar.vue       # Navigation with active order indicator
│   │   ├── ProductCard.vue     # Product grid item
│   │   ├── ProductModal.vue    # Product details modal
│   │   ├── QuickAddForm.vue    # Quick add to active order
│   │   ├── OrderCard.vue       # Order summary card
│   │   ├── OrderItemForm.vue   # Edit order item details
│   │   ├── OrderExportModal.vue # Print-friendly table export
│   │   └── FabricPicker.vue    # Fabric selection component
│   ├── stores/
│   │   ├── products.js         # Product data and search
│   │   ├── orders.js           # Order management and persistence
│   │   └── fabrics.js          # Fabric data and selection
│   ├── router/
│   │   └── index.js           # Vue Router configuration
│   ├── data/
│   │   ├── products.json      # Imported from result.json
│   │   └── fabrics.json       # Imported from fabrics.json
│   ├── styles/
│   │   └── main.css           # Global styles
│   ├── App.vue
│   └── main.js
├── package.json
├── vite.config.js
└── README.md
```

## Key Features & Components

### 1. Navigation (AppNavbar.vue)
**Improved UX**: Replace sidebar tabs with proper navbar navigation
- **Links**: "Products" and "Orders" routes using Vue Router
- **Active Order Indicator**: Show current active order name and item count
- **Quick Actions**: "Create New Order" and "Set Active Order" dropdowns
- **Responsive**: Collapsible mobile menu

### 2. Products View (ProductsView.vue)
**Route**: `/products` (default)
- **Product Grid**: Responsive grid of ProductCard components
- **Search Bar**: Filter products by name or ID
- **Quick Add Panel**: Persistent panel showing active order and QuickAddForm (when active order exists)

#### ProductCard.vue
- **Thumbnail**: First product image with fallback
- **Product Info**: Name, ID, status indicators
- **Click Action**: Opens ProductModal with full details

#### ProductModal.vue
- **Image Gallery**: Carousel with thumbnails and navigation
- **Dimensions Table**: Product specifications and measurements
- **Quick Add Form**: Direct integration when active order exists
- **Deep Link**: URL updates to `/products/:productId`

#### QuickAddForm.vue
- **Fabric Picker**: Integrated FabricPicker component
- **Price & Quantity**: Number inputs with validation
- **Add Button**: Adds to active order with feedback

### 3. Orders View (OrdersView.vue)
**Route**: `/orders`
- **Order Grid**: Cards showing order summaries
- **Create New**: Prominent "Create Order" button
- **Order Management**: Set active, edit, delete actions

#### OrderCard.vue
- **Order Summary**: Name, item count, total value
- **Status Indicators**: Active order badge, last modified
- **Quick Actions**: Edit, set active, delete, export buttons
- **Click Action**: Expands to show OrderItemForm list

#### OrderItemForm.vue
- **Product Info**: Thumbnail, name, ID (read-only)
- **Editable Fields**: Fabric (with picker), price, quantity
- **Actions**: Remove item, duplicate item
- **Auto-save**: Changes persist immediately to localStorage

### 4. Fabric Selection (FabricPicker.vue)
**Reusable Component**: Used in QuickAddForm and OrderItemForm
- **Search**: Filter fabrics by code or name
- **Grid Display**: Thumbnail images with fabric codes
- **Selection**: Click to select, visual feedback
- **Integration**: Returns selected fabric to parent component

### 5. Volume Calculations
**Automatic in Orders Store**:
- **Order Totals**: Sum of (price × quantity) for all items
- **Item Counts**: Total number of products in order
- **Real-time Updates**: Recalculate when items change
- **Display**: Show in OrderCard and navbar indicator

### 6. Print-Friendly Export (OrderExportModal.vue)
**Data Table for Google Sheets**:
- **Export Button**: Available on each OrderCard ("Export" button)
- **Modal Display**: Opens OrderExportModal with order data
- **Table Columns**: Product ID | Product Name | Fabric | Price | Quantity | Line Total
- **Order Summary**: Order name, total items, grand total at bottom
- **Copy-Optimized**: 
  - Tab-separated format for easy spreadsheet pasting
  - Select-all functionality with one click
  - Clean, minimal styling for readability
- **Print Styles**: CSS `@media print` hides navigation and shows only table
- **Actions**: 
  - "Copy Table" button (copies tab-separated data to clipboard)
  - "Print" button (opens print dialog)
  - "Close" button

## State Management

### Products Store
```javascript
// stores/products.js
export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [], // loaded from products.json
    searchQuery: ''
  }),
  getters: {
    filteredProducts: (state) => {
      if (!state.searchQuery) return state.products
      const query = state.searchQuery.toLowerCase()
      return state.products.filter(product => 
        product.productId.toLowerCase().includes(query) ||
        product.productName.toLowerCase().includes(query)
      )
    }
  }
})
```

### Orders Store
```javascript
// stores/orders.js
export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: {}, // { orderId: { id, name, items: { productId: { fabric, price, quantity } } } }
    activeOrderId: null
  }),
  getters: {
    orderList: (state) => Object.values(state.orders),
    activeOrder: (state) => state.orders[state.activeOrderId],
    getOrderTotal: (state) => (orderId) => {
      const order = state.orders[orderId]
      if (!order) return 0
      return Object.values(order.items).reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }
  },
  actions: {
    createOrder(name) {
      const id = 'order_' + Date.now()
      this.orders[id] = { id, name, items: {}, createdAt: Date.now() }
      this.saveToStorage()
      return id
    },
    setActiveOrder(orderId) {
      this.activeOrderId = orderId
      this.saveToStorage()
    },
    addToOrder(orderId, productId, { fabric, price, quantity }) {
      if (!this.orders[orderId]) return
      this.orders[orderId].items[productId] = { productId, fabric, price, quantity }
      this.saveToStorage()
    },
    removeFromOrder(orderId, productId) {
      if (this.orders[orderId]?.items[productId]) {
        delete this.orders[orderId].items[productId]
        this.saveToStorage()
      }
    },
    saveToStorage() {
      localStorage.setItem('orders', JSON.stringify({
        orders: this.orders,
        activeOrderId: this.activeOrderId
      }))
    },
    loadFromStorage() {
      try {
        const saved = localStorage.getItem('orders')
        if (saved) {
          const data = JSON.parse(saved)
          this.orders = data.orders || {}
          this.activeOrderId = data.activeOrderId || null
        }
      } catch (error) {
        console.error('Failed to load orders from localStorage:', error)
      }
    }
  }
})
```

### Fabrics Store
```javascript
// stores/fabrics.js
export const useFabricsStore = defineStore('fabrics', {
  state: () => ({
    fabrics: [], // loaded from fabrics.json
    searchQuery: ''
  }),
  getters: {
    filteredFabrics: (state) => {
      if (!state.searchQuery) return state.fabrics
      const query = state.searchQuery.toLowerCase()
      return state.fabrics.filter(fabric => 
        fabric.code.toLowerCase().includes(query)
      )
    }
  }
})
```

## Development Setup

### Package Dependencies
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### Router Configuration
```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/products' },
    { path: '/products', component: () => import('@/views/ProductsView.vue') },
    { path: '/products/:productId', component: () => import('@/views/ProductsView.vue') },
    { path: '/orders', component: () => import('@/views/OrdersView.vue') }
  ]
})
```

## Implementation Priority

### Phase 1: Core Structure (Essential)
1. **Project Setup**: Vue 3 + Vite + Pinia + Vue Router
2. **Data Import**: Copy JSON files and load into stores
3. **Basic Navigation**: AppNavbar with route links
4. **ProductsView**: Grid of ProductCard components with search

### Phase 2: Product Features (High Priority)
1. **ProductModal**: Product details with image gallery and dimensions
2. **QuickAddForm**: Add products to active order
3. **FabricPicker**: Fabric selection component
4. **Deep Linking**: URL updates for selected products

### Phase 3: Order Management (High Priority)
1. **OrdersView**: Order creation and management
2. **OrderCard**: Order summaries with totals
3. **OrderItemForm**: Edit order items (fabric, price, quantity)
4. **Active Order System**: Set and display active order in navbar

### Phase 4: Export & Polish (Medium Priority)
1. **OrderExportModal**: Print-friendly table view for Google Sheets
2. **Volume Calculations**: Real-time order totals
3. **LocalStorage**: Load orders on app initialization
4. **Responsive Design**: Mobile-friendly layouts
5. **Error Handling**: Graceful handling of missing data

This focused specification provides clear requirements and a practical roadmap for building a well-structured Vue application that improves upon the original while maintaining all essential functionality.