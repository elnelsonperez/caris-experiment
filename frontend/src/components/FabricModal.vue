<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content fabric-modal">
      <div class="modal-header">
        <h3>{{ fabric.code }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="fabric-display">
          <div class="fabric-image-container">
            <img 
              :src="fabric.high_res_url" 
              :alt="fabric.alt_text"
              class="fabric-image"
              @error="handleImageError"
            >
          </div>
          <div class="fabric-details">
            <div class="detail-row">
              <span class="detail-label">Fabric Code:</span>
              <span class="detail-value">{{ fabric.code }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Alt Text:</span>
              <span class="detail-value">{{ fabric.alt_text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FabricModal',
  props: {
    fabric: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup() {
    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
    }
    
    return {
      handleImageError
    }
  }
}
</script>

<style scoped>
.fabric-modal .modal-content {
  max-width: 800px;
  width: 90vw;
  max-height: 90vh;
}

.fabric-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.fabric-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  min-height: 400px;
}

.fabric-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.fabric-details {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.detail-value {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid #f1f3f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: #2c3e50;
  font-weight: 600;
  margin: 0;
  font-size: 1.25rem;
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

.modal-body {
  padding: 1.5rem;
  max-height: calc(90vh - 100px);
  overflow-y: auto;
}
</style>