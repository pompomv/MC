<template>
  <div class="analytics-page">
    <div class="analytics-header">
      <h2>Analisis & Histori Kandang</h2>
      <div class="header-actions">
        <div class="pen-select">
          <select v-model="selectedPenId" @change="loadData" class="custom-select">
            <option value="kandang_01">Kandang Utama (kandang_01)</option>
          </select>
        </div>
        <div class="period-toggle">
          <button :class="{ active: period === '24h' }" @click="setPeriod('24h')">Real-time Stream</button>
        </div>
        <button class="btn-export" @click="exportData">
          <DownloadIcon class="icon-sm mr-2" /> EXPORT CSV
        </button>
      </div>
    </div>

    <div class="insight-banner">
      <div class="insight-icon"><LightbulbIcon /></div>
      <div class="insight-text">
        <strong>Insight Produktivitas Cloud</strong>
        <p>Data grafik di bawah ini diambil secara langsung dan aman dari infrastruktur Firebase Realtime Database.</p>
      </div>
    </div>

    <div class="top-grid">
      <div class="card chart-card">
        <div class="card-header">
          <h3>TREN SUHU REAL-TIME (°C)</h3>
          <div class="legend-mini">
            <span class="dot actual"></span> SUHU AKTUAL
          </div>
        </div>
        <div class="chart-body">
          <Line v-if="trendChartData.datasets?.length" :data="trendChartData" :options="trendChartOptions" />
          <div v-else class="loading-state">Menunggu stream data dari ESP32...</div>
        </div>
      </div>

      <div class="stats-side">
        <div class="card stat-box border-l-optimal">
          <div class="stat-box-header">
            <h3>METRIK SUHU SAAT INI</h3>
            <ThermometerIcon class="icon-muted" />
          </div>
          <div class="stat-metrics">
            <div class="metric highlight">
              <span class="label">SUHU AKTUAL</span>
              <span class="value text-optimal">{{ currentMetrics.temperature }}°C</span>
            </div>
          </div>
        </div>
        
        <div class="card stat-box border-l-dark">
          <div class="stat-box-header">
            <h3>METRIK KELEMBABAN SAAT INI</h3>
            <DropletsIcon class="icon-muted" />
          </div>
          <div class="stat-metrics">
            <div class="metric highlight">
              <span class="label">KELEMBABAN AKTUAL</span>
              <span class="value text-dark">{{ currentMetrics.humidity }}%</span>
            </div>
          </div>
        </div>

        <div class="card export-box">
          <h3>AKSI DOKUMEN</h3>
          <button class="export-btn" @click="exportData">
            <FileSpreadsheetIcon class="icon-sm" /> Salin Data Log Terkini
            <ChevronRightIcon class="icon-sm ml-auto" />
          </button>
        </div>
      </div>
    </div>

    <div class="card hum-trend-card">
      <div class="card-header">
        <h3>TREN KELEMBABAN REAL-TIME (%)</h3>
      </div>
      <div class="chart-body hum-chart-body">
        <Line v-if="humChartData.datasets?.length" :data="humChartData" :options="humChartOptions" />
        <div v-else class="loading-state">Menunggu stream data dari ESP32...</div>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-header table-header">
        <h3>LOG DATA REAL-TIME TERKINI</h3>
        <span class="log-count">{{ localHistory.length }} entri</span>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>WAKTU SISTEM</th>
              <th>KANDANG ID</th>
              <th>SUHU (°C)</th>
              <th>KELEMBABAN (%)</th>
              <th>STATUS ALARM</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="localHistory.length > 0">
              <tr v-for="(row, index) in [...localHistory].reverse()" :key="index" :class="{ 'row-critical': row.status === 'Critical' }">
                <td class="text-muted">{{ localHistory.length - index }}</td>
                <td>{{ row.time }}</td>
                <td>{{ selectedPenId }}</td>
                <td><strong>{{ row.temp }}°C</strong></td>
                <td>{{ row.hum }}%</td>
                <td>
                  <span :class="['badge', (row.status || 'normal').toLowerCase()]">
                    {{ (row.status || 'Normal').toUpperCase() }}
                  </span>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="6" class="text-center text-muted py-4">Membuka stream data Firebase Realtime Database...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePenStore } from '@/stores/pens'
