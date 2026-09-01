import { describe, expect, it } from 'vitest'

export interface AttendanceSample {
  present: boolean
  unexcused: boolean
}

export const countConsecutiveUnexcusedAbsences = (
  history: AttendanceSample[]
): number => {
  let count = 0
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i]
    if (!item.present && item.unexcused) {
      count++
    } else {
      break
    }
  }
  return count
}

export const isRiskThresholdReached = (history: AttendanceSample[]): boolean =>
  countConsecutiveUnexcusedAbsences(history) >= 3

describe('Early-Warning Engine (<72hr Latency)', () => {
  it('triggers when student has >= 3 consecutive unexcused absences', () => {
    const history: AttendanceSample[] = [
      { present: true, unexcused: false },
      { present: false, unexcused: true },
      { present: false, unexcused: true },
      { present: false, unexcused: true },
    ]

    expect(countConsecutiveUnexcusedAbsences(history)).toBe(3)
    expect(isRiskThresholdReached(history)).toBe(true)
  })

  it('resets absence streak when attendance is marked present', () => {
    const history: AttendanceSample[] = [
      { present: false, unexcused: true },
      { present: false, unexcused: true },
      { present: true, unexcused: false },
      { present: false, unexcused: true },
    ]

    expect(countConsecutiveUnexcusedAbsences(history)).toBe(1)
    expect(isRiskThresholdReached(history)).toBe(false)
  })

  it('does not count excused absences towards unexcused risk streak', () => {
    const history: AttendanceSample[] = [
      { present: false, unexcused: true },
      { present: false, unexcused: true },
      { present: false, unexcused: false }, // excused (e.g. sick/medical)
      { present: false, unexcused: true },
    ]

    expect(countConsecutiveUnexcusedAbsences(history)).toBe(1)
    expect(isRiskThresholdReached(history)).toBe(false)
  })
})
