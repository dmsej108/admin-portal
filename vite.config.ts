import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

const base = process.env.VITE_BASE_PATH ?? '/'

const marketingRemote = process.env.VITE_MARKETING_REMOTE_URL
  ?? 'http://localhost:5174/assets/remoteEntry.js'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    federation({
      name: 'adminPortal',
      remotes: {
        adminMarketing: marketingRemote,
      },
      shared: ['react', 'react-dom', 'react-router-dom'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    cors: true,
    strictPort: true,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
})
