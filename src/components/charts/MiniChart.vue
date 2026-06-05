<template>
  <div class="chart-container">
    <Line v-if="chartData.datasets.length" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
)

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  color: {
    type: String,
    default: '#10b981' // var(--c-optimal)
  }
})

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return { labels: [], datasets: [] }
  
  return {
    labels: props.data.map((_, i) => i.toString()),
    datasets: [
      {
        data: props.data,
        borderColor: props.color,
        borderWidth: 2,
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    }
  },
  scales: {
    x: {
      display: false
    },
    y: {
      display: false,
      min: Math.min(...(props.data.length ? props.data : [0])) - 5,
      max: Math.max(...(props.data.length ? props.data : [100])) + 5,
    }
  },
  animation: false,
  layout: {
    padding: 0
  }
}
</script>

<style scoped>
.chart-container {
  height: 60px;
  width: 100%;
  margin-top: 1.5rem;
}
</style>
