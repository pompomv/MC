<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <h2>BSF IoT Monitor</h2>
          <p>Precision Larvae Tech</p>
        </div>
        <h3 class="login-title">Masuk ke Dashboard</h3>
        <p class="login-subtitle">Masukkan email dan password admin Anda</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="authStore.error" class="error-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {{ authStore.error }}
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="admin@bsf.com"
            required
            :disabled="authStore.isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="••••••••"
            required
            :disabled="authStore.isLoading"
          />
        </div>

        <button type="submit" class="btn-login" :disabled="authStore.isLoading">
          <span v-if="authStore.isLoading" class="spinner"></span>
          <span v-else>Masuk Sekarang</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Hanya staf internal yang memiliki akses ke dashboard ini.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  if (!email.value || !password.value) return
  
  const success = await authStore.login(email.value, password.value)
  if (success) {
    // Redirect ke dashboard setelah login sukses
    router.push('/')
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--c-bg);
  background-image: radial-gradient(at 0% 0%, hsla(158,100%,74%,0.15) 0px, transparent 50%),
                    radial-gradient(at 100% 0%, hsla(213,100%,74%,0.15) 0px, transparent 50%);
  padding: 1rem;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
  padding: 2.5rem;
  border: 1px solid rgba(255,255,255,0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  background: var(--c-sidebar-bg);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: inline-block;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.logo h2 {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.logo p {
  color: var(--c-sidebar-text);
  font-size: 0.75rem;
  margin: 0;
  opacity: 0.8;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--c-text-main);
  margin: 0 0 0.5rem 0;
}

.login-subtitle {
  color: var(--c-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
  background: #f8fafc;
}

.form-group input:focus {
  outline: none;
  border-color: var(--c-accent);
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15);
}

.form-group input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-login {
  width: 100%;
  background: var(--c-sidebar-bg);
  color: white;
  border: none;
  padding: 0.85rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
  margin-top: 1.5rem;
}

.btn-login:hover:not(:disabled) {
  background: #1e293b;
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  border-top: 1px solid var(--c-border);
  padding-top: 1.5rem;
}

.login-footer p {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  margin: 0;
}
</style>
