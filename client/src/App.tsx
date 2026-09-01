import { useState, useEffect } from 'react'
import { AttendanceLogger } from './components/AttendanceLogger'
import { CaseworkAlerts } from './components/CaseworkAlerts'
import { FCRMAudioRecorder } from './components/FCRMAudioRecorder'
import { TelemetryView } from './components/TelemetryView'
import { SafeLogo } from './components/Logo'
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
  CheckCircle2,
  Lock,
  Globe2,
} from 'lucide-react'

type TabType = 'telemetry' | 'attendance' | 'casework' | 'fcrm'

export function App() {
  // Default to M&E Telemetry first so investors & clients see metrics and can seed/sync data right away
  const [activeTab, setActiveTab] = useState<TabType>('telemetry')
  const syncStatus = useOfflineSync()

  // Seed rich enterprise mock dataset on start
  useEffect(() => {
    void seedMockData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md text-white shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-3.5 sm:px-6">
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Project S.A.F.E. Brand Logo */}
            <SafeLogo size={42} showText={true} />

            {/* Network State & Sync Telemetry Pill */}
            <div className="flex items-center gap-3">
              {/* Online/Offline Badge */}
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide shadow-sm transition ${
                  syncStatus.isOnline
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : 'bg-rose-950/90 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/20'
                }`}
              >
                {syncStatus.isOnline ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <Wifi className="h-3.5 w-3.5" />
                    <span>2G / Online</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Offline Mode</span>
                  </>
                )}
              </div>

              {/* Pending Sync Counter & Trigger */}
              <button
                onClick={() => void syncStatus.syncNow()}
                disabled={syncStatus.isSyncing || !syncStatus.isOnline}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition active:scale-95 ${
                  syncStatus.pendingCount > 0
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-400/50'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
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

          {/* Navigation Tabs (Ordered: M&E First, then Attendance, Casework, Voice) */}
          <nav className="mt-3.5 flex space-x-2 border-t border-slate-800/80 pt-2.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'telemetry'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              1. M&amp;E Telemetry &amp; Impact
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              2. Classroom Roll-Call
            </button>

            <button
              onClick={() => setActiveTab('casework')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'casework'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              3. Early-Warning &amp; Casework
              {syncStatus.pendingAlerts > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white font-bold">
                  {syncStatus.pendingAlerts}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fcrm')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'fcrm'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
              4. FCRM Voice Module
              {syncStatus.pendingVoice > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] text-slate-900 font-bold">
                  {syncStatus.pendingVoice}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {activeTab === 'telemetry' && <TelemetryView />}
        {activeTab === 'attendance' && <AttendanceLogger />}
        {activeTab === 'casework' && <CaseworkAlerts />}
        {activeTab === 'fcrm' && <FCRMAudioRecorder />}
      </main>

      {/* Modern Humanitarian Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 shadow-inner">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Lock className="h-3.5 w-3.5 text-indigo-600" />
            <span>Zero Plaintext PII · Encrypted Beneficiary UIDs (GDPR Art. 8 &amp; UN CRC Compliant)</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Globe2 className="h-3.5 w-3.5 text-sky-500" /> Kenya · Uganda · Tanzania
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Dexie IndexedDB v4
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
