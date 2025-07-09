<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Select Fabric</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <!-- Search -->
        <div class="mb-3">
          <input 
            v-model="searchQuery"
            type="text" 
            class="form-control"
            placeholder="Search fabrics by code..."
          >
        </div>
        
        <!-- Fabric Grid -->
        <div class="fabric-grid">
          <div 
            v-for="fabric in filteredFabrics" 
            :key="fabric.code"
            class="fabric-item"
            @click="selectFabric(fabric)"
          >
            <div class="fabric-image-container">
              <img 
                :src="fabric.high_res_url" 
                :alt="fabric.alt_text"
                class="fabric-image"
                @error="handleImageError"
              >
            </div>
            <div class="fabric-info">
              <div class="fabric-code">{{ fabric.code }}</div>
            </div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="filteredFabrics.length === 0" class="text-center p-4">
          <p class="text-muted">No fabrics found matching your search.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useFabricsStore } from '@/stores/fabrics'

export default {
  name: 'FabricPicker',
  emits: ['fabric-selected', 'close'],
  setup(props, { emit }) {
    const fabricsStore = useFabricsStore()
    
    const searchQuery = computed({
      get: () => fabricsStore.searchQuery,
      set: (value) => fabricsStore.setSearchQuery(value)
    })
    
    const filteredFabrics = computed(() => fabricsStore.filteredFabrics)
    
    const selectFabric = (fabric) => {
      emit('fabric-selected', fabric)
    }
    
    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
    }
    
    return {
      searchQuery,
      filteredFabrics,
      selectFabric,
      handleImageError
    }
  }
}
</script>

<style scoped>
.modal-content {
  max-width: 1200px;
  width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fabric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 1rem 0;
  flex: 1;
  overflow-y: auto;
  align-items: start;
  justify-items: stretch;
}

.fabric-item {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 300px;
}

.fabric-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.fabric-item:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fabric-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: #f8f9fa;
  min-height: 0;
}

.fabric-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
  background-color: white;
}

.fabric-info {
  padding: 0.5rem 0.75rem;
  background: #2c3e50;
  border-top: 1px solid #f1f3f4;
  flex-shrink: 0;
}

.fabric-code {
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Custom Scrollbar */
.fabric-grid::-webkit-scrollbar {
  width: 8px;
}

.fabric-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.fabric-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.fabric-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Search input styling */
.form-control {
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Modal header enhancement */
.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid #f1f3f4;
}

.modal-header h3 {
  color: #2c3e50;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f8f9fa;
  color: #495057;
}

/* Empty state */
.text-center {
  text-align: center;
}

.text-muted {
  color: #6c757d;
  font-style: italic;
}
</style>