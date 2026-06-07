<template>
  <div class="pen-detail" v-if="pen">
    <div class="header">
      <div class="header-left">
        <h2>{{ pen.name }}</h2>
        <p class="location"><MapPinIcon class="icon-sm" /> {{ pen.location }}</p>
      </div>
      <div class="header-right">
        <span class="status-badge" :class="pen.last_status?.toLowerCase() || 'normal'">
          <ActivityIcon class="icon-sm" /> {{ (pen.last_status || 'NORMAL').toUpperCase() }}
        </span>
        <button 
          class="power-btn" 
          :class="{'is-on': isMonitoring}" 
          @click="togglePower"
        >
          <PowerIcon class="icon-sm" />
          <span>{{ isMonitoring ? 'SHUTDOWN' : 'POWER ON' }}</span>
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon temp-icon"><ThermometerIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Suhu Saat Ini</span>
            <span class="stat-value">{{ pen.latest_reading?.temperature || '--' }} °C</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon hum-icon"><DropletsIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Kelembaban Saat Ini</span>
            <span class="stat-value">{{ pen.latest_reading?.humidity || '--' }} %</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon threshold-icon"><SettingsIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Target Suhu</span>
            <span class="stat-value">{{ pen.thresholds?.temp_min || 27 }} - {{ pen.thresholds?.temp_max || 30 }} °C</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon threshold-icon"><SettingsIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Target Kelembaban</span>
            <span class="stat-value">{{ pen.thresholds?.humidity_min || 60 }} - {{ pen.thresholds?.humidity_max || 70 }} %</span>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div class="card">
          <h3>Grafik Fluktuasi Real-time</h3>
          <div class="chart-wrapper">
            <Line v-if="chartData.datasets[0].data.length > 0" :data="chartData" :options="chartOptions" />
            <div v-else class="loading-chart">Menunggu pergerakan data sensor...</div>
          </div>
        </div>
      </div>

      <div class="logs-section">
        <div class="card">
          <h3>Log Aktivitas Terkini</h3>
          <ul class="log-list">
            <li v-for="log in logs" :key="log.id" :class="['log-item', log.level]">
              <div class="log-icon">
                <AlertTriangleIcon v-if="log.level === 'critical'" />
                <AlertCircleIcon v-else-if="log.level === 'warning'" />
                <InfoIcon v-else />
              </div>
              <div class="log-content">
                <span class="log-message">{{ log.message }}</span>
                <span class="log-time">{{ log.timestamp }}</span>
              </div>
            </li>
            <li v-if="logs.length === 0" class="log-empty">Belum ada aktivitas terekam.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  
  <div class="loading-view" v-else>
    <div class="spinner"></div>
    <p>Mencari data kandang di Cloud...</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePenStore } from '@/stores/pens'
import { 
  MapPinIcon, ActivityIcon, ThermometerIcon, DropletsIcon, 
  SettingsIcon, InfoIcon, AlertCircleIcon, AlertTriangleIcon, PowerIcon 
} from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend 
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const route = useRoute()
const penStore = usePenStore()

// State Lokal
const isMonitoring = ref(true)
const localReadings = ref([])
const logs = ref([])

// Mendapatkan data pen berdasarkan ID dari URL
const penId = computed(() => route.params.id)
const pen = computed(() => {
  return penStore.pens.find(p => p.id === penId.value) || null
})

// Memantau perubahan suhu secara real-time untuk mengisi grafik dan log
watch(() => pen.value?.latest_reading?.temperature, (newTemp) => {
  if (newTemp && pen.value) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString()
    const humidity = pen.value.latest_reading.humidity
    const status = pen.value.last_status || 'Normal'

    // Tambah data ke grafik
    localReadings.value.push({ time: timeStr, temp: newTemp, hum: humidity })
    if (localReadings.value.length > 20) localReadings.value.shift() // Batasi 20 titik

    // Tambah data ke log jika statusnya kritis, atau batasi pencatatan log info
    const level = status.toLowerCase() === 'critical' ? 'critical' : 'info'
    
    // Jangan catat info normal setiap detik, catat hanya jika kritis atau setiap 5 data masuk
    if (level === 'critical' || localReadings.value.length % 5 === 0) {
      logs.value.unshift({
        id: Date.now(),
        level: level,
        message: `Pembacaan: Suhu ${newTemp}°C, Kelembaban ${humidity}% (${status})`,
        timestamp: timeStr
      })
      if (logs.value.length > 30) logs.value.pop() // Batasi 30 log
    }
  }
})

