import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Attendance, type Student } from '../db/schema'
import { checkAndTriggerEarlyWarning } from '../offline/riskEngine'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  School,
  Check,
  Clock,
  Search,
  Tag,
  Shield,
} from 'lucide-react'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const ABSENCE_CATEGORIES = [
  { key: 'mhm_wash', label: 'MHM / Period Poverty (WASH Deficit)' },
  { key: 'climate_flood', label: 'Flash Flood / River Crossing Barrier' },
  { key: 'domestic_labour', label: 'Domestic Labour / Drought Water Fetching' },
  { key: 'commute_distance', label: 'Long Distance Commute (>8km)' },
  { key: 'illness', label: 'Health / Medical Recovery' },
  { key: 'unknown', label: 'Unspecified Absence' },
]

export const AttendanceLogger: React.FC = () => {
  const [selectedSchool, setSelectedSchool] = useState<string>('SCH-NAROK-01')
  const [selectedGrade, setSelectedGrade] = useState<number>(7)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate())
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('climate_flood')
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null)

  // Fetch students matching selected school & grade
  const students = useLiveQuery(
    () =>
      db.students
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

  // Map of studentUid -> Attendance record for active date
  const attendanceMap = new Map<string, Attendance>()
  dayAttendance.forEach((record) => {
    attendanceMap.set(record.studentUid, record)
  })

  // Filter students based on search input
  const filteredStudents = students.filter((student) =>
    searchFilter.trim() === ''
      ? true
      : student.uid.toLowerCase().includes(searchFilter.toLowerCase()) ||
        student.riskFactor?.toLowerCase().includes(searchFilter.toLowerCase())
  )

  // Fast Roll-Call Action: Mark single student
  const handleMarkAttendance = async (
    studentUid: string,
    present: boolean,
    unexcused: boolean = true,
    category?: string
  ) => {
    const existing = attendanceMap.get(studentUid)

    if (existing?.id) {
      await db.attendance.update(existing.id, {
        present,
        unexcused: present ? false : unexcused,
        category: present ? 'routine' : category || selectedCategory,
        synced: 0,
      })
    } else {
      await db.attendance.add({
        studentUid,
        date: selectedDate,
        present,
        unexcused: present ? false : unexcused,
        category: present ? 'routine' : category || selectedCategory,
        synced: 0,
        createdAt: new Date().toISOString(),
      })
    }

    // Check early-warning risk threshold if marked absent
    if (!present && unexcused) {
      const riskResult = await checkAndTriggerEarlyWarning(studentUid, selectedDate)
      if (riskResult.alertCreated) {
        setStatusMessage({
          text: `⚠️ EARLY-WARNING TRIGGERED: Student ${studentUid} has reached ${riskResult.consecutiveAbsences} consecutive unexcused absences. Casework alert opened.`,
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
          category: 'routine',
          synced: 0,
        })
      } else {
        await db.attendance.add({
          studentUid: student.uid,
          date: selectedDate,
          present: true,
          unexcused: false,
          category: 'routine',
          synced: 0,
          createdAt: new Date().toISOString(),
        })
      }
    }

    setStatusMessage({
      text: `Marked all ${students.length} students in Grade ${selectedGrade} as Present for ${selectedDate}.`,
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
              Zero plaintext PII · Encrypted beneficiary UIDs · Instant local commit (&lt;10ms)
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
              <School className="h-3.5 w-3.5" /> Partner School District
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="SCH-NAROK-01">Enabelbel Maasai Girls (SCH-NAROK-01)</option>
              <option value="SCH-TURK-02">Kakuma Peace Model Primary (SCH-TURK-02)</option>
              <option value="SCH-KILIFI-03">Ganze Girls Foundational (SCH-KILIFI-03)</option>
              <option value="SCH-GARISSA-04">Dadaab Community Primary (SCH-GARISSA-04)</option>
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
              <option value={7}>Grade 7 (Junior Primary)</option>
              <option value={8}>Grade 8 (Transition Standard)</option>
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

        {/* Secondary absence taxonomy selector & search */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 shrink-0">Default Absence Reason:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:border-indigo-500"
            >
              {ABSENCE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student code or risk factor..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-4">
            <span className="text-slate-900 font-semibold">Roster Summary:</span>
            <span className="text-emerald-700 font-semibold">{presentCount} Present</span>
            <span className="text-rose-700 font-semibold">{absentCount} Absent</span>
            <span className="text-amber-700 font-semibold">{unmarkedCount} Unmarked</span>
          </div>
          <div className="text-slate-500">
            {students.length} Total Enrolled in Grade {selectedGrade}
          </div>
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
        {filteredStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No students found matching current filter. Try clearing your search query or re-seeding mock data.
          </div>
        ) : (
          filteredStudents.map((student: Student) => {
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs font-bold text-white shadow-sm">
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
                      {student.riskFactor && (
                        <span className="hidden md:inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                          {student.riskFactor}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Grade {student.gradeLevel}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                        <Shield className="h-3 w-3 text-indigo-500" />
                        {student.assignedMentor || 'MENTOR-FIELD-01'}
                      </span>
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
                    onClick={() => handleMarkAttendance(student.uid, false, false, 'illness')}
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
