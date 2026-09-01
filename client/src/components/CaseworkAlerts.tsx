import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Alert, type AlertStatus } from '../db/schema'
import { SCHOOL_REGISTRY } from '../db/seed'
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  FileText,
  Save,
  School,
  Shield,
  Sparkles,
  Globe2,
} from 'lucide-react'

const INTERVENTION_PRESETS: Record<string, string> = {
  walking_bus: 'Assigned student to verified community walking bus group with 5 peers and reflective safety sash.',
  dignity_kit: 'Issued 6-month reusable menstrual hygiene kit (AFRIpads) and confirmed access to private school washroom.',
  home_visit: 'Conducted elder and guardian home-visit dialogue. Guardian reaffirmed schooling commitment contract.',
  feeding_program: 'Enrolled household into school emergency feeding & daily midday meal program.',
  remedial_tutoring: 'Enrolled student in Saturday peer-tutoring study circle with solar study lamp provision.',
  borehole_water: 'Enrolled household in school-community solar borehole priority water collection voucher scheme.',
}

export const CaseworkAlerts: React.FC = () => {
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [filterSchool, setFilterSchool] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editingAlertId, setEditingAlertId] = useState<number | null>(null)
  const [interventionNote, setInterventionNote] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus>('investigating')
  const [selectedPreset, setSelectedPreset] = useState<string>('walking_bus')

  const availableSchools = SCHOOL_REGISTRY.filter(
    (s) => filterCountry === 'all' || s.country === filterCountry
  )

  const alerts = useLiveQuery(
    () => db.alerts.orderBy('triggeredDate').reverse().toArray(),
    []
  ) ?? []

  const filteredAlerts = alerts.filter((alert) => {
    const matchesCountry = filterCountry === 'all' || alert.country === filterCountry
    const matchesSchool = filterSchool === 'all' || alert.schoolId === filterSchool
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus
    return matchesCountry && matchesSchool && matchesStatus
  })

  const openCount = alerts.filter((a) => a.status === 'open').length
  const investigatingCount = alerts.filter((a) => a.status === 'investigating').length
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length

  const handleStartEdit = (alert: Alert) => {
    if (!alert.id) return
    setEditingAlertId(alert.id)
    setInterventionNote(alert.interventionNotes || '')
    setSelectedStatus(alert.status)
  }

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey)
    const text = INTERVENTION_PRESETS[presetKey]
    setInterventionNote(text || '')
  }

  const handleSaveCasework = async (alertId: number, studentUid: string) => {
    const isNowResolved = selectedStatus === 'resolved'
    await db.alerts.update(alertId, {
      status: selectedStatus,
      interventionNotes: interventionNote,
      resolvedAt: isNowResolved ? new Date().toISOString() : undefined,
      synced: 0,
    })

    if (isNowResolved) {
      await db.students.update(studentUid, { status: 'remediated' })
    } else if (selectedStatus === 'investigating') {
      await db.students.update(studentUid, { status: 'at-risk' })
    }

    setEditingAlertId(null)
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Open Alerts (&lt;72h Target)
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">{openCount}</p>
          <p className="text-[11px] text-rose-600 mt-1">Immediate caseworker home-visit dispatched</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Under Active Casework
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{investigatingCount}</p>
          <p className="text-[11px] text-amber-600 mt-1">Mentor remediation plan in progress</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Remediated & Re-Enrolled
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{resolvedCount}</p>
          <p className="text-[11px] text-emerald-600 mt-1">85% Remediation Benchmark Met</p>
        </div>
      </div>

      {/* Alerts List Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Regional Early-Warning Casework Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Decentralized caseworker triage for adolescent female students across 3 East African countries
            </p>
          </div>

          {/* Multi-tier Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCountry}
              onChange={(e) => {
                setFilterCountry(e.target.value)
                setFilterSchool('all')
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Countries (🇰🇪 🇺🇬 🇹🇿)</option>
              <option value="Kenya">Kenya (🇰🇪)</option>
              <option value="Uganda">Uganda (🇺🇬)</option>
              <option value="Tanzania">Tanzania (🇹🇿)</option>
            </select>

            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All 8 Partner Schools</option>
              {availableSchools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
              <button
                onClick={() => setFilterStatus('all')}
                className={`rounded-md px-2.5 py-1 transition ${
                  filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setFilterStatus('open')}
                className={`rounded-md px-2.5 py-1 transition ${
                  filterStatus === 'open' ? 'bg-white text-rose-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open ({openCount})
              </button>
              <button
                onClick={() => setFilterStatus('investigating')}
                className={`rounded-md px-2.5 py-1 transition ${
                  filterStatus === 'investigating' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Investigating ({investigatingCount})
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`rounded-md px-2.5 py-1 transition ${
                  filterStatus === 'resolved' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="mt-4 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No casework alerts match the selected filters.
            </div>
          ) : (
            filteredAlerts.map((alert: Alert) => {
              const isEditing = editingAlertId === alert.id

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-5 transition ${
                    alert.status === 'open'
                      ? 'border-rose-300 bg-rose-50/20 shadow-sm'
                      : alert.status === 'investigating'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {alert.studentUid}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          alert.status === 'open'
                            ? 'bg-rose-100 text-rose-800'
                            : alert.status === 'investigating'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {alert.status}
                      </span>
                      {alert.country && (
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {alert.country}
                        </span>
                      )}
                      {alert.schoolId && (
                        <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
                          <School className="h-3 w-3" />
                          {alert.schoolId}
                        </span>
                      )}
                      {alert.rootCause && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-100">
                          {alert.rootCause}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Triggered: {alert.triggeredDate}</span>
                      <span>·</span>
                      <span className="font-semibold text-rose-700">
                        {alert.consecutiveAbsences} Consecutive Absences
                      </span>
                    </div>
                  </div>

                  {/* Notes / Intervention section */}
                  <div className="mt-3">
                    {isEditing ? (
                      <div className="space-y-3 bg-white p-4 rounded-lg border border-indigo-200 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Casework Remediation Stage
                            </label>
                            <select
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value as AlertStatus)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500"
                            >
                              <option value="open">Open (Active Risk Alert - &lt;72h Target)</option>
                              <option value="investigating">Investigating (Mentor Action Plan Deployed)</option>
                              <option value="resolved">Resolved (Remediated &amp; Re-Enrolled)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-indigo-500" />
                              Apply Humanitarian Protocol Template
                            </label>
                            <select
                              value={selectedPreset}
                              onChange={(e) => handleApplyPreset(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500"
                            >
                              <option value="walking_bus">Walking Bus Group Escort (Flood/Commute)</option>
                              <option value="dignity_kit">MHM Dignity Kit &amp; WASH Voucher (AFRIpads)</option>
                              <option value="home_visit">Elder &amp; Guardian Dialogue (Early Marriage/ECM)</option>
                              <option value="feeding_program">Emergency School Feeding Enrollment</option>
                              <option value="remedial_tutoring">Remedial Circle &amp; Solar Study Lamp</option>
                              <option value="borehole_water">Solar Borehole Water Priority Voucher</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Intervention Notes &amp; Remediation Action Plan
                          </label>
                          <textarea
                            value={interventionNote}
                            onChange={(e) => setInterventionNote(e.target.value)}
                            rows={3}
                            placeholder="Detail caseworker actions, guardian agreements, and distributed supplies..."
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => alert.id && handleSaveCasework(alert.id, alert.studentUid)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                          >
                            <Save className="h-3.5 w-3.5" /> Save Casework Record
                          </button>
                          <button
                            onClick={() => setEditingAlertId(null)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-slate-700 flex items-start gap-2">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="leading-relaxed">
                              {alert.interventionNotes || (
                                <span className="italic text-slate-400">No intervention notes entered yet.</span>
                              )}
                            </p>
                            {alert.assignedMentor && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-1">
                                <Shield className="h-3 w-3 text-indigo-500" />
                                Assigned Lead Mentor: {alert.assignedMentor}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartEdit(alert)}
                          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                        >
                          Update Casework
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
