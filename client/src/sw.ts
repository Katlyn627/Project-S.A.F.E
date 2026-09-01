/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

const syncPlugin = new BackgroundSyncPlugin('safe-workbox-queue', {
  maxRetentionTime: 24 * 60,
})

registerRoute(
  ({ request, url }) => request.method === 'POST' && url.pathname.startsWith('/api/sync'),
  new NetworkOnly({ plugins: [syncPlugin] }),
  'POST',
)

self.addEventListener('sync', (event) => {
  if (event.tag === 'safe-sync-mutations') {
    event.waitUntil(fetch('/api/sync/drain', { method: 'POST' }))
  }
})
