import { db } from '../db/schema'

const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1').replace(/\/+api\/v1\/+api\/v1$/, '/api/v1')

export const flushSyncQueue = async (): Promise<{ synced: number; failed: number }> => {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 }
  }

  const unsyncedAttendance = await db.attendance.where('synced').equals(0).toArray()
  const unsyncedAlerts = await db.alerts.where('synced').equals(0).toArray()
  const unsyncedVoice = await db.voiceFeedback.where('synced').equals(0).toArray()

  const totalUnsynced = unsyncedAttendance.length + unsyncedAlerts.length + unsyncedVoice.length
  if (totalUnsynced === 0) {
    return { synced: 0, failed: 0 }
  }

  try {
    if (unsyncedAttendance.length > 0 || unsyncedAlerts.length > 0) {
      const response = await fetch(`${API_BASE}/sync/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          attendance: unsyncedAttendance,
          alerts: unsyncedAlerts,
        }),
      })

      if (response.ok) {
        await db.transaction('rw', db.attendance, db.alerts, async () => {
          for (const item of unsyncedAttendance) {
            if (item.id) await db.attendance.update(item.id, { synced: 1 })
          }
          for (const item of unsyncedAlerts) {
            if (item.id) await db.alerts.update(item.id, { synced: 1 })
          }
        })
      }
    }

    return { synced: totalUnsynced, failed: 0 }
  } catch {
    return { synced: 0, failed: totalUnsynced }
  }
}
