<template>
  <div class="analytics-page">
    <!-- Local Header / Controls -->
    <div class="analytics-header">
      <h2>Analytics & History</h2>
      <div class="header-actions">
        <div class="pen-select">
          <select v-model="selectedPenId" @change="loadData" class="custom-select">
            <option value="">Semua Kandang</option>
            <option v-for="pen in penStore.pens" :key="pen.id" :value="pen.id">
              {{ pen.name }}
            </option>
          </select>
        </div>
        <div class="period-toggle">
          <button :class="{ active: period === '24h' }" @click="setPeriod('24h')">24 Jam</button>
          <button :class="{ active: period === '7d' }" @click="setPeriod('7d')">7 Hari</button>
          <button :class="{ active: period === '30d' }" @click="setPeriod('30d')">30 Hari</button>
        </div>
        <button class="btn-export" @click="exportData">
          <DownloadIcon class="icon-sm mr-2" /> EXPORT DATA
        </button>
      </div>
    </div>

    <!-- Insight Banner -->
    <div class="insight-banner">
      <div class="insight-icon"><LightbulbIcon /></div>
      <div class="insight-text">
        <strong>Insight Produktivitas</strong>
        <p>Suhu stabil meningkatkan pertumbuhan maggot hingga 15% berdasarkan data histori 30 hari terakhir.</p>
      </div>
    </div>

    <!-- Top Grid -->
    <div class="top-grid">
      <!-- Temp Trend Chart -->
      <div class="card chart-card">
        <div class="card-header">
          <h3>TEMPERATURE TREND (°C)</h3>
          <div class="legend-mini">
            <span class="dot actual"></span> ACTUAL
            <span class="dot optimal"></span> OPTIMAL RANGE
          </div>
        </div>
        <div class="chart-body">
          <Line v-if="trendChartData.datasets?.length" :data="trendChartData" :options="trendChartOptions" />
          <div v-else class="loading-state">Loading...</div>
        </div>
      </div>

      <!-- Stats Side -->
      <div class="stats-side">
        <!-- Temp Stats -->
        <div class="card stat-box border-l-optimal">
          <div class="stat-box-header">
            <h3>TEMP STATS ({{ periodLabel }})</h3>
            <ThermometerIcon class="icon-muted" />
          </div>
          <div class="stat-metrics">
            <div class="metric">
              <span class="label">MAX</span>
              <span class="value text-critical">{{ stats.temp_max }}</span>
            </div>
            <div class="metric highlight">
              <span class="label">AVG</span>
              <span class="value text-optimal">{{ stats.temp_avg }}</span>
            </div>
            <div class="metric">
              <span class="label">MIN</span>
              <span class="value">{{ stats.temp_min }}</span>
            </div>
          </div>
        </div>
        
        <!-- Humidity Stats -->
        <div class="card stat-box border-l-dark">
          <div class="stat-box-header">
            <h3>HUMIDITY STATS ({{ periodLabel }})</h3>
            <DropletsIcon class="icon-muted" />
          </div>
          <div class="stat-metrics">
            <div class="metric">
              <span class="label">MAX</span>
              <span class="value">{{ stats.humidity_max }}%</span>
            </div>
            <div class="metric highlight">
              <span class="label">AVG</span>
              <span class="value">{{ stats.humidity_avg }}%</span>
            </div>
            <div class="metric">
              <span class="label">MIN</span>
              <span class="value text-critical">{{ stats.humidity_min }}%</span>
            </div>
          </div>
        </div>

        <!-- Quick Export -->
        <div class="card export-box">
          <h3>QUICK EXPORT</h3>
          <button class="export-btn" @click="exportData">
            <FileSpreadsheetIcon class="icon-sm" /> Download CSV
            <ChevronRightIcon class="icon-sm ml-auto" />
          </button>
          <button class="export-btn" @click="exportData">
            <FileTextIcon class="icon-sm" /> Summary Report (PDF)
            <ChevronRightIcon class="icon-sm ml-auto" />
          </button>
        </div>
      </div>
    </div>

    <!-- Middle Grid: Humidity Area Chart -->
    <div class="card hum-trend-card">
      <div class="card-header">
        <h3>HUMIDITY LEVEL TREND (%)</h3>
        <span class="avg-label">Avg. Stability: 94.2%</span>
      </div>
      <div class="chart-body hum-chart-body">
        <Line v-if="humChartData.datasets?.length" :data="humChartData" :options="humChartOptions" />
        <div v-else class="loading-state">Loading...</div>
      </div>
    </div>

    <!-- Bottom Grid: Raw Logs Table -->
    <div class="card table-card">
      <div class="card-header table-header">
        <h3>RAW LOGS - RECENT READINGS</h3>
        <div class="search-box">
          <SearchIcon class="icon-sm search-icon" />
          <input type="text" v-model="searchQuery" placeholder="Filter log..." @input="debounceSearch" />
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>SENSOR ID</th>
              <th>TEMP (°C)</th>
              <th>HUMIDITY (%)</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.timestamp }}</td>
              <td>{{ log.sensor_id }}</td>
              <td :class="{'text-critical': log.status === 'critical', 'text-warning': log.status === 'warning'}">
                <strong>{{ log.temperature }}°C</strong>
              </td>
              <td :class="{'text-critical': log.status === 'critical', 'text-warning': log.status === 'warning'}">
                {{ log.humidity }}%
              </td>
              <td>
                <span :class="['badge', log.status.toLowerCase()]">{{ log.status.toUpperCase() }}</span>
              </td>
              <td>
                <span class="action-link" @click="goToDetails(log.pen_name)">View Details</span>
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No data found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="page-info">Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalLogs) }} of {{ totalLogs }} entries</span>
        <div class="page-controls">
          <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)"><ChevronLeftIcon class="icon-sm" /></button>
          <button v-for="p in displayPages" :key="p" :class="{ active: p === currentPage }" @click="changePage(p)">
             {{ p }}
          </button>
          <button :disabled="currentPage === totalPages || totalPages === 0" @click="changePage(currentPage + 1)"><ChevronRightIcon class="icon-sm" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { usePenStore } from '@/stores/pens'
