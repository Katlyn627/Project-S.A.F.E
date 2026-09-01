import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 1_800_000,
      },
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Project S.A.F.E',
        short_name: 'S.A.F.E',
        description: 'Offline-first attendance and safeguarding telemetry platform.',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 1_800_000,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
