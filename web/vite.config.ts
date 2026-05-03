import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lickipedia/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
