import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    entry: 'src/main/main.ts',
    outDir: 'out/main',
  },
  preload: {
    input: 'src/preload/preload.ts',
    outDir: 'out/preload',
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/renderer'),
      },
    },
    outDir: 'out/renderer',
  },
})