onMounted(async () => {
  if (penStore.pens.length === 0) {
    await penStore.fetchPens()
  }
})

// Simulasi toggle power
const togglePower = () => {
  isMonitoring.value = !isMonitoring.value
  const msg = isMonitoring.value ? 'Sistem monitoring diaktifkan' : 'Sistem monitoring dihentikan (Shutdown)'
  logs.value.unshift({
    id: Date.now(),
    level: isMonitoring.value ? 'info' : 'warning',
    message: msg,
    timestamp: new Date().toLocaleTimeString()
  })
}

// Konfigurasi Chart
const chartData = computed(() => {
  return {
    labels: localReadings.value.map(r => r.time),
    datasets: [
      {
        label: 'Suhu (°C)',
        data: localReadings.value.map(r => r.temp),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Kelembaban (%)',
        data: localReadings.value.map(r => r.hum),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { position: 'top' } },
  scales: {
    x: { ticks: { maxTicksLimit: 10 }, grid: { display: false } },
    y: {
      type: 'linear', display: true, position: 'left',
      ticks: { color: '#f59e0b' }
    },
    y1: {
      type: 'linear', display: true, position: 'right',
      ticks: { color: '#3b82f6' },
      grid: { drawOnChartArea: false }
    }
  }
}
</script>

<style scoped>
.pen-detail { display: flex; flex-direction: column; gap: 1.5rem; color: #1e293b; padding: 1.5rem; background: #f8fafc; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.header-left h2 { margin: 0; font-size: 1.5rem; font-weight: 700; }
.header-right { display: flex; align-items: center; gap: 1rem; }
.power-btn { background: white; border: 1px solid #cbd5e1; border-radius: 999px; padding: 0.5rem 1rem; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; }
.power-btn:hover { background: #f1f5f9; }
.power-btn.is-on { color: #10b981; border-color: rgba(16, 185, 129, 0.5); background: #ecfdf5; }
.location { display: flex; align-items: center; gap: 0.5rem; color: #64748b; margin-top: 0.5rem; font-size: 0.9rem; }
.status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 999px; font-weight: 600; font-size: 0.85rem; }
.status-badge.normal { background: #dcfce7; color: #15803d; }
.status-badge.critical { background: #fee2e2; color: #b91c1c; animation: pulse 2s infinite; }

.dashboard-grid { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; }
.stats-section { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.stat-card { background: white; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;}
.temp-icon { background: #fef3c7; color: #f59e0b; }
.hum-icon { background: #dbeafe; color: #3b82f6; }
.threshold-icon { background: #f1f5f9; color: #64748b; }
.stat-content { display: flex; flex-direction: column; }
.stat-label { font-size: 0.85rem; color: #64748b; }
.stat-value { font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem; }

.card { background: white; border-radius: 12px; padding: 1.5rem; height: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.card h3 { margin: 0 0 1rem 0; font-size: 1.1rem; color: #1e293b; font-weight: 600;}
.chart-section { grid-column: 1; }
.chart-wrapper { height: 350px; width: 100%; }
.loading-chart { display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 0.9rem; }

.logs-section { grid-column: 2; }
.log-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; max-height: 350px; overflow-y: auto; }
.log-item { display: flex; gap: 1rem; padding: 0.75rem; border-radius: 8px; background: #f8fafc; border: 1px solid transparent; }
.log-item.critical { border-color: #fca5a5; background: #fef2f2; }
.log-item.warning { border-color: #fcd34d; background: #fffbeb; }
.log-icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
.log-item.info .log-icon { background: #dbeafe; color: #3b82f6; }
.log-item.warning .log-icon { background: #fef3c7; color: #f59e0b; }
.log-item.critical .log-icon { background: #fee2e2; color: #ef4444; }
.log-content { display: flex; flex-direction: column; gap: 0.25rem; }
.log-message { font-size: 0.85rem; line-height: 1.4; }
.log-time { font-size: 0.75rem; color: #94a3b8; }
.log-empty { text-align: center; color: #94a3b8; padding: 2rem 0; font-size: 0.85rem; }

.loading-view { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 1rem; color: #64748b; }
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .logs-section { grid-column: 1; }
}
</style>