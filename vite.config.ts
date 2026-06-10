import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Base path for GitHub Pages: https://musiclabschool.github.io/rhythm-arena/
  base: process.env.GITHUB_ACTIONS ? '/rhythm-arena/' : '/',
  server: {
    port: 5173,
    host: true,
  },
})
