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
    
    async fetchPenReadings(id, hours = 24) {
      try {
        const response = await api.get(`/pens/${id}/readings?hours=${hours}&limit=100`)
        return response.data
      } catch (err) {
        console.error(`Failed to fetch readings for pen ${id}:`, err)
        return []
      }
    },

    async fetchPenLogs(id, limit = 20) {
      try {
        const response = await api.get(`/pens/${id}/logs?limit=${limit}`)
        return response.data
      } catch (err) {
        console.error(`Failed to fetch logs for pen ${id}:`, err)
        return []
      }
    },

    async startMonitoring(id) {
      try {
        await api.post(`/pens/${id}/monitor`)
        await this.fetchPens() // Refresh list to get updated is_monitoring states
      } catch (err) {
        console.error(`Failed to start monitoring pen ${id}:`, err)
      }
    },

    async shutdownPen(id) {
      try {
        await api.post(`/pens/${id}/shutdown`)
        await this.fetchPens() // Refresh list
      } catch (err) {
        console.error(`Failed to shutdown pen ${id}:`, err)
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
