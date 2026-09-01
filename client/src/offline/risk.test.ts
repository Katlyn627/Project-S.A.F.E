import { describe, expect, it } from 'vitest'
import { countConsecutiveUnexcusedAbsences, isStudentAtRisk } from './risk'

describe('risk detection', () => {
  it('flags only after four consecutive unexcused absences', () => {
    const history = [
      { status: 'absent', isExcused: false },
      { status: 'absent', isExcused: false },
      { status: 'absent', isExcused: false },
      { status: 'absent', isExcused: false },
    ] as const

    expect(countConsecutiveUnexcusedAbsences([...history])).toBe(4)
    expect(isStudentAtRisk([...history])).toBe(true)
  })

  it('resets streak when attendance is present or absence is excused', () => {
    const history = [
      { status: 'absent', isExcused: false },
      { status: 'absent', isExcused: false },
      { status: 'present', isExcused: false },
      { status: 'absent', isExcused: false },
    ] as const

    expect(countConsecutiveUnexcusedAbsences([...history])).toBe(2)
    expect(isStudentAtRisk([...history])).toBe(false)
  })
})
