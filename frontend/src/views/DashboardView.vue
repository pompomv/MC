<template>
  <div class="dashboard">
    <div class="header-content">
      <div>
        <h2>Pen Management</h2>
        <p class="text-muted">Real-time status of Black Soldier Fly breeding units.</p>
      </div>
      <button class="btn-primary" @click="addPen">
        + ADD NEW PEN
      </button>
    </div>

    <div v-if="penStore.loading && !penStore.pens.length" class="loading">
      Loading pens data...
    </div>

    <div v-else class="pens-grid">
      <!-- Pen Cards -->
      <div 
        v-for="pen in penStore.pens" 
        :key="pen.id" 
        class="card pen-card"
        :class="{
          'border-optimal': pen.last_status === 'optimal',
          'border-warning': pen.last_status === 'warning',
          'border-critical': pen.last_status === 'critical'
        }"
      >
        <div class="card-header">
          <h3 class="pen-name">{{ pen.name }}</h3>
          <span class="badge" :class="pen.last_status">
            <span class="dot"></span> {{ pen.last_status }}
          </span>
        </div>

        <div class="metrics" v-if="pen.latest_reading">
          <div class="metric-box">
            <span class="label">TEMP</span>
            <div class="value">
              {{ pen.latest_reading.temperature.toFixed(1) }}<span class="unit">°C</span>
            </div>
          </div>
          <div class="metric-box">
            <span class="label">HUMIDITY</span>
            <div class="value">
              {{ pen.latest_reading.humidity.toFixed(0) }}<span class="unit">%</span>
            </div>
          </div>
        </div>
        <div class="metrics empty" v-else>
          Waiting for sensor data...
        </div>

        <!-- Simulated history data for chart -->
        <MiniChart 
          v-if="pen.latest_reading"
          :data="generateChartData(pen.latest_reading.temperature)" 
          :color="getStatusColor(pen.last_status)"
        />

        <div class="card-footer">
          <router-link :to="`/pens/${pen.id}`" class="btn-outline w-full text-center">
            VIEW DETAILS →
          </router-link>
        </div>
      </div>

      <!-- Add New Placeholder -->
      <div class="card add-card" @click="addPen">
        <div class="add-icon">+</div>
        <h3>Add New Pen</h3>
        <p>Connect a new IoT sensor module</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePenStore } from '@/stores/pens'
import MiniChart from '@/components/charts/MiniChart.vue'

const penStore = usePenStore()

onMounted(() => {
  penStore.fetchPens()
})

const getStatusColor = (status) => {
  switch (status) {
    case 'optimal': return '#10b981'
    case 'warning': return '#f59e0b'
    case 'critical': return '#ef4444'
    default: return '#94a3b8'
  }
}

// Generate some fake history data based on current value for the mini chart
const generateChartData = (currentVal) => {
  const data = []
  let val = currentVal
  for (let i = 0; i < 10; i++) {
    data.unshift(val)
    val = val + (Math.random() * 2 - 1)
  }
  return data
}

const addPen = async () => {
  // In a real app, this would open a modal
  alert('Feature to add new pen will be implemented here')
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content h2 {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.text-muted {
  color: var(--c-text-muted);
  font-size: 0.9rem;
}

.pens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.pen-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  border-left-width: 4px;
}

.pen-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.border-optimal { border-left-color: var(--c-optimal); }
.border-warning { border-left-color: var(--c-warning); }
.border-critical { border-left-color: var(--c-critical); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.pen-name {
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-text-main);
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  margin-right: 0.35rem;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.metrics.empty {
  color: var(--c-text-muted);
  font-style: italic;
  font-size: 0.9rem;
  padding: 1rem 0;
}

.metric-box {
  background-color: var(--c-bg);
  padding: 1rem;
  border-radius: var(--radius-md);
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--c-text-muted);
  letter-spacing: 0.05em;
}

.value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--c-text-main);
  line-height: 1.2;
  margin-top: 0.25rem;
}

.unit {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--c-text-muted);
  margin-left: 0.15rem;
}

.card-footer {
  margin-top: auto;
  padding-top: 1.5rem;
}

.w-full {
  width: 100%;
  display: block;
}

.text-center {
  text-align: center;
}

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px dashed var(--c-border);
  background-color: transparent;
  cursor: pointer;
  min-height: 300px;
  transition: all 0.2s;
}

.add-card:hover {
  border-color: var(--c-text-muted);
  background-color: var(--c-bg);
}

.add-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--c-text-muted);
  margin-bottom: 1rem;
}

.add-card h3 {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.add-card p {
  font-size: 0.875rem;
  color: var(--c-text-muted);
}
</style>
