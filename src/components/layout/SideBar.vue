<template>
  <aside class="sidebar">
    <div class="logo">
      <h2>BSF IoT Monitor</h2>
      <p>Precision Larvae Tech</p>
    </div>
    
    <nav class="nav-menu">
      <router-link to="/" class="nav-item" active-class="active">
        <LayoutDashboard class="icon" />
        <span>Dashboard</span>
      </router-link>
      
      <router-link to="/pens/1" class="nav-item" :class="{ active: $route.name === 'pen-detail' }">
        <Grid3x3 class="icon" />
        <span>All Pens (Kandang)</span>
      </router-link>
      
      <router-link to="/analytics" class="nav-item" active-class="active">
        <BarChart2 class="icon" />
        <span>Analytics</span>
      </router-link>
      
      <div class="nav-item">
        <Bell class="icon" />
        <span>Notifications</span>
        <span class="notification-dot" v-if="hasUnread"></span>
      </div>
    </nav>
    
    <div class="bottom-menu">
      <router-link to="/settings" class="nav-item" active-class="active">
        <Settings class="icon" />
        <span>Settings</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { LayoutDashboard, Grid3x3, BarChart2, Bell, Settings } from 'lucide-vue-next'

const hasUnread = ref(true)
</script>

<style scoped>
.sidebar {
  width: 260px;
  background-color: var(--c-sidebar-bg);
  color: var(--c-sidebar-text);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo {
  padding: 2rem 1.5rem;
}

.logo h2 {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.logo p {
  font-size: 0.85rem;
  opacity: 0.7;
}

.nav-menu {
  flex: 1;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  color: var(--c-sidebar-text);
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background-color: var(--c-accent);
  color: var(--c-sidebar-bg);
}

.icon {
  width: 20px;
  height: 20px;
}

.notification-dot {
  position: absolute;
  right: 1rem;
  width: 8px;
  height: 8px;
  background-color: var(--c-critical);
  border-radius: 50%;
}

.bottom-menu {
  padding: 1rem;
}
</style>
