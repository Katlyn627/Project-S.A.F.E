import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Attendance, type Student } from '../db/schema'
import { checkAndTriggerEarlyWarning } from '../offline/riskEngine'
import { CheckCircle2, XCircle, AlertTriangle, Users, Calendar, School, Check, Clock } from 'lucide-react'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

export const AttendanceLogger: React.FC = () => {
  const [selectedSchool, setSelectedSchool] = useState<string>('SCH-MARA-01')
  const [selectedGrade, setSelectedGrade] = useState<number>(8)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate())
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null)
  const [studentNotes] = useState<Record<string, string>>({})

  // Fetch students matching selected school & grade
  const students = useLiveQuery(
    () => db.students
      .where('schoolId')
      .equals(selectedSchool)
      .filter((s) => s.gradeLevel === selectedGrade)
      .toArray(),
    [selectedSchool, selectedGrade]
  ) ?? []

  // Fetch existing attendance records for the selected date
  const dayAttendance = useLiveQuery(
    () => db.attendance.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  ) ?? []

  // Map of studentUid -> Attendance record for the active date
  const attendanceMap = new Map<string, Attendance>()
  dayAttendance.forEach((record) => {
    attendanceMap.set(record.studentUid, record)
  })

  // Fast Roll-Call Action: Mark single student
  const handleMarkAttendance = async (
    studentUid: string,
    present: boolean,
    unexcused: boolean = true
  ) => {
    const existing = attendanceMap.get(studentUid)
    const notes = studentNotes[studentUid] || existing?.notes || ''

    if (existing?.id) {
      await db.attendance.update(existing.id, {
        present,
        unexcused: present ? false : unexcused,
        notes,
        synced: 0,
      })
    } else {
      await db.attendance.add({
        studentUid,
        date: selectedDate,
        present,
        unexcused: present ? false : unexcused,
        notes,
        synced: 0,
        createdAt: new Date().toISOString(),
      })
    }

    // Check early-warning risk threshold if marked absent
    if (!present && unexcused) {
      const riskResult = await checkAndTriggerEarlyWarning(studentUid, selectedDate)
      if (riskResult.alertCreated) {
        setStatusMessage({
          text: `⚠️ EARLY-WARNING TRIGGERED: Student ${studentUid} has ${riskResult.consecutiveAbsences} consecutive unexcused absences. Casework alert opened.`,
          type: 'alert',
        })
        return
      }
    }

    setStatusMessage({
      text: `Attendance saved locally for ${studentUid}.`,
      type: 'success',
    })
  }

  // Quick Action: Mark all students present in one click
  const handleMarkAllPresent = async () => {
    if (students.length === 0) return

    for (const student of students) {
      const existing = attendanceMap.get(student.uid)
      if (existing?.id) {
        await db.attendance.update(existing.id, {
          present: true,
          unexcused: false,
          synced: 0,
        })
      } else {
        await db.attendance.add({
          studentUid: student.uid,
          date: selectedDate,
          present: true,
          unexcused: false,
          synced: 0,
          createdAt: new Date().toISOString(),
        })
      }
    }

    setStatusMessage({
      text: `Marked all ${students.length} students as Present for ${selectedDate}.`,
      type: 'success',
    })
  }

  const presentCount = students.filter((s) => attendanceMap.get(s.uid)?.present === true).length
  const absentCount = students.filter((s) => attendanceMap.get(s.uid)?.present === false).length
  const unmarkedCount = students.length - (presentCount + absentCount)

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Daily Classroom Roll-Call
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Zero plaintext PII · Encrypted beneficiary UIDs · Instant local commit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition active:scale-95"
            >
              <Check className="h-4 w-4" />
              Mark All Present
            </button>
          </div>
        </div>

        {/* Filter selectors */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <School className="h-3.5 w-3.5" /> Partner School
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="SCH-MARA-01">Mara Primary (SCH-MARA-01)</option>
              <option value="SCH-RIV-02">Riverbend Academy (SCH-RIV-02)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Grade Level
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value={7}>Grade 7 (Standard 7)</option>
              <option value={8}>Grade 8 (Standard 8)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Roll Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-900 font-semibold">Roster Summary:</span>
          <span className="text-emerald-700 font-semibold">{presentCount} Present</span>
          <span className="text-rose-700 font-semibold">{absentCount} Absent</span>
          <span className="text-amber-700 font-semibold">{unmarkedCount} Unmarked</span>
          <span className="text-slate-400">|</span>
          <span>{students.length} Total Enrolled</span>
        </div>
      </div>

      {/* Dynamic Status / Alert Banner */}
      {statusMessage && (
        <div
          className={`rounded-lg p-3.5 text-xs font-medium flex items-center justify-between shadow-sm transition ${
            statusMessage.type === 'alert'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'alert' ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Roster Cards Grid */}
      <div className="space-y-3">
        {students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No students found for {selectedSchool} Grade {selectedGrade}. Please seed or register students.
          </div>
        ) : (
          students.map((student: Student) => {
            const currentAttendance = attendanceMap.get(student.uid)
            const isPresent = currentAttendance?.present === true
            const isAbsentUnexcused = currentAttendance?.present === false && currentAttendance?.unexcused === true
            const isAbsentExcused = currentAttendance?.present === false && currentAttendance?.unexcused === false
            const isLogged = currentAttendance !== undefined

            return (
              <div
                key={student.uid}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition bg-white shadow-sm ${
                  isAbsentUnexcused
                    ? 'border-rose-200 bg-rose-50/30'
                    : isPresent
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs font-bold text-white">
                    {student.uid.slice(-4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 tracking-wide">
                        {student.uid}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          student.status === 'at-risk'
                            ? 'bg-rose-100 text-rose-800'
                            : student.status === 'remediated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Grade {student.gradeLevel}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        {isLogged ? (
                          currentAttendance?.synced === 1 ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Synced
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> Pending Sync
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">Not logged today</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                  <button
                    onClick={() => handleMarkAttendance(student.uid, true, false)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Present
                  </button>

                  <button
                    onClick={() => handleMarkAttendance(student.uid, false, true)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                      isAbsentUnexcused
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Absent (Unexcused)
                  </button>

                  <button
                    onClick={() => handleMarkAttendance(student.uid, false, false)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition active:scale-95 ${
                      isAbsentExcused
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    Excused
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
