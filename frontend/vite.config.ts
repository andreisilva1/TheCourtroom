import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/load_personas': { target: 'http://localhost:8001', changeOrigin: true },
      '/argue_battle':  { target: 'http://localhost:8001', changeOrigin: true },
      '/battle_turn':   { target: 'http://localhost:8001', changeOrigin: true },
      '/create_persona':{ target: 'http://localhost:8001', changeOrigin: true },
      '/task':          { target: 'http://localhost:8001', changeOrigin: true },
    },
  },
})
