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
          <div class="export-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="includePrices" />
              Include Prices
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeNotes" />
              Include Notes
            </label>
          </div>
          <div v-if="copySuccess" class="copy-status">✓ Copied to clipboard!</div>
        </div>
        
        <div class="export-table-container">
          <div class="order-header-info">
            <h2>{{ order.name }}</h2>
            <div class="order-meta">
              <span>{{ itemCount }} items</span>
              <span v-if="includePrices">{{ formatPrice(orderTotal) }}</span>
            </div>
          </div>
          
          <table class="export-table" ref="exportTable">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Fabric</th>
                <th v-if="includePrices">Price</th>
                <th>Quantity</th>
                <th v-if="includePrices">Line Total</th>
                <th v-if="includeNotes">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in orderItems" :key="item.itemId">
                <td>{{ item.productId }}</td>
                <td>{{ getProductName(item.productId) }}</td>
                <td>{{ Array.isArray(item.fabric) && item.fabric.length > 0 ? item.fabric.join(', ') : item.fabric || '' }}</td>
                <td v-if="includePrices">{{ formatPrice(item.price) }}</td>
                <td>{{ item.quantity }}</td>
                <td v-if="includePrices">{{ formatPrice(item.price * item.quantity) }}</td>
                <td v-if="includeNotes">{{ item.notes || '-' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="summary-row">
                <td :colspan="getColSpan()"><strong>Order Total</strong></td>
                <td><strong>{{ totalQuantity }}</strong></td>
                <td v-if="includePrices"><strong>{{ formatPrice(orderTotal) }}</strong></td>
                <td v-if="includeNotes && !includePrices"></td>
              </tr>
            </tfoot>
          </table>
          
          <div class="order-summary-export">
            <div class="summary-grid" :class="{ 'two-columns': !includePrices }">
              <div class="summary-item">
                <span class="label">Total Items:</span>
                <span class="value">{{ itemCount }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Total Quantity:</span>
                <span class="value">{{ totalQuantity }}</span>
              </div>
              <div v-if="includePrices" class="summary-item">
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
    const includePrices = ref(true)
    const includeNotes = ref(true)
    
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
    
    const getColSpan = () => {
      let cols = 3 // Product ID, Product Name, Fabric
      if (includePrices.value) cols += 1 // Price column
      return cols
    }
    
    const copyTable = async () => {
      try {
        // Create tab-separated values for spreadsheet compatibility
        let tsvContent = ''
        
        // Build header
        tsvContent += 'Product ID\tProduct Name\tFabric'
        if (includePrices.value) tsvContent += '\tPrice'
        tsvContent += '\tQuantity'
        if (includePrices.value) tsvContent += '\tLine Total'
        if (includeNotes.value) tsvContent += '\tNotes'
        tsvContent += '\n'
        
        orderItems.value.forEach(item => {
          let row = `${item.productId}\t${getProductName(item.productId)}\t${Array.isArray(item.fabric) ? item.fabric.join(', ') : item.fabric}`
          if (includePrices.value) row += `\t${formatPrice(item.price)}`
          row += `\t${item.quantity}`
          if (includePrices.value) row += `\t${formatPrice(item.price * item.quantity)}`
          if (includeNotes.value) row += `\t${item.notes || ''}`
          tsvContent += row + '\n'
        })
        
        // Add summary row
        let summaryRow = '\t\t\tOrder Total\t' + totalQuantity.value
        if (includePrices.value) summaryRow += `\t${formatPrice(orderTotal.value)}`
        if (includeNotes.value) summaryRow += '\t'
        tsvContent += summaryRow + '\n'
        
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
        
        // Handle fabric arrays
        const fabricArray = Array.isArray(item.fabric) ? item.fabric.filter(f => f) : (item.fabric ? [item.fabric] : [])
        const fabricImagesHTML = fabricArray.map(fabricCode => {
          const fabricImage = fabricsStore.getFabricByCode(fabricCode)?.thumbnail_url || ''
          return `<img src="${fabricImage}" alt="${fabricCode}" class="fabric-img" onerror="this.style.display='none'">`
        }).join('')
        const fabricText = fabricArray.join(', ')
        
        let rowHTML = `
          <tr>
            <td>
              <img src="${productImage}" alt="${productName}" class="product-img" onerror="this.style.display='none'">
            </td>
            <td>${item.productId}</td>
            <td class="product-name">${productName}</td>
            <td>
              <div class="fabric-cell">
                ${fabricImagesHTML}
                <span>${fabricText}</span>
              </div>
            </td>`
        
        if (includePrices.value) {
          rowHTML += `<td class="price">${formatPrice(item.price)}</td>`
        }
        
        rowHTML += `<td class="quantity">${item.quantity}</td>`
        
        if (includePrices.value) {
          rowHTML += `<td class="price">${formatPrice(item.price * item.quantity)}</td>`
        }
        
        if (includeNotes.value) {
          rowHTML += `<td class="notes">${item.notes || '-'}</td>`
        }
        
        rowHTML += `</tr>`
        
        return rowHTML
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
              width: 80px;
              height: 80px;
              object-fit: cover;
              border-radius: 4px;
              display: block;
            }
            .fabric-cell {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
            }
            .fabric-img {
              width: 60px;
              height: 60px;
              object-fit: cover;
              border-radius: 3px;
              flex-shrink: 0;
              margin-right: 4px;
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
              .product-img { width: 60px; height: 60px; }
              .fabric-img { width: 45px; height: 45px; margin-right: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${props.order.name}</h1>
            <div class="header-info">
              <span><strong>${itemCount.value} Items</strong></span>
              <span><strong>${totalQuantity.value} Total Quantity</strong></span>
              ${includePrices.value ? `<span><strong>${formatPrice(orderTotal.value)} Total Value</strong></span>` : ''}
            </div>
          </div>
          
          <table class="order-table">
            <thead>
              <tr>
                <th style="width: 90px;">Image</th>
                <th style="width: 80px;">Product ID</th>
                <th style="width: 180px;">Product Name</th>
                <th style="width: 140px;">Fabric</th>
                ${includePrices.value ? '<th style="width: 70px;">Price</th>' : ''}
                <th style="width: 50px;">Qty</th>
                ${includePrices.value ? '<th style="width: 70px;">Total</th>' : ''}
                ${includeNotes.value ? '<th style="width: 150px;">Notes</th>' : ''}
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
            ${includePrices.value ? `<div class="total-section">TOTAL: ${formatPrice(orderTotal.value)}</div>` : ''}
          </div>
        </body>
        </html>
      `
    }
    
    return {
      exportTable,
      copySuccess,
      includePrices,
      includeNotes,
      orderItems,
      itemCount,
      orderTotal,
      totalQuantity,
      getProductName,
      formatPrice,
      getColSpan,
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

.export-options {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
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

.summary-grid.two-columns {
  grid-template-columns: repeat(2, 1fr);
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