import { useSensorStore } from '@/stores/sensor'
import { 
  LightbulbIcon, DownloadIcon, ThermometerIcon, DropletsIcon, 
  FileSpreadsheetIcon, ChevronRightIcon
} from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const penStore = usePenStore()
const sensorStore = useSensorStore()
const period = ref('24h')
const selectedPenId = ref('kandang_01')

// Array penampung riwayat data lokal selama aplikasi dibuka (untuk kebutuhan grafik)
const localHistory = ref([])

// Menghubungkan ke data reaktif Pinia yang disinkronkan dari Firebase
const mainPen = computed(() => {
  return penStore.pens.find(p => p.id === selectedPenId.value) || null
})

// Metrik terkini untuk ditampilkan di kotak informasi dan tabel log
const currentMetrics = computed(() => {
  if (mainPen.value && mainPen.value.latest_reading) {
    const now = new Date()
    return {
      temperature: mainPen.value.latest_reading.temperature,
      humidity: mainPen.value.latest_reading.humidity,
      status: mainPen.value.last_status || 'Normal',
      timestamp: now.toLocaleTimeString()
    }
  }
  return { temperature: '--', humidity: '--', status: 'Normal', timestamp: '--' }
})

// Memantau setiap kali ada paket data baru (latest_reading) yang masuk dari ESP32 via Firebase
watch(() => mainPen.value?.latest_reading, (newReading) => {
  if (newReading && typeof newReading.temperature === 'number' && typeof newReading.humidity === 'number') {
    const now = new Date()
    const pen = mainPen.value
    let status = 'Normal'
    if (pen && pen.thresholds) {
      const t = newReading.temperature
      const h = newReading.humidity
      const th = pen.thresholds
      status = (t < th.temp_min || t > th.temp_max || h < th.humidity_min || h > th.humidity_max) ? 'Critical' : 'Normal'
    } else if (pen && pen.last_status) {
      status = pen.last_status
    }

    localHistory.value = [
      ...localHistory.value, 
      {
        time: now.toLocaleTimeString(),
        temp: newReading.temperature,
        hum: newReading.humidity,
        status
      }
    ]
    
    // Batasi hanya 50 data terakhir untuk performa
    if (localHistory.value.length > 50) {
      localHistory.value.shift()
    }
  }
}, { deep: true })

const loadData = async () => {
  if (penStore.pens.length === 0) {
    await penStore.fetchPens()
  }
  // Load historical data dari database (max 100 data terakhir)
  const historicalData = await penStore.fetchPenReadings(selectedPenId.value)
  if (historicalData && historicalData.length > 0) {
    // Konversi data historis ke format yang sama dengan localHistory
    const formattedHistory = historicalData.map(log => {
      let timeStr = 'N/A'
      // Handle berbagai format timestamp
      if (log.timestamp) {
        if (typeof log.timestamp === 'number') {
          timeStr = new Date(log.timestamp).toLocaleTimeString()
        } else if (typeof log.timestamp === 'string') {
          timeStr = new Date(log.timestamp).toLocaleTimeString()
        }
      }
      return {
        time: timeStr,
        temp: log.temperature,
        hum: log.humidity
      }
    })
    // Ambil 15 data terakhir saja untuk performa
    localHistory.value = formattedHistory.slice(-15)
  }
}

onMounted(() => {
  loadData()
  // Aktifkan real-time listener
  sensorStore.connectWebSocket()
})

onUnmounted(() => {
  // Matikan listener saat keluar halaman
  sensorStore.disconnectWebSocket()
})

const setPeriod = (p) => {
  period.value = p
}