import { 
  LightbulbIcon, DownloadIcon, ThermometerIcon, DropletsIcon, 
  FileSpreadsheetIcon, FileTextIcon, ChevronRightIcon, SearchIcon,
  ChevronLeftIcon
} from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const router = useRouter()
const penStore = usePenStore()
const api = axios.create({ baseURL: '/api' })

const period = ref('24h')
const selectedPenId = ref('')
const periodLabel = computed(() => {
  if (period.value === '24h') return '24H'
  if (period.value === '7d') return '7D'
  return '30D'
})

// Data Refs
const trendData = ref([])
const stats = ref({
  temp_max: 0, temp_avg: 0, temp_min: 0,
  humidity_max: 0, humidity_avg: 0, humidity_min: 0
})

const logs = ref([])
const totalLogs = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10
const searchQuery = ref('')
let searchTimeout = null

// Fetching
const fetchTrend = async () => {
  try {
    const url = `/analytics/trend?period=${period.value}` + (selectedPenId.value ? `&pen_id=${selectedPenId.value}` : '')
    const res = await api.get(url)
    trendData.value = res.data
  } catch (e) { console.error(e) }
}

const fetchStats = async () => {
  try {
    const url = `/analytics/stats?period=${period.value}` + (selectedPenId.value ? `&pen_id=${selectedPenId.value}` : '')
    const res = await api.get(url)
    stats.value = res.data
  } catch (e) { console.error(e) }
}

const fetchLogs = async () => {
  try {
    const res = await api.get(`/analytics/rawlogs`, {
      params: {
        page: currentPage.value,
        page_size: pageSize,
        filter_text: searchQuery.value || undefined,
        pen_id: selectedPenId.value || undefined
      }
    })
    logs.value = res.data.data
    totalLogs.value = res.data.total
    totalPages.value = res.data.total_pages
  } catch (e) { console.error(e) }
}

const loadData = async () => {
  await Promise.all([fetchTrend(), fetchStats(), fetchLogs()])
  if (penStore.pens.length === 0) {
    await penStore.fetchPens()
  }
}

onMounted(() => {
  loadData()
})

const setPeriod = (p) => {
  period.value = p
  loadData()
}

// Table Controls
const debounceSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchLogs()
  }, 300)
}

const changePage = (p) => {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  fetchLogs()
}

const displayPages = computed(() => {
  const pages = []
  const maxPagesToShow = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxPagesToShow / 2))
  let end = Math.min(totalPages.value, start + maxPagesToShow - 1)
  
  if (end - start + 1 < maxPagesToShow) {
    start = Math.max(1, end - maxPagesToShow + 1)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const goToDetails = (penName) => {
  const pen = penStore.pens.find(p => p.name === penName)
  if (pen) {
    router.push(`/pens/${pen.id}`)
  }
}

const exportData = () => {
  let url = `http://localhost:8000/api/analytics/export/csv?period=${period.value}`
  if (selectedPenId.value) url += `&pen_id=${selectedPenId.value}`
  window.open(url, '_blank')
}

// Charts Configuration
const trendChartData = computed(() => {
  if (!trendData.value.length) return { labels: [], datasets: [] }
  return {
    labels: trendData.value.map(d => d.label),
    datasets: [
      {
        label: 'ACTUAL',
        data: trendData.value.map(d => d.temperature),
        borderColor: '#10b981', // optimal color
        backgroundColor: '#10b981',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 2
      }
    ]
  }
})

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { display: false, min: 20, max: 40 }
  }
}

