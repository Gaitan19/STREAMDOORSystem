import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 44448,
    strictPort: true,
    https: false,
    proxy: {
      '/api': {
        target: 'https://localhost:44447',
        changeOrigin: true,
        secure: false
      },
      '/swagger': {
        target: 'https://localhost:44447',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'build',
    emptyOutDir: true
  }
})
