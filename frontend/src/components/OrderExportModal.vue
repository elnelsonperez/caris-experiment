<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content export-modal">
      <div class="modal-header no-print">
        <h3>Export Order: {{ order.name }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="export-actions no-print">
          <button @click="copyTable" class="btn btn-primary">Copy Table</button>
          <button @click="printTable" class="btn btn-secondary">Print</button>
          <div v-if="copySuccess" class="copy-status">✓ Copied to clipboard!</div>
        </div>
        
        <div class="export-table-container">
          <div class="order-header-info">
            <h2>{{ order.name }}</h2>
            <div class="order-meta">
              <span>{{ itemCount }} items</span>
              <span>{{ formatPrice(orderTotal) }}</span>
            </div>
          </div>
          
          <table class="export-table" ref="exportTable">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Fabric</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in orderItems" :key="item.productId">
                <td>{{ item.productId }}</td>
                <td>{{ getProductName(item.productId) }}</td>
                <td>{{ item.fabric }}</td>
                <td>{{ formatPrice(item.price) }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatPrice(item.price * item.quantity) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="summary-row">
                <td colspan="4"><strong>Order Total</strong></td>
                <td><strong>{{ totalQuantity }}</strong></td>
                <td><strong>{{ formatPrice(orderTotal) }}</strong></td>
              </tr>
            </tfoot>
          </table>
          
          <div class="order-summary-export">
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">Total Items:</span>
                <span class="value">{{ itemCount }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Total Quantity:</span>
                <span class="value">{{ totalQuantity }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Grand Total:</span>
                <span class="value">{{ formatPrice(orderTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useFabricsStore } from '@/stores/fabrics'
import { useOrdersStore } from '@/stores/orders'

export default {
  name: 'OrderExportModal',
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props) {
    const productsStore = useProductsStore()
    const fabricsStore = useFabricsStore()
    const ordersStore = useOrdersStore()
    const exportTable = ref(null)
    const copySuccess = ref(false)
    
    const orderItems = computed(() => ordersStore.getOrderItemsWithId(props.order.id))
    const itemCount = computed(() => orderItems.value.length)
    const orderTotal = computed(() => 
      orderItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    )
    const totalQuantity = computed(() => 
      orderItems.value.reduce((sum, item) => sum + item.quantity, 0)
    )
    
    const getProductName = (productId) => {
      const product = productsStore.getProductById(productId)
      return product ? product.productName : `Product ${productId}`
    }
    
    const formatPrice = (price) => {
      return `€${price.toFixed(2)}`
    }
    
    const copyTable = async () => {
      try {
        // Create tab-separated values for spreadsheet compatibility
        let tsvContent = "Product ID\tProduct Name\tFabric\tPrice\tQuantity\tLine Total\n"
        
        orderItems.value.forEach(item => {
          const lineTotal = item.price * item.quantity
          tsvContent += `${item.productId}\t${getProductName(item.productId)}\t${item.fabric}\t${formatPrice(item.price)}\t${item.quantity}\t${formatPrice(lineTotal)}\n`
        })
        
        // Add summary row
        tsvContent += `\t\t\tOrder Total\t${totalQuantity.value}\t${formatPrice(orderTotal.value)}\n`
        
        await navigator.clipboard.writeText(tsvContent)
        copySuccess.value = true
        setTimeout(() => {
          copySuccess.value = false
        }, 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
        // Fallback: select table content
        const range = document.createRange()
        range.selectNode(exportTable.value)
        window.getSelection().removeAllRanges()
        window.getSelection().addRange(range)
      }
    }
    
    const printTable = () => {
      // Create a dedicated print page with images
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      
      // Generate HTML for print page
      const printHTML = generatePrintHTML()
      
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // Wait for images to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    }
    
    const generatePrintHTML = () => {
      const orderItemsHTML = orderItems.value.map(item => {
        const productName = getProductName(item.productId)
        const productImage = productsStore.getProductById(item.productId)?.images[0] || ''
        const fabricImage = fabricsStore.getFabricByCode(item.fabric)?.thumbnail_url || ''
        
        return `
          <tr>
            <td>
              <img src="${productImage}" alt="${productName}" class="product-img" onerror="this.style.display='none'">
            </td>
            <td>${item.productId}</td>
            <td class="product-name">${productName}</td>
            <td>
              <div class="fabric-cell">
                <img src="${fabricImage}" alt="${item.fabric}" class="fabric-img" onerror="this.style.display='none'">
                <span>${item.fabric}</span>
              </div>
            </td>
            <td class="price">${formatPrice(item.price)}</td>
            <td class="quantity">${item.quantity}</td>
            <td class="price">${formatPrice(item.price * item.quantity)}</td>
          </tr>
        `
      }).join('')
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order: ${props.order.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3498db;
              padding-bottom: 15px;
            }
            .header h1 {
              font-size: 24px;
              color: #2c3e50;
              margin-bottom: 8px;
            }
            .header-info {
              font-size: 14px;
              color: #7f8c8d;
              display: flex;
              justify-content: center;
              gap: 30px;
            }
            .order-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .order-table th {
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              padding: 8px 4px;
              text-align: left;
              font-weight: 600;
              color: #495057;
            }
            .order-table td {
              border: 1px solid #dee2e6;
              padding: 6px 4px;
              vertical-align: middle;
            }
            .order-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .product-img {
              width: 40px;
              height: 40px;
              object-fit: cover;
              border-radius: 4px;
              display: block;
            }
            .fabric-cell {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .fabric-img {
              width: 30px;
              height: 30px;
              object-fit: cover;
              border-radius: 3px;
              flex-shrink: 0;
            }
            .product-name {
              font-weight: 500;
              max-width: 200px;
              word-wrap: break-word;
            }
            .price, .quantity {
              text-align: right;
              font-weight: 500;
            }
            .summary {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .summary-stats {
              display: flex;
              gap: 30px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 10px;
              color: #6c757d;
              text-transform: uppercase;
              font-weight: 600;
            }
            .summary-value {
              font-size: 14px;
              font-weight: 700;
              color: #2c3e50;
            }
            .total-section {
              text-align: right;
              font-size: 16px;
              font-weight: 700;
              color: #27ae60;
            }
            @media print {
              body { padding: 10px; }
              .order-table { font-size: 10px; }
              .header h1 { font-size: 20px; }
              .product-img { width: 35px; height: 35px; }
              .fabric-img { width: 25px; height: 25px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${props.order.name}</h1>
            <div class="header-info">
              <span><strong>${itemCount.value} Items</strong></span>
              <span><strong>${totalQuantity.value} Total Quantity</strong></span>
              <span><strong>${formatPrice(orderTotal.value)} Total Value</strong></span>
            </div>
          </div>
          
          <table class="order-table">
            <thead>
              <tr>
                <th style="width: 50px;">Image</th>
                <th style="width: 80px;">Product ID</th>
                <th style="width: 200px;">Product Name</th>
                <th style="width: 120px;">Fabric</th>
                <th style="width: 70px;">Price</th>
                <th style="width: 50px;">Qty</th>
                <th style="width: 70px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItemsHTML}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-stats">
              <div class="summary-item">
                <div class="summary-label">Items</div>
                <div class="summary-value">${itemCount.value}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Quantity</div>
                <div class="summary-value">${totalQuantity.value}</div>
              </div>
            </div>
            <div class="total-section">
              TOTAL: ${formatPrice(orderTotal.value)}
            </div>
          </div>
        </body>
        </html>
      `
    }
    
    return {
      exportTable,
      copySuccess,
      orderItems,
      itemCount,
      orderTotal,
      totalQuantity,
      getProductName,
      formatPrice,
      copyTable,
      printTable
    }
  }
}
</script>

<style scoped>
.export-modal .modal-content {
  max-width: 1200px;
  width: 95vw;
  max-height: 90vh;
}

.export-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.copy-status {
  color: #27ae60;
  font-weight: 500;
  font-size: 0.9rem;
}

.export-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.order-header-info {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #3498db;
}

.order-header-info h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.order-meta {
  display: flex;
  justify-content: center;
  gap: 2rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.export-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.export-table th,
.export-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.export-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
}

.export-table tbody tr:hover {
  background-color: #f8f9fa;
}

.summary-row {
  background-color: #f8f9fa !important;
  font-weight: 600;
  border-top: 2px solid #3498db;
}

.summary-row td {
  border-bottom: none;
}

.order-summary-export {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 0.75rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-item .label {
  font-weight: 500;
  color: #6c757d;
}

.summary-item .value {
  font-weight: 600;
  color: #2c3e50;
}

/* Print Styles */
@media print {
  .no-print {
    display: none !important;
  }
  
  .modal {
    position: static;
    background: none;
  }
  
  .modal-content {
    max-width: none;
    width: 100%;
    max-height: none;
    overflow: visible;
    box-shadow: none;
    border-radius: 0;
  }
  
  .export-table-container {
    padding: 0;
  }
  
  .export-table {
    font-size: 0.8rem;
  }
  
  .export-table th,
  .export-table td {
    padding: 0.5rem;
  }
  
  .order-header-info {
    margin-bottom: 1rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .summary-item {
    box-shadow: none;
    border: 1px solid #ddd;
  }
}
</style>