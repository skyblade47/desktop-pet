import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, '..', 'src/renderer'),
    },
  },
  css: {
    postcss: resolve(__dirname, '..', 'postcss.config.js'),
  },
})
