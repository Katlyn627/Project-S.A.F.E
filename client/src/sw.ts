/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly, NetworkFirst } from 'workbox-strategies'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

declare const self: ServiceWorkerGlobalScope

self.addEventListener('install', () => {
  void self.skipWaiting()
})
clientsClaim()
cleanupOutdatedCaches()

// 1. Precache UI App Shell (< 1.8 MB payload budget)
precacheAndRoute(self.__WB_MANIFEST)

// 2. Background Sync Plugin for API endpoints
const syncPlugin = new BackgroundSyncPlugin('safe-workbox-queue', {
  maxRetentionTime: 72 * 60, // 72 hours retention for rural field operations
})

registerRoute(
  ({ request, url }) => request.method === 'POST' && url.pathname.includes('/api/v1/sync'),
  new NetworkOnly({ plugins: [syncPlugin] }),
  'POST'
)

// 3. NetworkFirst strategy for read-only telemetry
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/telemetry'),
  new NetworkFirst({
    cacheName: 'safe-telemetry-cache',
    networkTimeoutSeconds: 3,
  }),
  'GET'
)

// 4. Background Sync event listener
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'safe-sync-mutations') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' }))
      })
    )
  }
})
