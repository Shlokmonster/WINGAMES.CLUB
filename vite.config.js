import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Generate source maps for better debugging
    sourcemap: true,
    // Ensure proper module handling
    modulePreload: true,
    // Optimize dependencies
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    // Ensure proper MIME types in development
    headers: {
      'Content-Type': 'text/javascript',
    },
  },
})