const exportData = () => {
  if (localHistory.value.length === 0) {
    alert("Belum ada data log yang terkumpul untuk diexport.")
    return
  }
  let csvContent = "data:text/csv;charset=utf-8,Waktu,Suhu (C),Kelembaban (%)\n"
  localHistory.value.forEach(row => {
    csvContent += `${row.time},${row.temp},${row.hum}\n`
  })
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `log_maggot_${selectedPenId.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Konfigurasi Chart Grafik Suhu
const trendChartData = computed(() => {
  return {
    labels: localHistory.value.map(d => d.time),
    datasets: [
      {
        label: 'SUHU',
        data: localHistory.value.map(d => d.temp),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#10b981',
        pointBorderColor: 'white',
        pointBorderWidth: 2
      }
    ]
  }
})

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: { grid: { display: false } },
    y: { min: 15, max: 45 }
  }
}

// Konfigurasi Chart Grafik Kelembaban
const humChartData = computed(() => {
  return {
    labels: localHistory.value.map(d => d.time),
    datasets: [
      {
        label: 'KELEMBABAN',
        data: localHistory.value.map(d => d.hum),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: 'white',
        pointBorderWidth: 2
      }
    ]
  }
})

const humChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: { display: false },
    y: { min: 30, max: 100 }
  }
}
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #1e293b;
  background: #f8fafc;
  padding: 1.5rem;
  min-height: 100vh;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.analytics-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.period-toggle {
  display: flex;
  background: white;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  overflow: hidden;
}
.custom-select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #1e293b;
  font-weight: 600;
  font-size: 0.85rem;
  outline: none;
}
.period-toggle button {
  border: none;
  background: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}
.period-toggle button.active {
  background: #1e293b;
  color: white;
}
.btn-export {
  display: flex;
  align-items: center;
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.insight-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #d1fae5;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: #065f46;
}
.insight-icon {
  background: #10b981;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.insight-text strong {
  display: block;
  font-size: 0.95rem;
}
.insight-text p {
  margin: 0;
  font-size: 0.85rem;
}

.top-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.card-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
}
.legend-mini {
  font-size: 0.75rem;
  display: flex;
  gap: 1rem;
  color: #64748b;
  font-weight: 600;
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}
.dot.actual { background: #10b981; }

.chart-body {
  height: 250px;
}
.loading-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.stats-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.stat-box {
  padding: 1.25rem;
}
.border-l-optimal { border-left: 4px solid #10b981; }
.border-l-dark { border-left: 4px solid #1e293b; }

.stat-box-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.stat-box-header h3 {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}
.stat-metrics {
  display: flex;
  justify-content: space-between;
}
.metric {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.metric.highlight {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.5rem;
  text-align: center;
}
.metric .label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}
.metric .value {
  font-size: 1.5rem;
  font-weight: 700;
}
.text-optimal { color: #10b981; }
.text-dark { color: #1e293b; }

.export-box {
  background: #1e293b;
  color: white;
  padding: 1.25rem;
}
.export-box h3 {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}
.export-btn {
  width: 100%;
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}
.export-btn:hover { background: rgba(255,255,255,0.1); }
.export-btn svg { margin-right: 0.75rem; }

.hum-chart-body {
  height: 120px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
.data-table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 1rem;
  font-size: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}
.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge.normal { background: #dcfce7; color: #15803d; }
.badge.critical { background: #fee2e2; color: #b91c1c; }
.badge.warning { background: #fef9c3; color: #854d0e; }

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.log-count {
  font-size: 0.8rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}
.row-critical {
  background: #fff5f5;
}
.row-critical td { color: #b91c1c; }
.text-muted { color: #94a3b8; }
.text-center { text-align: center; }
.py-4 { padding-top: 2rem; padding-bottom: 2rem; }

@media (max-width: 1024px) {
  .top-grid { grid-template-columns: 1fr; }
  .analytics-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .header-actions { width: 100%; justify-content: space-between; }
}
</style>