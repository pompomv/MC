<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="notifStore.showPanel" class="notif-overlay" @click.self="notifStore.showPanel = false">
        <div class="notif-panel">
          <div class="panel-header">
            <div>
              <h3>Notifikasi</h3>
              <p class="panel-sub">{{ notifStore.history.length }} total peringatan</p>
            </div>
            <div class="panel-actions">
              <button class="btn-clear" @click="notifStore.clearHistory" v-if="notifStore.history.length">Hapus Semua</button>
              <button class="btn-close" @click="notifStore.showPanel = false">✕</button>
            </div>
          </div>

          <div class="panel-body">
            <div v-if="notifStore.history.length === 0" class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>Belum ada notifikasi</p>
              <span>Notifikasi muncul saat status kandang berubah</span>
            </div>

            <div
              v-for="notif in [...notifStore.history].reverse()"
              :key="notif.id"
              :class="['notif-item', notif.type]"
            >
              <div class="notif-dot" :class="notif.type"></div>
              <div class="notif-content">
                <div class="notif-title">{{ notif.title }}</div>
                <div class="notif-msg">{{ notif.message }}</div>
                <div class="notif-time">{{ notif.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useNotifStore } from '@/stores/notif'
const notifStore = useNotifStore()
</script>

<style scoped>
.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
}

.notif-panel {
  position: fixed;
  top: 0;
  left: 260px;
  width: 360px;
  height: 100vh;
  background: #fff;
  box-shadow: 4px 0 30px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  z-index: 1001;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.panel-sub {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.2rem 0 0;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-clear {
  font-size: 0.78rem;
  color: #ef4444;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}
.btn-clear:hover { background: #fee2e2; }

.btn-close {
  background: #f1f5f9;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 0.8rem;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-close:hover { background: #e2e8f0; }

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  gap: 0.5rem;
  text-align: center;
}
.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
}
.empty-state p {
  font-weight: 600;
  color: #64748b;
  margin: 0;
}
.empty-state span { font-size: 0.82rem; }

.notif-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  align-items: flex-start;
}
.notif-item.warning  { border-color: #fbbf24; background: #fffbeb; }
.notif-item.critical { border-color: #f87171; background: #fff1f2; }

.notif-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
.notif-dot.warning  { background: #f59e0b; }
.notif-dot.critical { background: #ef4444; }

.notif-content { flex: 1; min-width: 0; }
.notif-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.2rem;
}
.notif-msg {
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.4;
}
.notif-time {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 0.3rem;
}

.panel-enter-active { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease; }
.panel-leave-active { transition: transform 0.2s ease-in, opacity 0.2s ease; }
.panel-enter-from, .panel-leave-to { transform: translateX(-20px); opacity: 0; }
</style>
