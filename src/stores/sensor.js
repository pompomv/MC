import { defineStore } from 'pinia'
import { usePenStore } from './pens'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db } from '../config/firebase.js' 
export const useSensorStore = defineStore('sensor', {
  state: () => ({
    isConnected: false,
    unsubscribe: null, // Simpan reference untuk unsubscribe
  }),
  
  actions: {
    // Fungsi ini mulai mendengarkan perubahan secara REAL-TIME
    connectWebSocket() {
      // Cek apakah sudah ada listener aktif
      if (this.unsubscribe) {
        console.warn('WebSocket sudah terhubung, skip connect')
        return
      }
      
      // Kita langsung mengawasi folder /current_status di Firebase
      const currentStatusRef = dbRef(db, 'current_status')
      
      // onValue akan MENGIRIMKAN DATA BARU INSTAN setiap kali ESP32 mengirim data
      this.unsubscribe = onValue(currentStatusRef, (snapshot) => {
        this.isConnected = true
        
        if (snapshot.exists()) {
          const data = snapshot.val()
          const penStore = usePenStore()
          
          // Looping data (misal dari kandang_01, kandang_02, dst)
          Object.keys(data).forEach(penId => {
            // Lempar data terbaru ke file pens.js agar layar berkedip/terupdate
            penStore.updatePenRealtimeData(penId, data[penId])
          })
        }
      }, (error) => {
        console.error('Koneksi Firebase terputus / error:', error)
        this.isConnected = false
      })
    },
    
    // Berhenti mengawasi database (biasanya dipanggil saat user logout/tutup web)
    disconnectWebSocket() {
      if (this.unsubscribe) {
        this.unsubscribe() // Panggil function untuk unsubscribe
        this.unsubscribe = null
        this.isConnected = false
      }
    }
  }
})