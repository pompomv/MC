<template>
  <div class="dashboard-container">
    <div class="overview-grid">
      <div class="overview-card">
        <div class="card-icon temp">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
          </svg>
        </div>
        <div class="card-info">
          <span>Suhu Kandang Utama</span>
          <h2 v-if="mainPen && mainPen.latest_reading">
            {{ mainPen.latest_reading.temperature }}°C
          </h2>
          <h2 v-else class="loading-text">Memuat...</h2>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon humidity">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7Z"/>
          </svg>
        </div>
        <div class="card-info">
          <span>Kelembaban Kandang Utama</span>
          <h2 v-if="mainPen && mainPen.latest_reading">
            {{ mainPen.latest_reading.humidity }}%
          </h2>
          <h2 v-else class="loading-text">Memuat...</h2>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon status">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
        </div>
        <div class="card-info">
          <span>Status Sistem</span>
          <h2 v-if="mainPen" :class="statusClass">
            {{ mainPen.last_status || 'Normal' }}
          </h2>
          <h2 v-else class="loading-text">Memuat...</h2>
        </div>
      </div>
    </div>

    <div class="main-grid">
      <div v-if="mainPen" class="monitor-card">
        <div class="card-header">
          <div>
            <h3>{{ mainPen.name }}</h3>
            <p class="location">{{ mainPen.location }}</p>
          </div>
          <span class="badge" :class="statusClass">
            {{ mainPen.last_status || 'Normal' }}
          </span>
        </div>

        <div class="metrics-display">
          <div class="metric-row">
            <div class="metric-meta">
              <span class="metric-label">Suhu Kandang</span>
              <span class="metric-value" v-if="mainPen.latest_reading">
                {{ mainPen.latest_reading.temperature }}°C
              </span>
            </div>
            <div class="progress-container">
              <div 
                class="progress-bar temp-bar" 
                :style="{ width: tempPercentage + '%' }"
                :class="{ 'bar-danger': isTempCritical }"
              ></div>
            </div>
            <div class="threshold-meta" v-if="mainPen.thresholds">
              <span>Min: {{ mainPen.thresholds.temp_min }}°C</span>
              <span>Max: {{ mainPen.thresholds.temp_max }}°C</span>
            </div>
          </div>

          <div class="metric-row">
            <div class="metric-meta">
              <span class="metric-label">Kelembaban</span>
              <span class="metric-value" v-if="mainPen.latest_reading">
                {{ mainPen.latest_reading.humidity }}%
              </span>
            </div>
            <div class="progress-container">
              <div 
                class="progress-bar hum-bar" 
                :style="{ width: humPercentage + '%' }"
                :class="{ 'bar-danger': isHumCritical }"
              ></div>
            </div>
            <div class="threshold-meta" v-if="mainPen.thresholds">
              <span>Min: {{ mainPen.thresholds.humidity_min }}%</span>
              <span>Max: {{ mainPen.thresholds.humidity_max }}%</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <router-link :to="`/pens/${mainPen.id}`" class="btn-primary">
            Lihat Detail Grafik & Log
          </router-link>
        </div>
      </div>

      <div v-else class="loading-panel">
        <div class="spinner"></div>
        <p>Menghubungkan ke Realtime Database Firebase...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { usePenStore } from '@/stores/pens'
import { useSensorStore } from '@/stores/sensor'

// Memanggil manajemen state global Pinia
const penStore = usePenStore()
const sensorStore = useSensorStore()

// 1. MENGAMBIL DATA SECARA REAKTIF DARI PINIA (FIREBASE STREAM)
const mainPen = computed(() => {
  return penStore.pens.find(p => p.id === 'kandang_01') || null
})

// 2. LOGIKA KELAS DINAMIS UNTUK WARNING WARNA MERAH/HIJAU
const statusClass = computed(() => {
  if (!mainPen.value) return 'status-normal'
  return mainPen.value.last_status === 'Critical' ? 'status-critical' : 'status-normal'
})

