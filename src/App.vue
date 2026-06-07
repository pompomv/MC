<template>
  <div class="app-layout" v-if="authStore.isAuthReady">
    <template v-if="$route.meta.requiresAuth">
      <SideBar />
      
      <div class="main-content">
        <TopBar />
        
        <main class="page-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>

      <!-- Toast notifikasi global, tampil di halaman yang butuh auth -->
      <ToastNotification />
      <!-- Panel notifikasi (dibuka dari sidebar) -->
      <NotificationPanel />
    </template>
    
    <template v-else>
      <!-- Layout khusus untuk login / halaman publik -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </template>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
import { useSensorStore } from '@/stores/sensor'
import { useAuthStore } from '@/stores/auth'
import SideBar from '@/components/layout/SideBar.vue'
import TopBar from '@/components/layout/TopBar.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import NotificationPanel from '@/components/NotificationPanel.vue'

const sensorStore = useSensorStore()
const authStore = useAuthStore()

// Pantau perubahan status user
watch(() => authStore.user, (user) => {
  if (user) {
    sensorStore.connectWebSocket()
  } else {
    sensorStore.disconnectWebSocket()
  }
})

// Ketika app pertama kali direfresh, jika user sudah login dari session sebelumnya, koneksikan
onMounted(() => {
  if (authStore.user) {
    sensorStore.connectWebSocket()
  }
})

onUnmounted(() => {
  sensorStore.disconnectWebSocket()
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
