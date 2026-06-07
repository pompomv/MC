import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotifStore = defineStore('notif', () => {
  const toasts = ref([])    // Toast pop-up sementara (auto-dismiss)
  const history = ref([])   // Riwayat permanen di panel sidebar
  const showPanel = ref(false) // Kontrol visibilitas panel notifikasi

  function push({ title, message, type = 'warning' }) {
    const id = Date.now()
    const time = new Date().toLocaleTimeString()

    // Tambah ke toast (sementara)
    toasts.value.push({ id, title, message, type, time })
    setTimeout(() => dismiss(id), 6000)

    // Tambah ke history (permanen, max 50)
    history.value.push({ id, title, message, type, time, read: false })
    if (history.value.length > 50) history.value.shift()
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function clearHistory() {
    history.value = []
  }

  return { toasts, history, showPanel, push, dismiss, clearHistory }
})
