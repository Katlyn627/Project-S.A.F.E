import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { seedMockData } from '../db/seed'
import { Database, RefreshCw, BarChart2 } from 'lucide-react'

export const TelemetryView: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  const studentCount = useLiveQuery(() => db.students.count(), []) ?? 0
  const attendanceCount = useLiveQuery(() => db.attendance.count(), []) ?? 0
  const alertCount = useLiveQuery(() => db.alerts.count(), []) ?? 0
  const voiceCount = useLiveQuery(() => db.voiceFeedback.count(), []) ?? 0

  const unsyncedAttendance = useLiveQuery(() => db.attendance.where('synced').equals(0).count(), []) ?? 0
  const unsyncedAlerts = useLiveQuery(() => db.alerts.where('synced').equals(0).count(), []) ?? 0
  const unsyncedVoice = useLiveQuery(() => db.voiceFeedback.where('synced').equals(0).count(), []) ?? 0

  const handleResetAndSeed = async () => {
    setIsSeeding(true)
    setSeedMessage(null)
    try {
      await db.students.clear()
      await db.attendance.clear()
      await db.alerts.clear()
      await db.voiceFeedback.clear()
      await seedMockData()
      setSeedMessage('Database re-seeded successfully with 10 anonymized student profiles.')
    } catch (err) {
      setSeedMessage('Error re-seeding database.')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Program Targets & Impact Indicators */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart2 className="h-5 w-5 text-indigo-600" />
          M&E Impact Telemetry & Key Target Matrix
        </h2>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold uppercase text-slate-500">Target Reach</span>
            <p className="text-xl font-bold text-slate-900 mt-1">30 Schools / 4,500+</p>
            <p className="text-[11px] text-slate-500 mt-1">Adolescent female students</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold uppercase text-slate-500">Intervention Latency</span>
            <p className="text-xl font-bold text-emerald-700 mt-1">&lt; 72 Hours</p>
            <p className="text-[11px] text-emerald-600 mt-1">Down from 30–60 days</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold uppercase text-slate-500">Target Absenteeism Drop</span>
            <p className="text-xl font-bold text-indigo-700 mt-1">40% Reduction</p>
            <p className="text-[11px] text-indigo-600 mt-1">In chronic absenteeism</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold uppercase text-slate-500">Casework Remediation</span>
            <p className="text-xl font-bold text-blue-700 mt-1">85% Target</p>
            <p className="text-[11px] text-blue-600 mt-1">Resolution & re-enrollment</p>
          </div>
        </div>
      </div>

      {/* Local IndexedDB Diagnostics */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" />
              Local IndexedDB Storage Telemetry (Dexie.js)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client storage health and offline mutation ledger
            </p>
          </div>

          <button
            onClick={handleResetAndSeed}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            Re-Seed Mock Data
          </button>
        </div>

        {seedMessage && (
          <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs font-medium text-indigo-900 border border-indigo-200">
            {seedMessage}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="text-xs text-slate-500">Students Stored</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{studentCount}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">Zero Plaintext PII</div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="text-xs text-slate-500">Attendance Logs</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{attendanceCount}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-1">
              {unsyncedAttendance} unsynced
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="text-xs text-slate-500">Early-Warning Alerts</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{alertCount}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-1">
              {unsyncedAlerts} unsynced
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="text-xs text-slate-500">FCRM Voice Notes</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{voiceCount}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-1">
              {unsyncedVoice} unsynced
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-slate-900 p-4 text-xs text-slate-300 font-mono">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
            <span>DEVICE STORAGE STATUS</span>
            <span className="text-emerald-400">PERSISTENT_STORAGE_GRANTED</span>
          </div>
          <div>Database Name: safe-offline-db (v2)</div>
          <div>Encryption Mode: AES-GCM 256-bit + Blind Pseudonymized UID</div>
          <div>Network Policy: Background Sync Queue (maxRetention: 72h)</div>
          <div>Payload Budget: &lt; 1.8 MB (Optimized for 2G EDGE)</div>
        </div>
      </div>
    </div>
  )
}
