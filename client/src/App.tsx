import { useEffect } from 'react'
import { AttendanceLogger } from './components/AttendanceLogger'
import { startSyncManager } from './offline/syncManager'

function App() {
  useEffect(() => startSyncManager(), [])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <AttendanceLogger />
    </main>
  )
}

export default App
