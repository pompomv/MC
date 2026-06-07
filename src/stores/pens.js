import { defineStore } from 'pinia'
import { ref as dbRef, get, query, limitToLast, update, push } from 'firebase/database'
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
        const snapshot = await get(dbRef(db, 'kandang'))
        if (snapshot.exists()) {
          // Inject key as id so p.id === penId works in updatePenRealtimeData
          const data = snapshot.val()
          this.pens = Object.entries(data).map(([key, val]) => ({ ...val, id: val.id || key }))
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
        const snapshot = await get(dbRef(db, `kandang/${id}`))
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
          // logs bisa berupa object atau array
          const val = snapshot.val()
          return Array.isArray(val) ? val : Object.values(val)
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
        await update(dbRef(db, `kandang/${id}`), { is_monitoring: true })
        await this.fetchPens()
      } catch (err) {
        console.error(`Gagal memulai monitoring ${id}:`, err)
      }
    },

    async shutdownPen(id) {
      try {
        await update(dbRef(db, `kandang/${id}`), { is_monitoring: false })
        await this.fetchPens()
      } catch (err) {
        console.error(`Gagal mematikan monitoring ${id}:`, err)
      }
    },

    // Menyimpan aktivitas manual (Pakan & Panen)
    async saveActivity(penId, payload) {
      try {
        const activitiesRef = dbRef(db, `activities/${penId}`)
        // push() akan membuat key unik otomatis
        await push(activitiesRef, payload)
        return true
      } catch (err) {
        console.error(`Gagal menyimpan aktivitas untuk ${penId}:`, err)
        return false
      }
    },

    // Menarik riwayat aktivitas manual
    async fetchActivities(penId) {
      try {
        const activitiesQuery = query(dbRef(db, `activities/${penId}`), limitToLast(50))
        const snapshot = await get(activitiesQuery)
        if (snapshot.exists()) {
          const data = snapshot.val()
          // Konversi dari object ke array dan urutkan dari terbaru
          return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).sort((a, b) => b.timestamp - a.timestamp)
        }
        return []
      } catch (err) {
        console.error(`Gagal menarik riwayat aktivitas ${penId}:`, err)
        return []
      }
    },
    
    // Fungsi ini akan dipanggil otomatis oleh sensor.js setiap ada data baru
    updatePenRealtimeData(penId, sensorData) {
      const newReading = {
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        timestamp: sensorData.last_updated || sensorData.timestamp
      }

      const calcStatus = (pen, t, h) => {
        // Gunakan last_status dari payload jika ada (dikirim dari /kandang listener)
        if (sensorData.last_status) return sensorData.last_status
        // Fallback: hitung dari threshold
        if (pen && pen.thresholds) {
          const th = pen.thresholds
          return (t < th.temp_min || t > th.temp_max || h < th.humidity_min || h > th.humidity_max)
            ? 'Critical' : 'Normal'
        }
        return 'Normal'
      }

      // 1. Update data di List Beranda (Dashboard)
      const penInList = this.pens.find(p => p.id === penId)
      if (penInList) {
        penInList.latest_reading = newReading
        penInList.last_status = calcStatus(penInList, sensorData.temperature, sensorData.humidity)
      }

      // 2. Update data di Halaman Detail (jika sedang dibuka)
      if (this.currentPen && this.currentPen.id === penId) {
        this.currentPen.latest_reading = newReading
        this.currentPen.last_status = calcStatus(this.currentPen, sensorData.temperature, sensorData.humidity)
      }
    }
  }
})