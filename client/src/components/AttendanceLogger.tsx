import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { db, type AttendanceRecord } from '../db/schema'
import { encryptJson, makeEncryptedUid } from '../db/crypto'
import { isStudentAtRisk } from '../offline/risk'
import { flushSyncQueue } from '../offline/syncManager'

const todayDate = (): string => new Date().toISOString().slice(0, 10)

const createMutationId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

export const AttendanceLogger = () => {
  const [classCode, setClassCode] = useState('P7')
  const [rawUid, setRawUid] = useState('')
  const [status, setStatus] = useState<AttendanceRecord['status']>('present')
  const [isExcused, setIsExcused] = useState(false)
  const [entryDate, setEntryDate] = useState(todayDate())
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    void db.attendance.orderBy('createdAt').reverse().limit(12).toArray().then(setRecentRecords)
  }, [])

  const absentWarning = useMemo(
    () => status === 'absent' && !isExcused,
    [status, isExcused],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!rawUid.trim()) {
      setMessage('Student code is required.')
      return
    }

    const uidCipher = await makeEncryptedUid(rawUid.trim())
    const record: AttendanceRecord = {
      uidCipher,
      classCode,
      date: entryDate,
      status,
      isExcused,
      synced: false,
      createdAt: new Date().toISOString(),
    }

    const attendanceId = await db.attendance.add(record)

    await db.syncQueue.put({
      mutationId: createMutationId(),
      entity: 'attendance',
      entityId: String(attendanceId),
      operation: 'upsert',
      payloadCipher: await encryptJson(record),
      createdAt: new Date().toISOString(),
      attempts: 0,
    })

    const attendanceHistory = await db.attendance
      .where('uidCipher')
      .equals(uidCipher)
      .reverse()
      .sortBy('date')

    if (isStudentAtRisk(attendanceHistory.reverse())) {
      const reason = 'Student has more than 3 consecutive unexcused absences.'
      const riskId = await db.riskFlags.add({
        uidCipher,
        reason,
        createdAt: new Date().toISOString(),
      })

      await db.syncQueue.put({
        mutationId: createMutationId(),
        entity: 'risk_flag',
        entityId: String(riskId),
        operation: 'upsert',
        payloadCipher: await encryptJson({ uidCipher, reason }),
        createdAt: new Date().toISOString(),
        attempts: 0,
      })
    }

    const latest = await db.attendance.orderBy('createdAt').reverse().limit(12).toArray()
    setRecentRecords(latest)
    setRawUid('')
    setStatus('present')
    setIsExcused(false)

    if (navigator.onLine) {
      await flushSyncQueue()
      setMessage('Saved locally and synced to central server.')
      return
    }

    setMessage('Saved locally. Pending sync when connectivity returns.')
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Daily Attendance Logger</h1>
      <p className="mt-1 text-sm text-slate-600">
        No student names are stored. Use mentor-issued student codes only.
      </p>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Class
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={classCode}
            onChange={(event) => setClassCode(event.target.value.toUpperCase())}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Student code
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={rawUid}
            onChange={(event) => setRawUid(event.target.value)}
            placeholder="e.g. SAFEX7P1"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Date
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="date"
            value={entryDate}
            onChange={(event) => setEntryDate(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value as AttendanceRecord['status'])}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </label>

        <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isExcused}
            disabled={!absentWarning}
            onChange={(event) => setIsExcused(event.target.checked)}
          />
          Mark absence as excused
        </label>

        <button
          type="submit"
          className="md:col-span-2 rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500"
        >
          Save attendance offline
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Latest local entries</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {recentRecords.map((record) => (
            <li key={`${record.uidCipher}-${record.createdAt}`} className="rounded border border-slate-200 p-2">
              <span className="font-medium">{record.classCode}</span> · {record.date} ·{' '}
              {record.status}
              {record.isExcused ? ' (excused)' : ''} · {record.synced ? 'Synced' : 'Pending sync'}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
