<template>
  <div class="data-management">
    <h1 class="text-2xl font-bold mb-6">Data Management</h1>
    
    <!-- Navigation tabs for different management tools -->
    <div class="tabs mb-8">
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'images' }"
        @click="activeTab = 'images'"
      >
        Image Blacklist
      </button>
      <!-- Future tabs can be added here -->
    </div>

    <!-- Image Blacklist Management -->
    <div v-if="activeTab === 'images'" class="image-blacklist-section">
      <div class="section-header mb-6">
        <h2 class="text-xl font-semibold">Image Blacklist Management</h2>
        <p class="text-gray-600 mt-2">Browse and blacklist images that should not be displayed in the product catalog</p>
        
        <!-- Controls -->
        <div class="controls mt-4">
          <button 
            @click="loadImages"
            class="btn btn-secondary"
            :disabled="loading"
          >
            {{ loading ? 'Loading...' : 'Refresh Images' }}
          </button>
          
          <div class="search-box">
            <input 
              v-model="imageSearchQuery"
              type="text"
              placeholder="Search by product name or image URL..."
              class="search-input"
            />
          </div>
          
          <div class="filter-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="showOnlyBlacklisted" />
              Show only blacklisted
            </label>
          </div>
          
          <button 
            @click="saveSettings"
            class="btn btn-primary"
            :disabled="!hasChanges || saving"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Images Grid -->
      <div class="images-grid">
        <div 
          v-for="imageItem in filteredImages" 
          :key="imageItem.url"
          class="image-item"
          :class="{ 'blacklisted': isBlacklisted(imageItem.url) }"
        >
          <div class="image-container">
            <img 
              :src="imageItem.url" 
              :alt="imageItem.productName"
              @error="onImageError($event, imageItem.url)"
              @click="openImageModal(imageItem)"
              loading="lazy"
              class="clickable-image"
            />
            <div class="image-overlay">
              <button 
                @click.stop="toggleBlacklist(imageItem.url)"
                class="blacklist-btn"
                :class="isBlacklisted(imageItem.url) ? 'remove' : 'add'"
              >
                {{ isBlacklisted(imageItem.url) ? 'Unblacklist' : 'Blacklist' }}
              </button>
              <button 
                @click.stop="openImageModal(imageItem)"
                class="view-btn"
              >
                View Full Size
              </button>
            </div>
          </div>
          
          <div class="image-info">
            <h3 class="product-name">{{ imageItem.productName }}</h3>
            <p class="image-url">{{ truncateUrl(imageItem.url) }}</p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && filteredImages.length === 0" class="empty-state">
        <p>No images found matching your criteria.</p>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <p>Loading images...</p>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="selectedImage" class="image-modal" @click.self="closeImageModal">
      <div class="modal-content-image">
        <div class="modal-header-image">
          <h3>{{ selectedImage.productName }}</h3>
          <button @click="closeImageModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body-image">
          <img 
            :src="selectedImage.url" 
            :alt="selectedImage.productName"
            @error="onImageError($event, selectedImage.url)"
            class="full-size-image"
          />
          <div class="image-details">
            <p><strong>Product:</strong> {{ selectedImage.productName }}</p>
            <p><strong>Product ID:</strong> {{ selectedImage.productId }}</p>
            <p><strong>URL:</strong> <a :href="selectedImage.url" target="_blank">{{ selectedImage.url }}</a></p>
            <p><strong>Status:</strong> 
              <span :class="isBlacklisted(selectedImage.url) ? 'status-blacklisted' : 'status-active'">
                {{ isBlacklisted(selectedImage.url) ? 'Blacklisted' : 'Active' }}
              </span>
            </p>
          </div>
        </div>
        <div class="modal-footer-image">
          <button 
            @click="toggleBlacklist(selectedImage.url)"
            class="btn"
            :class="isBlacklisted(selectedImage.url) ? 'btn-success' : 'btn-danger'"
          >
            {{ isBlacklisted(selectedImage.url) ? 'Unblacklist Image' : 'Blacklist Image' }}
          </button>
          <button @click="closeImageModal" class="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useProductsStore } from '@/stores/products'

