import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Allow Vite to find the next available port if 5173 is busy
    open: true // This will open the browser automatically
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'service-worker': resolve(__dirname, 'public/service-worker.js')
      }
    }
  }
})
