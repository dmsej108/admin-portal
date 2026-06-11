import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

const base = process.env.VITE_BASE_PATH ?? '/'

const mfManifestUrl =
  process.env.VITE_MF_MANIFEST_URL ?? 'http://localhost:5174/mf-manifest.json'

function createManifestRemoteExternal(manifestUrl: string): string {
  const encodedUrl = JSON.stringify(manifestUrl)
  return [
    `fetch(${encodedUrl})`,
    '.then((response) => {',
    '  if (!response.ok) {',
    '    throw new Error(`Failed to load MF manifest: ${response.status}`)',
    '  }',
    '  return response.json()',
    '})',
    '.then((manifest) => manifest.remotes.adminMarketing.remoteEntry)',
  ].join('')
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    federation({
      name: 'adminPortal',
      remotes: {
        adminMarketing: {
          external: createManifestRemoteExternal(mfManifestUrl),
          externalType: 'promise',
          format: 'esm',
          from: 'vite',
        },
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
