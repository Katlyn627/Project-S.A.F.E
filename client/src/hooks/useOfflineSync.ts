import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1').replace(/\/+api\/v1\/+api\/v1$/, '/api/v1')

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  pendingAttendance: number
  pendingAlerts: number
  pendingVoice: number
  lastSyncedAt: Date | null
  lastError: string | null
  syncNow: () => Promise<{ success: boolean; syncedCount: number; error?: string }>
}

export const useOfflineSync = (): SyncStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  // Reactive pending sync counts from IndexedDB
  const pendingAttendanceList = useLiveQuery(
    () => db.attendance.where('synced').equals(0).toArray(),
    []
  ) ?? []

  const pendingAlertsList = useLiveQuery(
    () => db.alerts.where('synced').equals(0).toArray(),
    []
  ) ?? []

  const pendingVoiceList = useLiveQuery(
    () => db.voiceFeedback.where('synced').equals(0).toArray(),
    []
  ) ?? []

  const pendingAttendance = pendingAttendanceList.length
  const pendingAlerts = pendingAlertsList.length
  const pendingVoice = pendingVoiceList.length
  const pendingCount = pendingAttendance + pendingAlerts + pendingVoice

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, error: 'Device is offline' }
    }

    if (isSyncing) {
      return { success: false, syncedCount: 0, error: 'Sync already in progress' }
    }

    setIsSyncing(true)
    setLastError(null)

    try {
      // 1. Fetch all unsynced items
      const unsyncedAttendance = await db.attendance.where('synced').equals(0).toArray()
      const unsyncedAlerts = await db.alerts.where('synced').equals(0).toArray()
      const unsyncedVoice = await db.voiceFeedback.where('synced').equals(0).toArray()

      let totalSynced = 0

      // 2. Batch Sync JSON Mutations (Attendance & Alerts)
      if (unsyncedAttendance.length > 0 || unsyncedAlerts.length > 0) {
        const payload = {
          batchId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date().toISOString(),
          attendance: unsyncedAttendance,
          alerts: unsyncedAlerts,
        }

        const response = await fetch(`${API_BASE}/sync/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-App': 'Project-SAFE-PWA',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Sync failed with HTTP status ${response.status}`)
        }

        // Mark synced records in IndexedDB
        await db.transaction('rw', db.attendance, db.alerts, async () => {
          for (const item of unsyncedAttendance) {
            if (item.id) {
              await db.attendance.update(item.id, { synced: 1 })
            }
          }
          for (const item of unsyncedAlerts) {
            if (item.id) {
              await db.alerts.update(item.id, { synced: 1 })
            }
          }
        })

        totalSynced += unsyncedAttendance.length + unsyncedAlerts.length
      }

      // 3. Upload Voice Feedback Blobs
      for (const voiceItem of unsyncedVoice) {
        if (!voiceItem.id) continue

        const formData = new FormData()
        formData.append('audio', voiceItem.audioBlob, `voice-${voiceItem.id}.webm`)
        formData.append('schoolId', voiceItem.schoolId)
        formData.append('timestamp', voiceItem.timestamp)
        formData.append('status', voiceItem.status)

        try {
          const voiceRes = await fetch(`${API_BASE}/sync/voice`, {
            method: 'POST',
            body: formData,
          })

          if (voiceRes.ok) {
            await db.voiceFeedback.update(voiceItem.id, { synced: 1 })
            totalSynced += 1
          }
        } catch (vErr) {
          console.warn('Voice sync failed for item:', voiceItem.id, vErr)
        }
      }

      setLastSyncedAt(new Date())
      setIsSyncing(false)
      return { success: true, syncedCount: totalSynced }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network sync failed'
      setLastError(msg)
      setIsSyncing(false)
      return { success: false, syncedCount: 0, error: msg }
    }
  }, [isSyncing])

  // Monitor connectivity changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      void syncNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Trigger initial sync if online and items exist
    if (navigator.onLine && pendingCount > 0) {
      void syncNow()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingCount, syncNow])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    pendingAttendance,
    pendingAlerts,
    pendingVoice,
    lastSyncedAt,
    lastError,
    syncNow,
  }
}
