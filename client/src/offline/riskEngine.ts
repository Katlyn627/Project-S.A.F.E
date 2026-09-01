import { db, type Alert } from '../db/schema'

export interface RiskEvaluationResult {
  isAtRisk: boolean
  consecutiveAbsences: number
  alertCreated: boolean
  alert?: Alert
}

/**
 * Evaluates student absence history locally.
 * Triggers an Early-Warning Alert when >= 3 consecutive unexcused absences occur (< 72hr intervention window).
 */
export const checkAndTriggerEarlyWarning = async (
  studentUid: string,
  currentDate: string
): Promise<RiskEvaluationResult> => {
  // Retrieve attendance history sorted chronologically
  const history = await db.attendance
    .where('studentUid')
    .equals(studentUid)
    .sortBy('date')

  let consecutiveAbsences = 0

  // Count backwards from newest to oldest
  for (let i = history.length - 1; i >= 0; i--) {
    const record = history[i]
    if (!record.present && record.unexcused) {
      consecutiveAbsences++
    } else {
      break // Streak broken
    }
  }

  if (consecutiveAbsences >= 3) {
    // Check if an open/investigating alert already exists for this streak
    const existingOpenAlert = await db.alerts
      .where('studentUid')
      .equals(studentUid)
      .filter((a) => a.status === 'open' || a.status === 'investigating')
      .first()

    if (!existingOpenAlert) {
      const newAlert: Alert = {
        studentUid,
        triggeredDate: currentDate,
        consecutiveAbsences,
        status: 'open',
        interventionNotes: `Automated 72hr early-warning trigger: ${consecutiveAbsences} consecutive unexcused absences detected. Casework follow-up required.`,
        synced: 0,
        createdAt: new Date().toISOString(),
      }

      const alertId = await db.alerts.add(newAlert)
      // Also update student status to 'at-risk'
      await db.students.update(studentUid, { status: 'at-risk' })

      return {
        isAtRisk: true,
        consecutiveAbsences,
        alertCreated: true,
        alert: { ...newAlert, id: alertId },
      }
    }

    return {
      isAtRisk: true,
      consecutiveAbsences,
      alertCreated: false,
      alert: existingOpenAlert,
    }
  }

  return {
    isAtRisk: false,
    consecutiveAbsences,
    alertCreated: false,
  }
}

