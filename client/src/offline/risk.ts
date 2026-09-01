export interface AttendanceRiskSample {
  present: boolean
  unexcused: boolean
}

export const countConsecutiveUnexcusedAbsences = (
  attendanceHistory: AttendanceRiskSample[]
): number => {
  let consecutiveAbsences = 0

  for (let i = attendanceHistory.length - 1; i >= 0; i--) {
    const record = attendanceHistory[i]
    if (!record.present && record.unexcused) {
      consecutiveAbsences += 1
    } else {
      break
    }
  }

  return consecutiveAbsences
}

export const isStudentAtRisk = (attendanceHistory: AttendanceRiskSample[]): boolean =>
  countConsecutiveUnexcusedAbsences(attendanceHistory) >= 3