const humChartData = computed(() => {
  if (!trendData.value.length) return { labels: [], datasets: [] }
  return {
    labels: trendData.value.map(d => d.label),
    datasets: [
      {
        label: 'HUMIDITY',
        data: trendData.value.map(d => d.humidity),
        borderColor: '#64748b',
        backgroundColor: 'rgba(100, 116, 139, 0.1)',
        borderWidth: 1.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }
    ]
  }
})

const humChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: { display: false },
    y: { display: false, min: 50, max: 100 }
  }
}
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: var(--c-text-main);
  background: var(--c-bg);
  min-height: 100%;
}

/* Header */
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.analytics-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--c-sidebar-bg);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.period-toggle {
  display: flex;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  overflow: hidden;
}
.custom-select {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background: white;
  color: var(--c-text-main);
  font-weight: 600;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
}
.period-toggle button {
  border: none;
  background: none;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-text-muted);
  cursor: pointer;
  border-right: 1px solid var(--c-border);
}
.period-toggle button:last-child {
  border-right: none;
}
.period-toggle button.active {
  background: var(--c-bg);
  color: var(--c-text-main);
}
.btn-export {
  display: flex;
  align-items: center;
  background: var(--c-sidebar-bg);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-export:hover {
  background: var(--c-sidebar-active-bg);
}

/* Insight Banner */
.insight-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #d1fae5;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-md);
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
  opacity: 0.9;
}

/* Grids */
.top-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
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
  color: var(--c-text-muted);
}
.legend-mini {
  font-size: 0.75rem;
  display: flex;
  gap: 1rem;
  color: var(--c-text-muted);
  font-weight: 600;
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}
.dot.actual { background: var(--c-optimal); }
.dot.optimal { background: #e2e8f0; }

.chart-body {
  height: 250px;
}
.loading-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text-muted);
}

/* Stats */
.stats-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.stat-box {
  padding: 1.25rem;
}
.border-l-optimal { border-left: 4px solid var(--c-optimal); }
.border-l-dark { border-left: 4px solid var(--c-sidebar-bg); }

.stat-box-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.stat-box-header h3 {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--c-text-muted);
}
.stat-metrics {
  display: flex;
  justify-content: space-between;
  text-align: center;
}
.metric {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.metric.highlight {
  background: var(--c-bg);
  border-radius: var(--radius-md);
  padding: 0.25rem 0;
}
.metric .label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--c-text-muted);
}
.metric .value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--c-text-main);
}
.text-critical { color: var(--c-critical); }
.text-optimal { color: var(--c-optimal); }

.export-box {
  background: var(--c-sidebar-bg);
  color: white;
  padding: 1.25rem;
  flex: 1;
}
.export-box h3 {
  font-size: 0.85rem;
  color: var(--c-text-muted);
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
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.export-btn:hover { background: rgba(255,255,255,0.1); }
.export-btn svg { margin-right: 0.75rem; }

/* Middle Grid */
.hum-chart-body {
  height: 120px;
}
.avg-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--c-text-main);
}

/* Table */
.table-header {
  margin-bottom: 0;
}
.search-box {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-text-muted);
}
.search-box input {
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  outline: none;
  width: 250px;
}
.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--c-text-muted);
  text-transform: uppercase;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
}
.data-table td {
  padding: 1rem;
  font-size: 0.9rem;
  border-bottom: 1px solid var(--c-border);
}
.data-table tbody tr:hover {
  background: var(--c-bg);
}
.action-link {
  color: var(--c-optimal);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.action-link:hover { text-decoration: underline; }

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
}
.page-info {
  font-size: 0.85rem;
  color: var(--c-text-muted);
}
.page-controls {
  display: flex;
  gap: 0.25rem;
}
.page-controls button {
  background: white;
  border: 1px solid var(--c-border);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--c-text-main);
}
.page-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
.page-controls button.active {
  background: var(--c-sidebar-bg);
  color: white;
  border-color: var(--c-sidebar-bg);
}

@media (max-width: 1024px) {
  .top-grid { grid-template-columns: 1fr; }
  .analytics-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .header-actions { width: 100%; justify-content: space-between; }
}
</style>
