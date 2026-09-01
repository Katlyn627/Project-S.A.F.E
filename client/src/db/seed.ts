import { db } from './schema'

export const seedMockData = async () => {
  const count = await db.students.count()
  if (count > 0) return

  // Seed 10 sample anonymized students across 2 partner schools
  await db.students.bulkPut([
    { uid: 'SAFE-KE-0012', schoolId: 'SCH-MARA-01', gradeLevel: 7, status: 'active' },
    { uid: 'SAFE-KE-0034', schoolId: 'SCH-MARA-01', gradeLevel: 7, status: 'active' },
    { uid: 'SAFE-KE-0058', schoolId: 'SCH-MARA-01', gradeLevel: 8, status: 'at-risk' },
    { uid: 'SAFE-KE-0071', schoolId: 'SCH-MARA-01', gradeLevel: 8, status: 'active' },
    { uid: 'SAFE-KE-0095', schoolId: 'SCH-MARA-01', gradeLevel: 8, status: 'active' },
    { uid: 'SAFE-KE-0104', schoolId: 'SCH-RIV-02', gradeLevel: 7, status: 'active' },
    { uid: 'SAFE-KE-0128', schoolId: 'SCH-RIV-02', gradeLevel: 7, status: 'at-risk' },
    { uid: 'SAFE-KE-0143', schoolId: 'SCH-RIV-02', gradeLevel: 8, status: 'active' },
    { uid: 'SAFE-KE-0167', schoolId: 'SCH-RIV-02', gradeLevel: 8, status: 'active' },
    { uid: 'SAFE-KE-0189', schoolId: 'SCH-RIV-02', gradeLevel: 8, status: 'remediated' },
  ])

  // Seed historical attendance to trigger a baseline early-warning alert
  await db.attendance.bulkPut([
    { studentUid: 'SAFE-KE-0058', date: '2026-08-28', present: false, unexcused: true, synced: 1 },
    { studentUid: 'SAFE-KE-0058', date: '2026-08-29', present: false, unexcused: true, synced: 1 },
    { studentUid: 'SAFE-KE-0058', date: '2026-08-30', present: false, unexcused: true, synced: 1 },
  ])

  await db.alerts.put({
    studentUid: 'SAFE-KE-0058',
    triggeredDate: '2026-08-30',
    consecutiveAbsences: 3,
    status: 'open',
    interventionNotes: 'Identified rainy season river crossing barrier. Assigned to walking group.',
    synced: 1,
  })
}

