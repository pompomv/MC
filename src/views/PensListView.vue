<template>
  <div class="pens-container">
    <div class="page-header">
      <div>
        <h2>Daftar Semua Kandang</h2>
        <p class="subtitle">Pantau seluruh kandang secara real-time</p>
      </div>
    </div>

    <div v-if="penStore.pens.length > 0" class="pens-grid">
      <div v-for="pen in penStore.pens" :key="pen.id" class="pen-card">
        <div class="card-header">
          <div>
            <h3>{{ formatPenName(pen) }}</h3>
            <p class="location">{{ pen.location || pen.id }}</p>
          </div>
          <span class="badge" :class="pen.last_status?.toLowerCase() === 'critical' ? 'critical' : (pen.last_status?.toLowerCase() === 'warning' ? 'warning' : 'normal')">
            {{ pen.last_status || 'Normal' }}
          </span>
        </div>

        <div class="metrics-grid">
          <div class="metric-box">
            <span class="metric-label">Suhu</span>
            <div class="metric-value-container">
              <span class="metric-value" :class="{ 'text-danger': isTempCritical(pen) }">
                {{ pen.latest_reading?.temperature || '--' }}<small>°C</small>
              </span>
            </div>
            <span class="metric-target" v-if="pen.thresholds">
              Target: {{ pen.thresholds.temp_min }}-{{ pen.thresholds.temp_max }}°C
            </span>
          </div>
          
          <div class="metric-box">
            <span class="metric-label">Kelembaban</span>
            <div class="metric-value-container">
              <span class="metric-value" :class="{ 'text-danger': isHumCritical(pen) }">
                {{ pen.latest_reading?.humidity || '--' }}<small>%</small>
              </span>
            </div>
            <span class="metric-target" v-if="pen.thresholds">
              Target: {{ pen.thresholds.humidity_min }}-{{ pen.thresholds.humidity_max }}%
            </span>
          </div>
        </div>

        <div class="card-actions">
          <router-link :to="`/pens/${pen.id}`" class="btn-detail">
            Lihat Detail Kandang →
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="loading-panel">
      <div class="spinner"></div>
      <p>Memuat daftar kandang...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePenStore } from '@/stores/pens'

const penStore = usePenStore()

onMounted(async () => {
  if (penStore.pens.length === 0) {
    await penStore.fetchPens()
  }
})

// Helper untuk format nama kandang
const formatPenName = (pen) => {
  if (pen.name) return pen.name
  return String(pen.id || '')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Logika validasi critical
const isTempCritical = (pen) => {
  if (!pen.latest_reading || !pen.thresholds) return false
  const t = pen.latest_reading.temperature
  const th = pen.thresholds
  return t < th.temp_min || t > th.temp_max
}

const isHumCritical = (pen) => {
  if (!pen.latest_reading || !pen.thresholds) return false
  const h = pen.latest_reading.humidity
  const th = pen.thresholds
  return h < th.humidity_min || h > th.humidity_max
}
</script>

<style scoped>
.pens-container {
  padding: 1.5rem;
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.subtitle {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.pens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.pen-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid transparent;
}

.pen-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  border-color: #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.location {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.badge {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.badge.normal { background: #dcfce7; color: #15803d; }
.badge.warning { background: #fef3c7; color: #b45309; }
.badge.critical { background: #fee2e2; color: #b91c1c; animation: pulse 2s infinite; }

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex: 1;
}

.metric-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.metric-value-container {
  display: flex;
  align-items: baseline;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.metric-value small {
  font-size: 1rem;
  font-weight: 600;
  color: #94a3b8;
  margin-left: 0.15rem;
}

.text-danger { color: #ef4444; }

.metric-target {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.card-actions {
  margin-top: auto;
}

.btn-detail {
  display: block;
  width: 100%;
  text-align: center;
  background: #f1f5f9;
  color: #0f172a;
  padding: 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-detail:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.loading-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #64748b;
  height: 50vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #34d399;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

@media (max-width: 640px) {
  .pens-grid { grid-template-columns: 1fr; }
}
</style>
