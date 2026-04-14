import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Monorepo-friendly: avoid multiple React copies (breaks hooks/tests).
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    open: true
  }
})
