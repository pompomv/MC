import { defineStore } from 'pinia'
import { usePenStore } from './pens'
import { useNotifStore } from './notif'
import { ref as dbRef, onValue } from 'firebase/database'
import { db } from '../config/firebase.js'

export const useSensorStore = defineStore('sensor', {
  state: () => ({
    isConnected: false,
    unsubscribe: null,
    // Simpan status terakhir tiap kandang agar tidak spam notifikasi
    lastKnownStatus: {}
  }),

  actions: {
    connectWebSocket() {
      if (this.unsubscribe) {
        console.warn('Listener sudah aktif, skip connect')
        return
      }

      const penStore = usePenStore()
      const notifStore = useNotifStore()

      // Hanya mendengarkan /kandang — sumber data utama
      const kandangRef = dbRef(db, 'kandang')
      this.unsubscribe = onValue(kandangRef, (snapshot) => {
        this.isConnected = true
        if (snapshot.exists()) {
          const data = snapshot.val()
          Object.entries(data).forEach(([penId, penData]) => {
            if (penData.latest_reading) {
              const status = penData.last_status || 'Normal'
              const temp = penData.latest_reading.temperature
              const hum = penData.latest_reading.humidity

              penStore.updatePenRealtimeData(penId, {
                temperature: temp,
                humidity: hum,
                last_status: status,
                last_updated: penData.latest_reading.timestamp || null
              })

              // ── Notifikasi: hanya muncul jika status BERUBAH jadi Warning/Critical ──
              const prevStatus = this.lastKnownStatus[penId]
              if (status !== prevStatus) {
                this.lastKnownStatus[penId] = status

                if (status === 'Warning') {
                  notifStore.push({
                    type: 'warning',
                    title: `⚠️ Peringatan — ${penId}`,
                    message: `Suhu ${temp}°C / Kelembaban ${hum}% mendekati batas threshold!`
                  })
                } else if (status === 'Critical') {
                  notifStore.push({
                    type: 'critical',
                    title: `🚨 KRITIS — ${penId}`,
                    message: `Suhu ${temp}°C / Kelembaban ${hum}% melebihi batas aman! Segera periksa kandang.`
                  })
                }
              }
            }
          })
        }
      }, (error) => {
        console.error('Error listener /kandang:', error)
        this.isConnected = false
      })
    },

    disconnectWebSocket() {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
        this.isConnected = false
      }
    }
  }
})