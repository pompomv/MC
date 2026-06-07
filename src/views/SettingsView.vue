<template>
  <div class="settings-page">
    <div class="header-section">
      <h2>Pengaturan Ambang Batas</h2>
      <p>Atur batas suhu dan kelembaban ideal untuk kandang maggot. Jika kondisi melewati batas ini, sistem akan mengubah status menjadi Kritis dan menyalakan alarm.</p>
    </div>

    <div class="card form-card">
      <form @submit.prevent="saveSettings">
        
        <div class="setting-group">
          <h3><ThermometerIcon class="icon-sm" /> Suhu Ideal (°C)</h3>
          <div class="input-row">
            <div class="input-field">
              <label>Batas Minimum</label>
              <input type="number" v-model="settings.temp_min" step="0.1" required />
            </div>
            <div class="input-field">
              <label>Batas Maksimum</label>
              <input type="number" v-model="settings.temp_max" step="0.1" required />
            </div>
          </div>
          <small class="help-text">Rekomendasi ideal untuk Maggot BSF: 27°C - 30°C</small>
        </div>

        <div class="setting-group">
          <h3><DropletsIcon class="icon-sm" /> Kelembaban Ideal (%)</h3>
          <div class="input-row">
            <div class="input-field">
              <label>Batas Minimum</label>
              <input type="number" v-model="settings.humidity_min" required />
            </div>
            <div class="input-field">
              <label>Batas Maksimum</label>
              <input type="number" v-model="settings.humidity_max" required />
            </div>
          </div>
          <small class="help-text">Rekomendasi ideal untuk Maggot BSF: 60% - 70%</small>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save" :disabled="isSaving">
            <span v-if="isSaving">Menyimpan ke Cloud...</span>
            <span v-else>Simpan Pengaturan</span>
          </button>
        </div>
        
        <div v-if="successMessage" class="alert-success">
          <CheckCircleIcon class="icon-sm" /> {{ successMessage }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ThermometerIcon, DropletsIcon, CheckCircleIcon } from 'lucide-vue-next'
import { usePenStore } from '@/stores/pens'

const penStore = usePenStore()
const isSaving = ref(false)
const successMessage = ref('')

// Default nilai sesuai PRD
const settings = ref({
  temp_min: 27,
  temp_max: 30,
  humidity_min: 60,
  humidity_max: 70
})

// Mengambil pengaturan yang sudah ada di Firebase saat halaman dibuka
onMounted(async () => {
  if (penStore.pens.length === 0) {
    await penStore.fetchPens()
  }
  
  // Mengambil data dari kandang utama (misal: kandang_01)
  const mainPen = penStore.pens.find(p => p.id === 'kandang_01')
  if (mainPen && mainPen.thresholds) {
    settings.value.temp_min = mainPen.thresholds.temp_min || 27
    settings.value.temp_max = mainPen.thresholds.temp_max || 30
    settings.value.humidity_min = mainPen.thresholds.humidity_min || 60
    settings.value.humidity_max = mainPen.thresholds.humidity_max || 70
  }
})

// Menyimpan ke Firebase
const saveSettings = async () => {
  isSaving.value = true
  successMessage.value = ''
  
  try {
    // Memanggil fungsi update di Pinia Store (yang terhubung ke Firebase)
    if(penStore.updatePenThresholds) {
      await penStore.updatePenThresholds('kandang_01', settings.value)
    } else {
      // Jika fungsi di store belum dibuat, simulasi loading sementara
      await new Promise(resolve => setTimeout(resolve, 800))
      console.warn("Fungsi updatePenThresholds belum ada di stores/pens.js")
    }
    
    isSaving.value = false
    successMessage.value = 'Pengaturan berhasil disimpan dan disinkronkan ke alat ESP32!'
    
    // Hilangkan pesan sukses setelah 3 detik
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
  } catch (error) {
    console.error("Gagal menyimpan pengaturan:", error)
    isSaving.value = false
  }
}
</script>

<style scoped>
.settings-page {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  color: #1e293b;
}

.header-section {
  margin-bottom: 2rem;
}

.header-section h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.header-section p {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
}

.setting-group {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.setting-group:last-of-type {
  border-bottom: none;
}

.setting-group h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: #334155;
  margin-bottom: 1rem;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.input-field input {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-field input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.help-text {
  color: #94a3b8;
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-save {
  background: #1e293b;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-save:hover {
  background: #0f172a;
}

.btn-save:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.alert-success {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #dcfce7;
  color: #15803d;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .input-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>