<template>
  <header class="topbar">
    <div class="page-title">
      <h1 v-if="$route.name === 'dashboard'">Daftar Kandang</h1>
      <h1 v-else-if="$route.name === 'analytics'">Analytics & History</h1>
      <h1 v-else-if="$route.name === 'settings'">Threshold Configuration <span class="badge" style="background: var(--c-accent); color: var(--c-sidebar-bg);">SYSTEM CONTROL</span></h1>
      <div v-else class="breadcrumbs">
        <span class="text-muted">Monitoring</span> <span class="separator">/</span> <strong>{{ penStore.currentPen?.name || 'Loading...' }}</strong>
      </div>
    </div>
    
    <div class="actions">
      <button class="icon-btn">
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
    </div>
  </header>
</template>

<script setup>
import { Bell } from 'lucide-vue-next'
import { usePenStore } from '@/stores/pens'

const penStore = usePenStore()
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
}

.icon-btn:hover {
  color: var(--c-text-main);
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
