import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

export const usePenStore = defineStore('pens', {
  state: () => ({
    pens: [],
    currentPen: null,
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchPens() {
      this.loading = true
      try {
        const response = await api.get('/pens/')
        this.pens = response.data
      } catch (err) {
        this.error = 'Failed to fetch pens'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    
    async fetchPenDetails(id) {
      this.loading = true
      try {
        const response = await api.get(`/pens/${id}`)
        this.currentPen = response.data
      } catch (err) {
        this.error = `Failed to fetch pen ${id}`
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    
    updatePenDataFromSocket(data) {
      // data is an array of updates
      data.forEach(update => {
        // Update list
        const penInList = this.pens.find(p => p.id === update.pen_id)
        if (penInList) {
          penInList.latest_reading = {
            temperature: update.temperature,
            humidity: update.humidity,
            timestamp: update.timestamp
          }
          penInList.last_status = update.status
        }
        
        // Update current pen if active
        if (this.currentPen && this.currentPen.id === update.pen_id) {
          this.currentPen.latest_reading = {
            temperature: update.temperature,
            humidity: update.humidity,
            timestamp: update.timestamp
          }
          this.currentPen.last_status = update.status
        }
      })
    }
  }
})
