<template>
  <div class="pen-detail" v-if="penStore.currentPen">
    <div class="header">
      <div class="header-left">
        <h2>{{ penStore.currentPen.name }}</h2>
        <p class="location"><MapPinIcon class="icon-sm" /> {{ penStore.currentPen.location }} ({{ penStore.currentPen.sector }})</p>
      </div>
      <div class="header-right">
        <span v-if="!penStore.currentPen.is_monitoring" class="status-badge" style="background: var(--c-bg); color: var(--text-muted);">
          <ActivityIcon class="icon-sm" /> OFFLINE
        </span>
        <span v-else class="status-badge" :class="penStore.currentPen.last_status">
          <ActivityIcon class="icon-sm" /> {{ penStore.currentPen.last_status.toUpperCase() }}
        </span>
        <button 
          class="power-btn" 
          :class="{'is-on': penStore.currentPen.is_monitoring}" 
          @click="togglePower(penStore.currentPen)"
          :title="penStore.currentPen.is_monitoring ? 'Shutdown' : 'Start Monitoring'"
        >
          <PowerIcon class="icon-sm" />
          <span v-if="penStore.currentPen.is_monitoring">SHUTDOWN</span>
          <span v-else>POWER ON</span>
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Current Stats -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon temp-icon"><ThermometerIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Temperature</span>
            <span class="stat-value">{{ penStore.currentPen.latest_reading?.temperature.toFixed(1) || '--' }} °C</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon hum-icon"><DropletsIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Humidity</span>
            <span class="stat-value">{{ penStore.currentPen.latest_reading?.humidity.toFixed(1) || '--' }} %</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon threshold-icon"><SettingsIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Target Temp</span>
            <span class="stat-value">{{ penStore.currentPen.threshold?.temp_min }} - {{ penStore.currentPen.threshold?.temp_max }} °C</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon threshold-icon"><SettingsIcon /></div>
          <div class="stat-content">
            <span class="stat-label">Target Humidity</span>
            <span class="stat-value">{{ penStore.currentPen.threshold?.humidity_min }} - {{ penStore.currentPen.threshold?.humidity_max }} %</span>
          </div>
        </div>
      </div>

      <!-- Main Chart -->
      <div class="chart-section">
        <div class="card">
          <h3>24-Hour History</h3>
          <div class="chart-wrapper">
            <Line v-if="chartData.datasets.length" :data="chartData" :options="chartOptions" />
            <div v-else class="loading-chart">Loading data...</div>
          </div>
        </div>
      </div>

      <!-- Activity Logs -->
      <div class="logs-section">
        <div class="card">
          <h3>Recent Activity</h3>
          <ul class="log-list">
            <li v-for="log in logs" :key="log.id" :class="['log-item', log.level]">
              <div class="log-icon">
                <AlertTriangleIcon v-if="log.level === 'critical'" />
                <AlertCircleIcon v-else-if="log.level === 'warning'" />
                <InfoIcon v-else />
              </div>
              <div class="log-content">
                <span class="log-message">{{ log.message }}</span>
                <span class="log-time">{{ new Date(log.timestamp).toLocaleString() }}</span>
              </div>
            </li>
            <li v-if="logs.length === 0" class="log-empty">No recent activity</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div class="loading-view" v-else>
    <div class="spinner"></div>
    <p>Loading Pen Details...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePenStore } from '@/stores/pens'
import { MapPinIcon, ActivityIcon, ThermometerIcon, DropletsIcon, SettingsIcon, InfoIcon, AlertCircleIcon, AlertTriangleIcon, PowerIcon } from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const route = useRoute()
const penStore = usePenStore()

const readings = ref([])
const logs = ref([])

const loadData = async (id) => {
  readings.value = []
  logs.value = []
  await penStore.fetchPenDetails(id)
  readings.value = await penStore.fetchPenReadings(id)
  logs.value = await penStore.fetchPenLogs(id)
}

onMounted(() => {
  loadData(parseInt(route.params.id))
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    loadData(parseInt(newId))
  }
})

const togglePower = async (pen) => {
  if (pen.is_monitoring) {
    await penStore.shutdownPen(pen.id)
  } else {
    await penStore.startMonitoring(pen.id)
  }
  // Refresh detail after change
  loadData(pen.id)
}

const chartData = computed(() => {
  if (!readings.value.length) return { labels: [], datasets: [] }
  
  const labels = readings.value.map(r => {
    const d = new Date(r.timestamp)
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: readings.value.map(r => r.temperature),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Humidity (%)',
        data: readings.value.map(r => r.humidity),
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
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#a1a1aa' }
    }
  },
  scales: {
    x: {
      ticks: { color: '#a1a1aa', maxTicksLimit: 10 },
      grid: { color: 'rgba(255,255,255,0.05)' }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      ticks: { color: '#f59e0b' },
      grid: { color: 'rgba(255,255,255,0.05)' }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      ticks: { color: '#3b82f6' },
      grid: { drawOnChartArea: false }
    }
  }
}
</script>

<style scoped>
.pen-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--c-text-main);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.power-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.power-btn:hover {
  background: var(--c-bg);
}

.power-btn.is-on {
  color: var(--c-optimal);
  border-color: rgba(16, 185, 129, 0.5);
  background: rgba(16, 185, 129, 0.1);
}

.location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}

.status-badge.optimal { background: rgba(16, 185, 129, 0.1); color: var(--c-optimal); border: 1px solid rgba(16, 185, 129, 0.2); }
.status-badge.warning { background: rgba(245, 158, 11, 0.1); color: var(--c-warning); border: 1px solid rgba(245, 158, 11, 0.2); }
.status-badge.critical { background: rgba(239, 68, 68, 0.1); color: var(--c-critical); border: 1px solid rgba(239, 68, 68, 0.2); }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  gap: 1.5rem;
}

.stats-section {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.temp-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.hum-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.threshold-icon { background: rgba(161, 161, 170, 0.1); color: #a1a1aa; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--c-text-main);
  margin-top: 0.25rem;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  height: 100%;
}

.card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--c-text-main);
}

.chart-section {
  grid-column: 1;
}

.chart-wrapper {
  height: 350px;
  width: 100%;
}

.loading-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.logs-section {
  grid-column: 2;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 350px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
}

.log-item.critical { border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); }
.log-item.warning { border-color: rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.05); }

.log-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.log-item.info .log-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.log-item.warning .log-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.log-item.critical .log-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.log-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.log-message {
  font-size: 0.9rem;
  color: var(--c-text-main);
  line-height: 1.4;
}

.log-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.log-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem 0;
}

.loading-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 1rem;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--c-optimal);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Custom scrollbar for logs */
.log-list::-webkit-scrollbar { width: 4px; }
.log-list::-webkit-scrollbar-track { background: transparent; }
.log-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .logs-section {
    grid-column: 1;
  }
}
</style>
