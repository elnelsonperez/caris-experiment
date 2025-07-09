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
    getFabricByCode: (state) => (code) => {
      return state.fabrics.find(fabric => fabric.code === code)
    }
  },
  actions: {
    setSearchQuery(query) {
      this.searchQuery = query
    }
  }
})