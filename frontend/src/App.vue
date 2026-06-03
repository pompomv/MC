<template>
  <div class="app-layout">
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useSensorStore } from '@/stores/sensor'
import SideBar from '@/components/layout/SideBar.vue'
import TopBar from '@/components/layout/TopBar.vue'

const sensorStore = useSensorStore()

onMounted(() => {
  sensorStore.connectWebSocket()
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
