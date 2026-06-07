import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from '@/config/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthReady = ref(false)
  const error = ref(null)
  const isLoading = ref(false)

  // Inisialisasi listener untuk memantau status login
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
    isAuthReady.value = true
  })

  const login = async (email, password) => {
    error.value = null
    isLoading.value = true
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return true
    } catch (err) {
      console.error('Login error:', err)
      switch (err.code) {
        case 'auth/invalid-email':
          error.value = 'Format email tidak valid.'
          break
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          error.value = 'Email atau password salah.'
          break
        default:
          error.value = 'Gagal login. Silakan coba lagi.'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    error.value = null
    try {
      await firebaseSignOut(auth)
      user.value = null
    } catch (err) {
      console.error('Logout error:', err)
      error.value = 'Gagal logout.'
    }
  }

  return { 
    user, 
    isAuthReady, 
    error, 
    isLoading, 
    login, 
    logout 
  }
})
