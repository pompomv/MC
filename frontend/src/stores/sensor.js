import { defineStore } from 'pinia'
import { usePenStore } from './pens'

export const useSensorStore = defineStore('sensor', {
  state: () => ({
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  }),
  
  actions: {
    connectWebSocket() {
      if (this.socket) {
        this.socket.close()
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      // Use standard location port if proxy is used in production, or hardcoded for dev
      const wsUrl = import.meta.env.DEV 
        ? 'ws://localhost:8000/ws/sensors'
        : `${protocol}//${window.location.host}/ws/sensors`
        
      this.socket = new WebSocket(wsUrl)
      
      this.socket.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        console.log('WebSocket connected')
      }
      
      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'SENSOR_UPDATE') {
            const penStore = usePenStore()
            penStore.updatePenDataFromSocket(payload.data)
          }
        } catch (e) {
          console.error('Error parsing WS message', e)
        }
      }
      
      this.socket.onclose = () => {
        this.isConnected = false
        console.log('WebSocket disconnected')
        this.attemptReconnect()
      }
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    },
    
    attemptReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
        setTimeout(() => {
          this.connectWebSocket()
        }, 3000 * this.reconnectAttempts)
      } else {
        console.error('Max reconnect attempts reached. Please refresh the page.')
      }
    },
    
    disconnectWebSocket() {
      if (this.socket) {
        this.socket.close()
        this.socket = null
      }
    }
  }
})
