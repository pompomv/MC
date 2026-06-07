import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Mengaktifkan PWA saat mode development lokal
      },
      manifest: {
        name: 'BSF IoT Monitor',
        short_name: 'BSF Monitor',
        description: 'Aplikasi Monitoring Kandang Maggot BSF',
        theme_color: '#1e293b',
        background_color: '#f8fafc',
        display: 'standalone', // Membuatnya tampil full screen seperti aplikasi asli
        icons: [
          {
            src: '/pwa-192x192.png', // Nanti kita butuh gambar logo ukuran ini di folder public/
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})