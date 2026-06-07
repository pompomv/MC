<template>
  <div class="pen-detail" v-if="pen">
    <div class="header">
      <div class="header-left">
        <h2>{{ pen.name || penIdFormatted }}</h2>
        <p class="location"><MapPinIcon class="icon-sm" /> {{ pen.location || penId }}</p>
      </div>
      <div class="header-right">
        <span class="status-badge" :class="pen.last_status?.toLowerCase() || 'normal'">
          <ActivityIcon class="icon-sm" /> {{ (pen.last_status || 'NORMAL').toUpperCase() }}
        </span>
        <button class="action-btn" @click="showActivityModal = true">
          <ClipboardListIcon class="icon-sm" />
          <span>Catat Pakan/Panen</span>
        </button>
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

        <div class="card mt-4">
          <h3>Riwayat Pakan & Panen</h3>
          <div class="activity-history">
            <div v-for="act in activitiesLog" :key="act.id" class="history-item">
               <div class="history-icon" :class="act.type">
                 <ClipboardListIcon v-if="act.type === 'feed'" class="icon-sm" />
                 <ActivityIcon v-else class="icon-sm" />
               </div>
               <div class="history-content">
                 <strong>{{ act.type === 'feed' ? 'Pemberian Pakan' : 'Panen Maggot' }}</strong>
                 <span>{{ act.type === 'feed' ? `${act.actual_feed_kg} Kg diberikan` : `${act.harvest_weight_kg} Kg dipanen` }}</span>
               </div>
               <div class="history-time">{{ new Date(act.timestamp).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'}) }}</div>
            </div>
            <div v-if="activitiesLog.length === 0" class="log-empty">Belum ada riwayat data.</div>
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

  <!-- Modal Input Manual -->
  <div v-if="showActivityModal" class="modal-overlay" @click.self="showActivityModal = false">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Manajemen Pakan & Panen</h3>
        <button class="close-btn" @click="showActivityModal = false"><XIcon /></button>
      </div>
      
      <div class="modal-tabs">
        <button :class="{ active: activityTab === 'feed' }" @click="activityTab = 'feed'">Pakan</button>
        <button :class="{ active: activityTab === 'harvest' }" @click="activityTab = 'harvest'">Panen</button>
      </div>

      <div class="modal-body">
        <!-- Tab Pakan -->
        <div v-if="activityTab === 'feed'" class="tab-content">
          <p class="tab-desc">Rekomendasi pakan dihitung otomatis berdasarkan suhu dan kelembaban IoT saat ini.</p>
          
          <div class="iot-context">
            <div class="ctx-item"><span>Suhu Kandang:</span> <strong>{{ pen?.latest_reading?.temperature || '--' }} °C</strong></div>
            <div class="ctx-item"><span>Kelembaban:</span> <strong>{{ pen?.latest_reading?.humidity || '--' }} %</strong></div>
          </div>

          <div class="form-group">
            <label>Estimasi Bobot Maggot Saat Ini (Kg)</label>
            <input type="number" v-model="maggotWeightInput" placeholder="Contoh: 10" min="0" step="0.1" />
          </div>

          <div v-if="maggotWeightInput > 0" class="recommendation-box" :class="recommendation.type">
            <h4>Rekomendasi Sistem:</h4>
            <div class="rec-value">{{ recommendation.amount }} Kg</div>
            <p>{{ recommendation.message }}</p>
          </div>

          <div class="form-group">
            <label>Jumlah Pakan Yang Diberikan (Kg)</label>
            <input type="number" v-model="actualFeedInput" placeholder="Contoh: 15" min="0" step="0.1" />
          </div>
        </div>

        <!-- Tab Panen -->
        <div v-if="activityTab === 'harvest'" class="tab-content">
          <p class="tab-desc">Catat hasil panen maggot untuk melihat produktivitas kandang.</p>
          <div class="form-group">
            <label>Total Bobot Maggot Dipanen (Kg)</label>
            <input type="number" v-model="harvestWeightInput" placeholder="Contoh: 25" min="0" step="0.1" />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="showActivityModal = false">Batal</button>
        <button class="btn-submit" @click="submitActivity" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Data' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePenStore } from '@/stores/pens'
import { useNotifStore } from '@/stores/notif'
import { 
  MapPinIcon, ActivityIcon, ThermometerIcon, DropletsIcon, 
  SettingsIcon, InfoIcon, AlertCircleIcon, AlertTriangleIcon, PowerIcon,
  ClipboardListIcon, XIcon 
} from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend 
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const route = useRoute()
const penStore = usePenStore()
const notifStore = useNotifStore()

// State Lokal
const isMonitoring = ref(true)
const localReadings = ref([])
const logs = ref([])
const activitiesLog = ref([])

// Kalkulator State
const showActivityModal = ref(false)
const activityTab = ref('feed') // 'feed' | 'harvest'
const maggotWeightInput = ref('')
const actualFeedInput = ref('')
const harvestWeightInput = ref('')
const isSubmitting = ref(false)

// Mendapatkan data pen berdasarkan ID dari URL
const penId = computed(() => route.params.id)
const penIdFormatted = computed(() =>
  String(penId.value || '')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
)
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
    const level = status.toLowerCase() === 'critical' ? 'critical'
      : status.toLowerCase() === 'warning' ? 'warning' : 'info'

    // Tambah data ke grafik
    localReadings.value.push({ time: timeStr, temp: newTemp, hum: humidity })
    if (localReadings.value.length > 20) localReadings.value.shift()

    // Selalu catat ke log (critical/warning) atau setiap 5 data untuk info
    if (level !== 'info' || localReadings.value.length % 5 === 0) {
      logs.value.unshift({
        id: Date.now(),
        level,
        message: `Suhu ${newTemp}°C · Kelembaban ${humidity}% · ${status}`,
        timestamp: timeStr
      })
      if (logs.value.length > 30) logs.value.pop()
    }
  }
})

