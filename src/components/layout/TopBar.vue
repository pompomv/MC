<template>
  <header class="topbar">
    <div class="page-title">
      <h1 v-if="$route.name === 'dashboard'">Dashboard Utama</h1>
      <h1 v-else-if="$route.name === 'pens-list'">Semua Kandang</h1>
      <h1 v-else-if="$route.name === 'analytics'">Analytics & History</h1>
      <h1 v-else-if="$route.name === 'settings'">Threshold Configuration <span class="badge" style="background: var(--c-accent); color: var(--c-sidebar-bg);">SYSTEM CONTROL</span></h1>
      <div v-else class="breadcrumbs">
        <span class="text-muted">Monitoring</span> <span class="separator">/</span> <strong>{{ penDisplayName }}</strong>
      </div>
    </div>
    
    <div class="actions">
      <button class="icon-btn" @click="notifStore.showPanel = true">
        <Bell class="icon" />
      </button>
      
      <div class="user-profile">
        <div class="avatar">
          <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" />
        </div>
        <div class="user-info">
          <span class="name">Admin</span>
        </div>
      </div>

      <button class="icon-btn logout-btn" @click="handleLogout" title="Keluar">
        <LogOut class="icon" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, LogOut } from 'lucide-vue-next'
import { usePenStore } from '@/stores/pens'
import { useNotifStore } from '@/stores/notif'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const penStore = usePenStore()
const notifStore = useNotifStore()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Format pen ID jadi nama yang mudah dibaca
// contoh: kandang_01 → Kandang 01
const penDisplayName = computed(() => {
  if (penStore.currentPen?.name) return penStore.currentPen.name
  const id = route.params.id
  if (!id) return 'Detail'
  return String(id)
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
})
</script>

<style scoped>
.topbar {
  height: 70px;
  background-color: var(--c-card);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 10;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--c-text-main);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.breadcrumbs {
  font-size: 0.9rem;
}

.separator {
  margin: 0 0.5rem;
  color: var(--c-text-muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--c-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  cursor: pointer;
}

.icon-btn:hover {
  color: var(--c-text-main);
}

.logout-btn:hover {
  color: #ef4444;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--c-bg);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
