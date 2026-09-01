import { db, type SyncMutation } from '../db/schema'
import { decryptJson } from '../db/crypto'

const SYNC_ENDPOINT = '/api/sync/batch'

const buildMutationEnvelope = async (mutation: SyncMutation) => ({
  mutationId: mutation.mutationId,
  entity: mutation.entity,
  entityId: mutation.entityId,
  operation: mutation.operation,
  payload: await decryptJson(mutation.payloadCipher),
})

export const flushSyncQueue = async (): Promise<number> => {
  if (!navigator.onLine) {
    return 0
  }

  const pending = await db.syncQueue.orderBy('createdAt').toArray()

  if (pending.length === 0) {
    return 0
  }

  try {
    const body = await Promise.all(pending.map(buildMutationEnvelope))

    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mutations: body }),
    })

    if (!response.ok) {
      throw new Error(`Sync failed with status ${response.status}`)
    }

    await db.transaction('rw', db.syncQueue, db.attendance, db.voiceNotes, async () => {
      const syncedMutationIds = pending.map((mutation) => mutation.mutationId)
      await db.syncQueue.bulkDelete(syncedMutationIds)

      for (const mutation of pending) {
        if (mutation.entity === 'attendance') {
          const attendanceId = Number.parseInt(mutation.entityId, 10)

          if (!Number.isNaN(attendanceId)) {
            await db.attendance.update(attendanceId, { synced: true })
          }
        }

        if (mutation.entity === 'voice_note') {
          await db.voiceNotes.update(mutation.entityId, { synced: true })
        }
      }
    })

    return pending.length
  } catch {
    const now = new Date().toISOString()

    await Promise.all(
      pending.map((mutation) =>
        db.syncQueue.update(mutation.mutationId, {
          attempts: mutation.attempts + 1,
          lastAttemptAt: now,
        }),
      ),
    )

    return 0
  }
}

export const startSyncManager = (): (() => void) => {
  const triggerSync = async () => {
    await flushSyncQueue()

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if ('sync' in registration) {
        await registration.sync.register('safe-sync-mutations')
      }
    }
  }

  const onlineListener = () => {
    void triggerSync()
  }

  window.addEventListener('online', onlineListener)
  void triggerSync()

  return () => {
    window.removeEventListener('online', onlineListener)
  }
}