onMounted(async () => {
  // 1. Pastikan list kandang tersedia
  if (penStore.pens.length === 0) {
    await penStore.fetchPens()
  }

  // 2. Set currentPen agar breadcrumb di TopBar menampilkan nama kandang
  await penStore.fetchPenDetails(penId.value)

  // 3. Seed chart dengan data saat ini jika sudah ada
  if (pen.value?.latest_reading) {
    const r = pen.value.latest_reading
    const timeStr = r.timestamp
      ? new Date(typeof r.timestamp === 'number' ? r.timestamp : r.timestamp).toLocaleTimeString()
      : new Date().toLocaleTimeString()
    localReadings.value.push({ time: timeStr, temp: r.temperature, hum: r.humidity })
    logs.value.unshift({
      id: Date.now(),
      level: (pen.value.last_status || 'normal').toLowerCase(),
      message: `Data terkini: Suhu ${r.temperature}°C, Kelembaban ${r.humidity}% (${pen.value.last_status || 'Normal'})`,
      timestamp: timeStr
    })
  }

  // 4. Muat riwayat log dari Firebase /logs
  const history = await penStore.fetchPenReadings(penId.value)
  let logEntries = []

  if (history && history.length > 0) {
    const sorted = [...history].sort((a, b) => {
      const ta = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime()
      const tb = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime()
      return ta - tb
    })
    const last20 = sorted.slice(-20)
    localReadings.value = last20.map(r => ({
      time: r.timestamp
        ? new Date(typeof r.timestamp === 'number' ? r.timestamp : r.timestamp).toLocaleTimeString()
        : '--',
      temp: r.temperature,
      hum: r.humidity
    }))

    // Format log sensor
    logEntries = sorted.slice(-30).map((r, i) => {
      const timeStr = r.timestamp
        ? new Date(typeof r.timestamp === 'number' ? r.timestamp : r.timestamp).toLocaleTimeString()
        : '--'
      const status = r.status || 'Normal'
      const level = status.toLowerCase() === 'critical' ? 'critical'
        : status.toLowerCase() === 'warning' ? 'warning' : 'info'
      const rawTimestamp = typeof r.timestamp === 'number' ? r.timestamp : new Date(r.timestamp).getTime()

      return {
        id: 'sensor_' + Date.now() + i,
        level,
        message: `Suhu ${r.temperature}°C · Kelembaban ${r.humidity}% · ${status}`,
        timestamp: timeStr,
        _rawTime: rawTimestamp
      }
    })
  }

  // 5. Muat riwayat aktivitas manual (Pakan & Panen)
  const activities = await penStore.fetchActivities(penId.value)
  if (activities && activities.length > 0) {
    activitiesLog.value = activities
  }

  // Urutkan gabungan log (Terbaru di atas) dan ambil 40 teratas
  logEntries.sort((a, b) => b._rawTime - a._rawTime)
  logs.value = logEntries.slice(0, 40)
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

// Logic Rekomendasi Pakan
const recommendation = computed(() => {
  const weight = parseFloat(maggotWeightInput.value)
  if (isNaN(weight) || weight <= 0) return null

  const temp = pen.value?.latest_reading?.temperature || 28
  const hum = pen.value?.latest_reading?.humidity || 65

  // Base feed capacity: 2x body weight
  let baseAmount = weight * 2
  let finalAmount = baseAmount
  let type = 'normal'
  let msg = 'Kondisi lingkungan sangat optimal. Berikan pakan dengan dosis penuh (2x lipat bobot maggot).'

  if (temp < 27) {
    type = 'warning'
    finalAmount = baseAmount * 0.75 // Kurangi 25%
    msg = 'Suhu kandang terdeteksi dingin. Metabolisme maggot melambat. Dosis pakan dikurangi 25% agar pakan tidak membusuk.'
  } else if (temp > 30) {
    type = 'warning'
    finalAmount = baseAmount * 0.80 // Kurangi 20%
    msg = 'Suhu kandang terdeteksi panas. Maggot berisiko stres. Kurangi dosis 20% dan utamakan pakan yang mengandung banyak air (buah/sayur).'
  }

  if (hum > 70) {
    msg += ' Kelembaban tinggi. Gunakan komposisi pakan kering (dedak/ampas kelapa) untuk mengimbangi.'
  } else if (hum < 60) {
    msg += ' Kelembaban rendah. Pakan basah sangat dianjurkan.'
  }

  return {
    amount: finalAmount.toFixed(1),
    message: msg,
    type
  }
})

// Menyimpan aktivitas ke Firebase
const submitActivity = async () => {
  isSubmitting.value = true
  try {
    let payload = {
      timestamp: Date.now(),
      user: 'Admin'
    }

    if (activityTab.value === 'feed') {
      if (!actualFeedInput.value) {
        notifStore.addNotification('Input Pakan Kosong', 'Silakan masukkan jumlah pakan yang diberikan.', 'warning')
        return
      }
      payload.type = 'feed'
      payload.maggot_weight_kg = parseFloat(maggotWeightInput.value) || 0
      payload.recommended_feed_kg = parseFloat(recommendation.value?.amount || 0)
      payload.actual_feed_kg = parseFloat(actualFeedInput.value)
      payload.temperature_at_time = pen.value?.latest_reading?.temperature || null
      payload.humidity_at_time = pen.value?.latest_reading?.humidity || null
      payload.notes = recommendation.value?.message || ''
    } else {
      if (!harvestWeightInput.value) {
        notifStore.addNotification('Input Panen Kosong', 'Silakan masukkan bobot panen.', 'warning')
        return
      }
      payload.type = 'harvest'
      payload.harvest_weight_kg = parseFloat(harvestWeightInput.value)
    }

    const success = await penStore.saveActivity(penId.value, payload)
    if (success) {
      showActivityModal.value = false
      
      // Tambahkan ke log tampilan lokal
      activitiesLog.value.unshift({
        id: Date.now(),
        ...payload
      })

      maggotWeightInput.value = ''
      actualFeedInput.value = ''
      harvestWeightInput.value = ''
      notifStore.addNotification('Berhasil', `Data ${activityTab.value === 'feed' ? 'Pakan' : 'Panen'} berhasil disimpan.`, 'normal')
    } else {
      notifStore.addNotification('Gagal', 'Terjadi kesalahan saat menyimpan ke Firebase. Cek koneksi & Rules.', 'critical')
    }
  } catch (error) {
    console.error("Error submit activity:", error)
    notifStore.addNotification('Error', 'Kesalahan internal sistem.', 'critical')
  } finally {
    isSubmitting.value = false
  }
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
.action-btn { background: #3b82f6; border: none; border-radius: 999px; padding: 0.5rem 1rem; color: white; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.85rem; transition: background 0.2s; }
.action-btn:hover { background: #2563eb; }
.location { display: flex; align-items: center; gap: 0.5rem; color: #64748b; margin-top: 0.5rem; font-size: 0.9rem; }
.status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 999px; font-weight: 600; font-size: 0.85rem; }
.status-badge.normal   { background: #dcfce7; color: #15803d; }
.status-badge.warning  { background: #fef3c7; color: #b45309; }
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

.card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.logs-section .card { height: 100%; }
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

.mt-4 { margin-top: 1.5rem; }
.activity-history { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.history-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
.history-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; color: white; }
.history-icon.feed { background: #10b981; }
.history-icon.harvest { background: #f59e0b; }
.history-content { flex: 1; display: flex; flex-direction: column; }
.history-content strong { color: #1e293b; font-size: 0.95rem; }
.history-content span { color: #64748b; font-size: 0.85rem; margin-top: 0.15rem; }
.history-time { color: #94a3b8; font-size: 0.8rem; text-align: right; }

/* Modal CSS */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; backdrop-filter: blur(4px); }
.modal-content { background: white; width: 100%; max-width: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
.close-btn { background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 8px; padding: 0.25rem; transition: background 0.2s; }
.close-btn:hover { background: #f1f5f9; color: #0f172a; }
.modal-tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
.modal-tabs button { flex: 1; padding: 1rem; background: #f8fafc; border: none; border-bottom: 2px solid transparent; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
.modal-tabs button.active { background: white; color: #3b82f6; border-bottom-color: #3b82f6; }
.modal-body { padding: 1.5rem; }
.tab-desc { color: #64748b; font-size: 0.9rem; margin: 0 0 1.5rem 0; line-height: 1.5; }
.iot-context { display: flex; gap: 1rem; background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; }
.ctx-item { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.ctx-item span { font-size: 0.8rem; color: #64748b; }
.ctx-item strong { font-size: 1.1rem; color: #1e293b; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
.form-group input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; box-sizing: border-box; }
.form-group input:focus { outline: none; border-color: #3b82f6; }
.recommendation-box { background: #f0fdfa; border: 1px solid #5eead4; padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; }
.recommendation-box.warning { background: #fffbeb; border-color: #fde68a; }
.recommendation-box h4 { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #0f172a; }
.rec-value { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
.recommendation-box p { margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.5; }
.modal-footer { padding: 1.25rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; }
.btn-cancel { background: white; border: 1px solid #cbd5e1; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; color: #475569; cursor: pointer; transition: background 0.2s; }
.btn-cancel:hover { background: #f1f5f9; }
.btn-submit { background: #3b82f6; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; color: white; cursor: pointer; transition: background 0.2s; }
.btn-submit:hover:not(:disabled) { background: #2563eb; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .logs-section { grid-column: 1; }
}
</style>