export default {
  name: 'DataManagementView',
  data() {
    return {
      activeTab: 'images',
      loading: false,
      saving: false,
      imageSearchQuery: '',
      showOnlyBlacklisted: false,
      allImages: [],
      blacklistedUrls: new Set(),
      originalBlacklistedUrls: new Set(),
      hasChanges: false,
      selectedImage: null
    }
  },
  computed: {
    filteredImages() {
      let images = this.allImages
      
      // Filter by search query
      if (this.imageSearchQuery) {
        const query = this.imageSearchQuery.toLowerCase()
        images = images.filter(item => 
          item.productName.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
        )
      }
      
      // Filter by blacklist status
      if (this.showOnlyBlacklisted) {
        images = images.filter(item => this.isBlacklisted(item.url))
      }
      
      return images
    }
  },
  methods: {
    async loadImages() {
      this.loading = true
      try {
        const productsStore = useProductsStore()
        const allImages = []
        
        // Extract all images from products
        productsStore.products.forEach(product => {
          // Add product images only (exclude dimensionsImage)
          if (product.images) {
            product.images.forEach(imageUrl => {
              allImages.push({
                url: imageUrl,
                productName: product.productName,
                productId: product.productId,
                type: 'product'
              })
            })
          }
        })
        
        this.allImages = allImages
        await this.loadSettings()
      } catch (error) {
        console.error('Failed to load images:', error)
        alert('Failed to load images. Please try again.')
      } finally {
        this.loading = false
      }
    },
    
    async loadSettings() {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          this.blacklistedUrls = new Set(settings.blacklistedImages || [])
          this.originalBlacklistedUrls = new Set(settings.blacklistedImages || [])
          this.hasChanges = false
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    },
    
    async saveSettings() {
      this.saving = true
      try {
        const settings = {
          blacklistedImages: Array.from(this.blacklistedUrls)
        }
        
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        })
        
        if (response.ok) {
          this.originalBlacklistedUrls = new Set(this.blacklistedUrls)
          this.hasChanges = false
          
          // Refresh the products store blacklist
          const productsStore = useProductsStore()
          await productsStore.refreshBlacklist()
          
          alert('Settings saved successfully!')
        } else {
          throw new Error('Failed to save settings')
        }
      } catch (error) {
        console.error('Failed to save settings:', error)
        alert('Failed to save settings. Please try again.')
      } finally {
        this.saving = false
      }
    },
    
    toggleBlacklist(url) {
      if (this.blacklistedUrls.has(url)) {
        this.blacklistedUrls.delete(url)
      } else {
        this.blacklistedUrls.add(url)
      }
      this.checkForChanges()
    },
    
    isBlacklisted(url) {
      return this.blacklistedUrls.has(url)
    },
    
    checkForChanges() {
      const current = Array.from(this.blacklistedUrls).sort()
      const original = Array.from(this.originalBlacklistedUrls).sort()
      this.hasChanges = JSON.stringify(current) !== JSON.stringify(original)
    },
    
    truncateUrl(url) {
      if (url.length > 60) {
        return url.substring(0, 57) + '...'
      }
      return url
    },
    
    onImageError(event, url) {
      event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="100" y="100" text-anchor="middle" dominant-baseline="middle" fill="%236b7280" font-size="14"%3EImage not found%3C/text%3E%3C/svg%3E'
    },
    
    openImageModal(imageItem) {
      this.selectedImage = imageItem
    },
    
    closeImageModal() {
      this.selectedImage = null
    }
  },
  
  async mounted() {
    await this.loadImages()
  }
}
</script>

<style scoped>
.data-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.tabs {
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  margin-right: 1rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #374151;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.controls {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  width: 300px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.image-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.image-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.image-item.blacklisted {
  border-color: #ef4444;
  background: #fef2f2;
}

.image-container {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clickable-image {
  cursor: pointer;
}

.clickable-image:hover {
  transform: scale(1.02);
  transition: transform 0.2s;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.blacklist-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.blacklist-btn.add {
  background: #ef4444;
  color: white;
}

.blacklist-btn.remove {
  background: #10b981;
  color: white;
}

.view-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  background: #3b82f6;
  color: white;
}

.view-btn:hover {
  background: #2563eb;
}

.image-info {
  padding: 1rem;
}

.product-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.image-url {
  font-size: 0.875rem;
  color: #6b7280;
  word-break: break-all;
}

.empty-state,
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

/* Image Modal Styles */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content-image {
  background: white;
  border-radius: 0.5rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header-image {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: between;
  align-items: center;
}

.modal-header-image h3 {
  margin: 0;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  margin-left: 1rem;
}

.close-btn:hover {
  color: #374151;
}

.modal-body-image {
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.full-size-image {
  max-width: 60%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
}

.image-details {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: #f9fafb;
}

.image-details p {
  margin-bottom: 1rem;
}

.image-details a {
  color: #3b82f6;
  text-decoration: underline;
  word-break: break-all;
}

.status-blacklisted {
  color: #ef4444;
  font-weight: 600;
}

.status-active {
  color: #10b981;
  font-weight: 600;
}

.modal-footer-image {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .modal-body-image {
    flex-direction: column;
  }
  
  .full-size-image {
    max-width: 100%;
    max-height: 50vh;
  }
  
  .modal-footer-image {
    flex-direction: column;
  }
}
</style>