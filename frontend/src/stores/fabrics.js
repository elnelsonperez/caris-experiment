import { defineStore } from 'pinia'
import fabricsData from '@/data/fabrics.json'

export const useFabricsStore = defineStore('fabrics', {
  state: () => ({
    fabrics: fabricsData,
    searchQuery: ''
  }),
  getters: {
    filteredFabrics: (state) => {
      if (!state.searchQuery) return state.fabrics
      const query = state.searchQuery.toLowerCase()
      return state.fabrics.filter(fabric => 
        fabric.code.toLowerCase().includes(query)
      )
    },
    groupedFabrics: (state) => {
      const filtered = state.searchQuery ? state.filteredFabrics : state.fabrics
      const groups = {}
      
      filtered.forEach(fabric => {
        // Extract material type from code (e.g., "FR AYA 010" -> "AYA")
        const parts = fabric.code.split(' ')
        const materialType = parts.length >= 2 ? parts[1] : 'OTHER'
        
        if (!groups[materialType]) {
          groups[materialType] = []
        }
        groups[materialType].push(fabric)
      })
      
      // Sort groups alphabetically and sort fabrics within each group
      const sortedGroups = {}
      Object.keys(groups).sort().forEach(key => {
        sortedGroups[key] = groups[key].sort((a, b) => a.code.localeCompare(b.code))
      })
      
      return sortedGroups
    },
    getFabricByCode: (state) => (code) => {
      return state.fabrics.find(fabric => fabric.code === code)
    },
    getMaterialTypeFromCode: () => (code) => {
      const parts = code.split(' ')
      return parts.length >= 2 ? parts[1] : 'OTHER'
    }
  },
  actions: {
    setSearchQuery(query) {
      this.searchQuery = query
    }
  }
})