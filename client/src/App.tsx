import { useState, useEffect } from 'react'
import { AttendanceLogger } from './components/AttendanceLogger'
import { CaseworkAlerts } from './components/CaseworkAlerts'
import { FCRMAudioRecorder } from './components/FCRMAudioRecorder'
import { TelemetryView } from './components/TelemetryView'
import { useOfflineSync } from './hooks/useOfflineSync'
import { seedMockData } from './db/seed'
import {
  Users,
  AlertTriangle,
  Mic,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  Shield,
  CheckCircle2,
} from 'lucide-react'

type TabType = 'attendance' | 'casework' | 'fcrm' | 'telemetry'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('attendance')
  const syncStatus = useOfflineSync()

  // Seed mock data once on application start
  useEffect(() => {
    void seedMockData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 text-white shadow-md">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-black tracking-wider text-white shadow-inner">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Project S.A.F.E.
                  <span className="rounded bg-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                    PWA Offline-First
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  School Attendance & Foundational Empowerment · East Africa
                </p>
              </div>
            </div>

            {/* Network State & Sync Telemetry Pill */}
            <div className="flex items-center gap-3">
              {/* Online/Offline Badge */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition ${
                  syncStatus.isOnline
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                }`}
              >
                {syncStatus.isOnline ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <Wifi className="h-3.5 w-3.5" />
                    <span>2G/Online</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Offline Mode</span>
                  </>
                )}
              </div>

              {/* Pending Sync Counter & Manual Trigger */}
              <button
                onClick={() => void syncStatus.syncNow()}
                disabled={syncStatus.isSyncing || !syncStatus.isOnline}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm transition active:scale-95 ${
                  syncStatus.pendingCount > 0
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`}
                />
                <span>
                  {syncStatus.isSyncing
                    ? 'Syncing...'
                    : syncStatus.pendingCount > 0
                    ? `${syncStatus.pendingCount} Pending Sync`
                    : 'All Synced'}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4 flex space-x-1 border-t border-slate-800 pt-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              Daily Roll-Call
            </button>

            <button
              onClick={() => setActiveTab('casework')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'casework'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Early-Warning & Casework
              {syncStatus.pendingAlerts > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                  {syncStatus.pendingAlerts}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fcrm')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'fcrm'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
              FCRM Voice Module
              {syncStatus.pendingVoice > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] text-slate-900 font-bold">
                  {syncStatus.pendingVoice}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'telemetry'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              M&E Telemetry
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container View */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {activeTab === 'attendance' && <AttendanceLogger />}
        {activeTab === 'casework' && <CaseworkAlerts />}
        {activeTab === 'fcrm' && <FCRMAudioRecorder />}
        {activeTab === 'telemetry' && <TelemetryView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Project S.A.F.E. · Humanitarian Child Safeguarding (GDPR Art. 8 & UN CRC Compliant)</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Dexie DB v2 · Offline Bundle &lt; 1.8MB
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App