// 3. LOGIKA VALIDASI CRITICAL UNTUK PROGRESS BAR
const isTempCritical = computed(() => {
  if (!mainPen.value || !mainPen.value.latest_reading || !mainPen.value.thresholds) return false
  const t = mainPen.value.latest_reading.temperature
  const th = mainPen.value.thresholds
  return t < th.temp_min || t > th.temp_max
})

const isHumCritical = computed(() => {
  if (!mainPen.value || !mainPen.value.latest_reading || !mainPen.value.thresholds) return false
  const h = mainPen.value.latest_reading.humidity
  const th = mainPen.value.thresholds
  return h < th.humidity_min || h > th.humidity_max
})

// 4. MENGHITUNG PERSENTASE BAR AGAR BERGERAK DINAMIS
const tempPercentage = computed(() => {
  if (!mainPen.value || !mainPen.value.latest_reading) return 0
  // Membatasi grafik suhu antara rentang maksimal 50 derajat agar pas di layar
  const currentTemp = mainPen.value.latest_reading.temperature
  return Math.min(Math.max((currentTemp / 50) * 100, 0), 100)
})

const humPercentage = computed(() => {
  if (!mainPen.value || !mainPen.value.latest_reading) return 0
  return Math.min(Math.max(mainPen.value.latest_reading.humidity, 0), 100)
})

// 5. LIFECYCLE: CONNECT KE CLOUD SAAT HALAMAN DIBUKA
onMounted(async () => {
  // Ambil data metadata awal /pens dari Firebase
  await penStore.fetchPens()
  // Nyalakan listener onValue untuk /current_status dari ESP32
  sensorStore.connectWebSocket()
})

onUnmounted(() => {
  // Putuskan stream data saat peternak menutup web/pindah halaman agar hemat data
  sensorStore.disconnectWebSocket()
})
</script>

<style scoped>
/* Seluruh CSS Dashboard Anda tetap dipertahankan dan dioptimalkan */
.dashboard-container {
  padding: 1.5rem;
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.overview-card {
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}
.card-icon svg { width: 100%; height: 100%; }
.temp { background: #fee2e2; color: #ef4444; }
.humidity { background: #e0f2fe; color: #0ea5e9; }
.status { background: #dcfce7; color: #22c55e; }
.card-info span { font-size: 0.875rem; color: #64748b; font-weight: 500; }
.card-info h2 { margin: 0; font-size: 1.5rem; color: #1e293b; margin-top: 0.25rem; }
.main-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
.monitor-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}
.card-header h3 { margin: 0; font-size: 1.25rem; color: #1e293b; }
.location { margin: 0; font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
.badge { padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.status-normal { background: #dcfce7; color: #15803d; }
.status-critical { background: #fee2e2; color: #b91c1c; animation: pulse 2s infinite; }
.metrics-display { display: flex; flex-direction: column; gap: 1.5rem; }
.metric-meta { display: flex; justify-content: space-between; font-weight: 600; }
.metric-label { color: #475569; }
.metric-value { color: #1e293b; font-size: 1.125rem; }
.progress-container { background: #e2e8f0; height: 8px; border-radius: 9999px; overflow: hidden; margin-top: 0.5rem; }
.progress-bar { height: 100%; border-radius: 9999px; transition: width 0.5s ease-in-out; }
.temp-bar { background: #ef4444; }
.hum-bar { background: #0ea5e9; }
.bar-danger { background: #b91c1c !important; }
.threshold-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
.card-actions { margin-top: 2rem; display: flex; justify-content: flex-end; }
.btn-primary {
  background: #1e293b; color: white; padding: 0.75rem 1.5rem; border-radius: 8px;
  text-decoration: none; font-weight: 500; font-size: 0.875rem; transition: background 0.2s;
}
.btn-primary:hover { background: #0f172a; }
.loading-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #64748b; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #1e293b; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.loading-text { font-size: 1.125rem !important; color: #94a3b8 !important; font-weight: 400 !important; }
</style>