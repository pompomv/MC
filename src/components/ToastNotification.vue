<template>
  <Teleport to="body">
    <div class="toast-wrapper">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in notifStore.toasts"
          :key="toast.id"
          :class="['toast', toast.type]"
        >
          <div class="toast-icon">
            <svg v-if="toast.type === 'critical'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <div class="toast-body">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
            <div class="toast-time">{{ toast.time }}</div>
          </div>

          <button class="toast-close" @click="notifStore.dismiss(toast.id)">✕</button>

          <div class="toast-progress">
            <div class="toast-progress-bar"></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotifStore } from '@/stores/notif'
const notifStore = useNotifStore()
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 360px;
  width: 100%;
}

.toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.18);
  overflow: hidden;
  backdrop-filter: blur(12px);
  border: 1px solid transparent;
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast.warning {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-color: #fbbf24;
  color: #78350f;
}

.toast.critical {
  background: linear-gradient(135deg, #fff1f2, #ffe4e6);
  border-color: #f87171;
  color: #7f1d1d;
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), pulse-border 1.5s ease-in-out infinite;
}

.toast-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.1rem;
}

.toast.warning .toast-icon {
  background: #fef08a;
  color: #d97706;
}

.toast.critical .toast-icon {
  background: #fecdd3;
  color: #dc2626;
}

.toast-icon svg {
  width: 18px;
  height: 18px;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.toast-message {
  font-size: 0.82rem;
  opacity: 0.85;
  line-height: 1.4;
}

.toast-time {
  font-size: 0.75rem;
  opacity: 0.55;
  margin-top: 0.35rem;
}

.toast-close {
  background: none;
  border: none;
  font-size: 0.8rem;
  opacity: 0.5;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: inherit;
  flex-shrink: 0;
}

.toast-close:hover { opacity: 1; }

/* Progress bar countdown */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0,0,0,0.08);
}

.toast-progress-bar {
  height: 100%;
  width: 100%;
  animation: countdown 6s linear forwards;
}

.toast.warning .toast-progress-bar { background: #f59e0b; }
.toast.critical .toast-progress-bar { background: #ef4444; }

/* Animations */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(110%); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes countdown {
  from { width: 100%; }
  to   { width: 0%; }
}

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 8px 30px rgba(239,68,68,0.2); }
  50%       { box-shadow: 0 8px 30px rgba(239,68,68,0.5); }
}

/* TransitionGroup */
.toast-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.25s ease-in; }
.toast-enter-from  { opacity: 0; transform: translateX(110%); }
.toast-leave-to    { opacity: 0; transform: translateX(110%) scale(0.95); }
</style>
