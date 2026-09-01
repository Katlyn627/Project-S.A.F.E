export interface AttendanceRiskSample {
  status: 'present' | 'absent'
  isExcused: boolean
}

export const countConsecutiveUnexcusedAbsences = (
  attendanceHistory: AttendanceRiskSample[],
): number => {
  let consecutiveAbsences = 0

  for (const record of attendanceHistory) {
    if (record.status === 'absent' && !record.isExcused) {
      consecutiveAbsences += 1
      continue
    }

    break
  }

  return consecutiveAbsences
}

export const isStudentAtRisk = (attendanceHistory: AttendanceRiskSample[]): boolean =>
  countConsecutiveUnexcusedAbsences(attendanceHistory) > 3
