import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Alert, type AlertStatus } from '../db/schema'
import { AlertTriangle, ShieldCheck, Clock, FileText, Save } from 'lucide-react'

export const CaseworkAlerts: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editingAlertId, setEditingAlertId] = useState<number | null>(null)
  const [interventionNote, setInterventionNote] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus>('investigating')

  const alerts = useLiveQuery(
    () => {
      let query = db.alerts.orderBy('triggeredDate').reverse()
      return query.toArray()
    },
    []
  ) ?? []

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === 'all') return true
    return alert.status === filterStatus
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
          <p className="text-[11px] text-rose-600 mt-1">Requires immediate mentor home-visit</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Under Investigation
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{investigatingCount}</p>
          <p className="text-[11px] text-amber-600 mt-1">Casework plan in progress</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Remediated & Resolved
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{resolvedCount}</p>
          <p className="text-[11px] text-emerald-600 mt-1">Beneficiary re-engaged in school</p>
        </div>
      </div>

      {/* Alerts List Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Early-Warning Casework Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid response casework for adolescent girls flagged at risk of dropout
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`rounded-md px-3 py-1 transition ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={`rounded-md px-3 py-1 transition ${
                filterStatus === 'open' ? 'bg-white text-rose-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setFilterStatus('investigating')}
              className={`rounded-md px-3 py-1 transition ${
                filterStatus === 'investigating' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Investigating ({investigatingCount})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`rounded-md px-3 py-1 transition ${
                filterStatus === 'resolved' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="mt-4 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No alerts match the selected filter.
            </div>
          ) : (
            filteredAlerts.map((alert: Alert) => {
              const isEditing = editingAlertId === alert.id

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-5 transition ${
                    alert.status === 'open'
                      ? 'border-rose-300 bg-rose-50/20'
                      : alert.status === 'investigating'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
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
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Casework Status
                          </label>
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as AlertStatus)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="open">Open (Active Alert)</option>
                            <option value="investigating">Investigating (Mentor Assigned)</option>
                            <option value="resolved">Resolved (Remediated)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Intervention Notes & Action Plan
                          </label>
                          <textarea
                            value={interventionNote}
                            onChange={(e) => setInterventionNote(e.target.value)}
                            rows={3}
                            placeholder="e.g. Conducted mentor home visit. Distributed scholastic materials and assigned walking group."
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert.id && handleSaveCasework(alert.id, alert.studentUid)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                          >
                            <Save className="h-3.5 w-3.5" /> Save Casework
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
                          <span>
                            {alert.interventionNotes || (
                              <span className="italic text-slate-400">No intervention notes entered yet.</span>
                            )}
                          </span>
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
