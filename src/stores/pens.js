import { defineStore } from 'pinia'
import { ref as dbRef, get, query, limitToLast, update } from 'firebase/database'
import { db } from '../config/firebase.js' // Pastikan path ini mengarah ke file firebaseConfig Anda

export const usePenStore = defineStore('pens', {
  state: () => ({
    pens: [],
    currentPen: null,
    loading: false,
    error: null
  }),
  
  actions: {
    // Mengambil daftar metadata kandang dari node /pens
    async fetchPens() {
      this.loading = true
      try {
        const snapshot = await get(dbRef(db, 'pens'))
        if (snapshot.exists()) {
          // Mengubah object JSON Tree dari Firebase menjadi Array agar bisa dilooping di tabel Vue
          this.pens = Object.values(snapshot.val())
        } else {
          this.pens = []
        }
      } catch (err) {
        this.error = 'Gagal mengambil data kandang dari Firebase'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    
    // Mengambil data detail satu kandang berdasarkan ID
    async fetchPenDetails(id) {
      this.loading = true
      try {
        const snapshot = await get(dbRef(db, `pens/${id}`))
        if (snapshot.exists()) {
          this.currentPen = snapshot.val()
        }
      } catch (err) {
        this.error = `Gagal mengambil detail kandang ${id}`
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    
    // Mengambil log riwayat pembacaan sensor (dibatasi 100 data terbaru agar ringan)
    async fetchPenReadings(id) {
      try {
        const logsQuery = query(dbRef(db, `logs/${id}`), limitToLast(100))
        const snapshot = await get(logsQuery)
        if (snapshot.exists()) {
          return Object.values(snapshot.val())
        }
        return []
      } catch (err) {
        console.error(`Gagal mengambil riwayat untuk kandang ${id}:`, err)
        return []
      }
    },

    async fetchPenLogs(id) {
      return await this.fetchPenReadings(id)
    },

    async startMonitoring(id) {
      try {
        await update(dbRef(db, `pens/${id}`), { is_monitoring: true })
        await this.fetchPens()
      } catch (err) {
        console.error(`Gagal memulai monitoring ${id}:`, err)
      }
    },

    async shutdownPen(id) {
      try {
        await update(dbRef(db, `pens/${id}`), { is_monitoring: false })
        await this.fetchPens()
      } catch (err) {
        console.error(`Gagal mematikan monitoring ${id}:`, err)
      }
    },
    
    // Fungsi ini akan dipanggil otomatis oleh sensor.js setiap ada data baru
    updatePenRealtimeData(penId, sensorData) {
      // 1. Update data di List Beranda (Dashboard)
      const penInList = this.pens.find(p => p.id === penId)
      if (penInList) {
        penInList.latest_reading = {
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          timestamp: sensorData.last_updated || sensorData.timestamp
        }
        // Hitung status kritis otomatis berdasarkan threshold
        if (penInList.thresholds) {
            const t = sensorData.temperature
            const h = sensorData.humidity
            const th = penInList.thresholds
            const isCritical = t < th.temp_min || t > th.temp_max || h < th.humidity_min || h > th.humidity_max
            penInList.last_status = isCritical ? 'Critical' : 'Normal'
        }
      }
      
      // 2. Update data di Halaman Detail (Jika sedang dibuka)
      if (this.currentPen && this.currentPen.id === penId) {
        this.currentPen.latest_reading = {
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          timestamp: sensorData.last_updated || sensorData.timestamp
        }
         if (this.currentPen.thresholds) {
            const t = sensorData.temperature
            const h = sensorData.humidity
            const th = this.currentPen.thresholds
            const isCritical = t < th.temp_min || t > th.temp_max || h < th.humidity_min || h > th.humidity_max
            this.currentPen.last_status = isCritical ? 'Critical' : 'Normal'
        }
      }
    }
  }
})