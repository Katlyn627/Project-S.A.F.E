import { db, type Student, type Attendance, type Alert, type VoiceFeedback } from './schema'

/**
 * Creates a playable placeholder Audio WAV Blob for seeded FCRM voice notes
 */
const createSyntheticAudioBlob = (): Blob => {
  const sampleRate = 8000
  const durationSec = 2
  const numSamples = sampleRate * durationSec
  const buffer = new ArrayBuffer(44 + numSamples)
  const view = new DataView(buffer)

  // RIFF header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // Audio format 1 = PCM
  view.setUint16(22, 1, true) // Mono channel
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true) // Byte rate
  view.setUint16(32, 1, true) // Block align
  view.setUint16(34, 8, true) // Bits per sample
  writeString(36, 'data')
  view.setUint32(40, numSamples, true)

  // Gentle audio tone
  for (let i = 0; i < numSamples; i++) {
    const frequency = 440 // A4 note
    const t = i / sampleRate
    const sample = Math.sin(2 * Math.PI * frequency * t)
    const uint8Sample = Math.floor((sample + 1) * 127.5)
    view.setUint8(44 + i, uint8Sample)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export const seedMockData = async (force: boolean = false) => {
  const count = await db.students.count()
  if (count > 0 && !force) return

  if (force) {
    await db.students.clear()
    await db.attendance.clear()
    await db.alerts.clear()
    await db.voiceFeedback.clear()
  }

  // 1. Seed 32 Research-Grounded Anonymized Student Records across 4 Rural Counties
  const students: Student[] = [
    // SCH-NAROK-01 (Narok County - Mara Pastoralist Zone)
    { uid: 'SAFE-NRK-0101', schoolId: 'SCH-NAROK-01', gradeLevel: 7, status: 'active', riskFactor: 'Long Commute (>7km)', assignedMentor: 'MENTOR-FAITH-01' },
    { uid: 'SAFE-NRK-0102', schoolId: 'SCH-NAROK-01', gradeLevel: 7, status: 'active', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-FAITH-01' },
    { uid: 'SAFE-NRK-0103', schoolId: 'SCH-NAROK-01', gradeLevel: 7, status: 'at-risk', riskFactor: 'Flood / River Crossing Barrier', assignedMentor: 'MENTOR-FAITH-01' },
    { uid: 'SAFE-NRK-0104', schoolId: 'SCH-NAROK-01', gradeLevel: 7, status: 'active', riskFactor: 'Pastoralist Migration', assignedMentor: 'MENTOR-FAITH-01' },
    { uid: 'SAFE-NRK-0105', schoolId: 'SCH-NAROK-01', gradeLevel: 8, status: 'active', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-FAITH-01' },
    { uid: 'SAFE-NRK-0106', schoolId: 'SCH-NAROK-01', gradeLevel: 8, status: 'active', riskFactor: 'Domestic Labour / Herding', assignedMentor: 'MENTOR-FAITH-01' },
    { uid: 'SAFE-NRK-0107', schoolId: 'SCH-NAROK-01', gradeLevel: 8, status: 'active', riskFactor: 'Long Commute (>9km)', assignedMentor: 'MENTOR-FAITH-01' },
    { uid: 'SAFE-NRK-0108', schoolId: 'SCH-NAROK-01', gradeLevel: 8, status: 'remediated', riskFactor: 'Flood / River Crossing Barrier', assignedMentor: 'MENTOR-FAITH-01' },

    // SCH-TURK-02 (Turkana West - Arid Drought Zone)
    { uid: 'SAFE-TRK-0201', schoolId: 'SCH-TURK-02', gradeLevel: 7, status: 'active', riskFactor: 'Severe Drought / Water Fetching', assignedMentor: 'MENTOR-AMINA-02' },
    { uid: 'SAFE-TRK-0202', schoolId: 'SCH-TURK-02', gradeLevel: 7, status: 'active', riskFactor: 'Food Insecurity', assignedMentor: 'MENTOR-AMINA-02' },
    { uid: 'SAFE-TRK-0203', schoolId: 'SCH-TURK-02', gradeLevel: 7, status: 'active', riskFactor: 'Long Commute (>10km)', assignedMentor: 'MENTOR-AMINA-02' },
    { uid: 'SAFE-TRK-0204', schoolId: 'SCH-TURK-02', gradeLevel: 7, status: 'active', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-AMINA-02' },
    { uid: 'SAFE-TRK-0205', schoolId: 'SCH-TURK-02', gradeLevel: 8, status: 'at-risk', riskFactor: 'Severe Drought / Water Fetching', assignedMentor: 'MENTOR-AMINA-02' },
    { uid: 'SAFE-TRK-0206', schoolId: 'SCH-TURK-02', gradeLevel: 8, status: 'active', riskFactor: 'Sibling Caregiving', assignedMentor: 'MENTOR-AMINA-02' },
    { uid: 'SAFE-TRK-0207', schoolId: 'SCH-TURK-02', gradeLevel: 8, status: 'active', riskFactor: 'Food Insecurity', assignedMentor: 'MENTOR-AMINA-02' },
    { uid: 'SAFE-TRK-0208', schoolId: 'SCH-TURK-02', gradeLevel: 8, status: 'remediated', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-AMINA-02' },

    // SCH-KILIFI-03 (Kilifi County - Ganze Semi-Arid Belt)
    { uid: 'SAFE-KLF-0301', schoolId: 'SCH-KILIFI-03', gradeLevel: 7, status: 'active', riskFactor: 'Transport Poverty', assignedMentor: 'MENTOR-JOYCE-03' },
    { uid: 'SAFE-KLF-0302', schoolId: 'SCH-KILIFI-03', gradeLevel: 7, status: 'at-risk', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-JOYCE-03' },
    { uid: 'SAFE-KLF-0303', schoolId: 'SCH-KILIFI-03', gradeLevel: 7, status: 'active', riskFactor: 'Early Marriage Threat', assignedMentor: 'MENTOR-JOYCE-03' },
    { uid: 'SAFE-KLF-0304', schoolId: 'SCH-KILIFI-03', gradeLevel: 7, status: 'active', riskFactor: 'Domestic Labour / Farming', assignedMentor: 'MENTOR-JOYCE-03' },
    { uid: 'SAFE-KLF-0305', schoolId: 'SCH-KILIFI-03', gradeLevel: 8, status: 'active', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-JOYCE-03' },
    { uid: 'SAFE-KLF-0306', schoolId: 'SCH-KILIFI-03', gradeLevel: 8, status: 'active', riskFactor: 'Transport Poverty', assignedMentor: 'MENTOR-JOYCE-03' },
    { uid: 'SAFE-KLF-0307', schoolId: 'SCH-KILIFI-03', gradeLevel: 8, status: 'remediated', riskFactor: 'Early Marriage Threat', assignedMentor: 'MENTOR-JOYCE-03' },
    { uid: 'SAFE-KLF-0308', schoolId: 'SCH-KILIFI-03', gradeLevel: 8, status: 'active', riskFactor: 'Domestic Labour / Farming', assignedMentor: 'MENTOR-JOYCE-03' },

    // SCH-GARISSA-04 (Garissa County - Border Transition Zone)
    { uid: 'SAFE-GRS-0401', schoolId: 'SCH-GARISSA-04', gradeLevel: 7, status: 'active', riskFactor: 'Primary-to-Secondary Transition', assignedMentor: 'MENTOR-HALIMA-04' },
    { uid: 'SAFE-GRS-0402', schoolId: 'SCH-GARISSA-04', gradeLevel: 7, status: 'active', riskFactor: 'Domestic Labour / Caregiving', assignedMentor: 'MENTOR-HALIMA-04' },
    { uid: 'SAFE-GRS-0403', schoolId: 'SCH-GARISSA-04', gradeLevel: 7, status: 'active', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-HALIMA-04' },
    { uid: 'SAFE-GRS-0404', schoolId: 'SCH-GARISSA-04', gradeLevel: 8, status: 'at-risk', riskFactor: 'Primary-to-Secondary Transition', assignedMentor: 'MENTOR-HALIMA-04' },
    { uid: 'SAFE-GRS-0405', schoolId: 'SCH-GARISSA-04', gradeLevel: 8, status: 'active', riskFactor: 'Long Commute (>8km)', assignedMentor: 'MENTOR-HALIMA-04' },
    { uid: 'SAFE-GRS-0406', schoolId: 'SCH-GARISSA-04', gradeLevel: 8, status: 'active', riskFactor: 'Drought Water Fetching', assignedMentor: 'MENTOR-HALIMA-04' },
    { uid: 'SAFE-GRS-0407', schoolId: 'SCH-GARISSA-04', gradeLevel: 8, status: 'remediated', riskFactor: 'MHM / Period Poverty', assignedMentor: 'MENTOR-HALIMA-04' },
    { uid: 'SAFE-GRS-0408', schoolId: 'SCH-GARISSA-04', gradeLevel: 8, status: 'active', riskFactor: 'Domestic Labour / Caregiving', assignedMentor: 'MENTOR-HALIMA-04' },
  ]

  await db.students.bulkPut(students)

  // 2. Seed Realistic Multi-Day Attendance Logs Demonstrating Field Realities
  const dates = [
    '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31'
  ]

  const attendanceRecords: Attendance[] = []

  students.forEach((student) => {
    dates.forEach((date) => {
      // Specific simulated scenarios:

      // Scenario A: SAFE-NRK-0103 (Flooding on Talek River - 4 consecutive unexcused absences)
      if (student.uid === 'SAFE-NRK-0103') {
        const isFloodedDay = date >= '2026-08-28'
        attendanceRecords.push({
          studentUid: student.uid,
          date,
          present: !isFloodedDay,
          unexcused: isFloodedDay,
          category: isFloodedDay ? 'climate_flood' : 'routine',
          notes: isFloodedDay ? 'Talek river flooded, footbridge submerged.' : 'Present in class',
          synced: 1,
        })
        return
      }

      // Scenario B: SAFE-TRK-0205 (Water Fetching Migration - 3 consecutive absences)
      if (student.uid === 'SAFE-TRK-0205') {
        const isDroughtDuty = date >= '2026-08-29'
        attendanceRecords.push({
          studentUid: student.uid,
          date,
          present: !isDroughtDuty,
          unexcused: isDroughtDuty,
          category: isDroughtDuty ? 'domestic_labour' : 'routine',
          notes: isDroughtDuty ? 'Assigned 12km water fetching for household livestock.' : 'Present in class',
          synced: 1,
        })
        return
      }

      // Scenario C: SAFE-KLF-0302 (MHM / Period Poverty - 3 consecutive absences)
      if (student.uid === 'SAFE-KLF-0302') {
        const isPeriodDay = date >= '2026-08-29'
        attendanceRecords.push({
          studentUid: student.uid,
          date,
          present: !isPeriodDay,
          unexcused: isPeriodDay,
          category: isPeriodDay ? 'mhm_wash' : 'routine',
          notes: isPeriodDay ? 'Missing school due to lack of sanitary pads / private WASH.' : 'Present in class',
          synced: 1,
        })
        return
      }

      // Scenario D: Remediated Students (Perfect attendance post-intervention)
      if (student.status === 'remediated') {
        attendanceRecords.push({
          studentUid: student.uid,
          date,
          present: true,
          unexcused: false,
          category: 'routine',
          notes: 'Present (Remediated via walking group & dignity kit).',
          synced: 1,
        })
        return
      }

      // General Baseline Population: 95% regular attendance with occasional single excused day
      const isRandomAbsent = Math.random() < 0.08
      attendanceRecords.push({
        studentUid: student.uid,
        date,
        present: !isRandomAbsent,
        unexcused: false,
        category: isRandomAbsent ? 'illness' : 'routine',
        notes: isRandomAbsent ? 'Excused malaria recovery note provided by guardian.' : 'Present in class',
        synced: 1,
      })
    })
  })

  await db.attendance.bulkPut(attendanceRecords)

  // 3. Seed Realistic Humanitarian Casework Alerts (Open, Investigating, Remediated)
  const alerts: Alert[] = [
    {
      studentUid: 'SAFE-NRK-0103',
      schoolId: 'SCH-NAROK-01',
      triggeredDate: '2026-08-31',
      consecutiveAbsences: 4,
      status: 'open',
      rootCause: 'Flash Flood / River Crossing Barrier',
      assignedMentor: 'MENTOR-FAITH-01',
      interventionType: 'walking_bus',
      interventionNotes: 'CRITICAL ALERT (<72hr Target): Student has 4 consecutive absences due to Talek River seasonal flooding. Mentor dispatched to assign student to elevated bridge walking bus.',
      synced: 1,
      createdAt: '2026-08-31T07:30:00Z',
    },
    {
      studentUid: 'SAFE-TRK-0205',
      schoolId: 'SCH-TURK-02',
      triggeredDate: '2026-08-31',
      consecutiveAbsences: 3,
      status: 'open',
      rootCause: 'Severe Drought / Water Fetching Migration',
      assignedMentor: 'MENTOR-AMINA-02',
      interventionType: 'home_visit',
      interventionNotes: 'CRITICAL ALERT: Student withdrew for 12km daily water fetching. CPO scheduled guardian dialogue to enroll household into community water kiosk scheme.',
      synced: 1,
      createdAt: '2026-08-31T08:15:00Z',
    },
    {
      studentUid: 'SAFE-KLF-0302',
      schoolId: 'SCH-KILIFI-03',
      triggeredDate: '2026-08-30',
      consecutiveAbsences: 3,
      status: 'investigating',
      rootCause: 'MHM / Period Poverty & WASH Deficit',
      assignedMentor: 'MENTOR-JOYCE-03',
      interventionType: 'dignity_kit',
      interventionNotes: 'Mentor visit conducted. Distributed 6-month reusable menstrual hygiene kit (AFRIpads) and verified access to school private washroom.',
      synced: 1,
      createdAt: '2026-08-30T10:00:00Z',
    },
    {
      studentUid: 'SAFE-GRS-0404',
      schoolId: 'SCH-GARISSA-04',
      triggeredDate: '2026-08-29',
      consecutiveAbsences: 3,
      status: 'investigating',
      rootCause: 'Primary-to-Secondary Transition Risk',
      assignedMentor: 'MENTOR-HALIMA-04',
      interventionType: 'remedial_tutoring',
      interventionNotes: 'Identified academic anxiety in Grade 8 transition exam prep. Mentor enrolled student in weekend remedial peer-circle and provided solar study lamp.',
      synced: 1,
      createdAt: '2026-08-29T14:20:00Z',
    },
    {
      studentUid: 'SAFE-NRK-0108',
      schoolId: 'SCH-NAROK-01',
      triggeredDate: '2026-08-15',
      consecutiveAbsences: 4,
      status: 'resolved',
      rootCause: 'Long Commute & River Crossing Barrier',
      assignedMentor: 'MENTOR-FAITH-01',
      interventionType: 'walking_bus',
      interventionNotes: 'CASEWORK REMEDIATED: Student assigned to community walking bus group with 5 peers and given safety reflector vest. Student has maintained 100% attendance across last 14 school days.',
      synced: 1,
      createdAt: '2026-08-15T09:00:00Z',
      resolvedAt: '2026-08-22T16:00:00Z',
    },
    {
      studentUid: 'SAFE-KLF-0307',
      schoolId: 'SCH-KILIFI-03',
      triggeredDate: '2026-08-12',
      consecutiveAbsences: 3,
      status: 'resolved',
      rootCause: 'Early Child Marriage (ECM) Pressure',
      assignedMentor: 'MENTOR-JOYCE-03',
      interventionType: 'home_visit',
      interventionNotes: 'CASEWORK REMEDIATED: Village Chief and Child Protection Officer held formal family dialogue. Guardian signed child schooling commitment contract. Student re-enrolled with 98% attendance.',
      synced: 1,
      createdAt: '2026-08-12T11:30:00Z',
      resolvedAt: '2026-08-20T14:00:00Z',
    },
  ]

  await db.alerts.bulkPut(alerts)

  // 4. Seed Authentic FCRM Voice Feedback Items with Playable Audio Blobs
  const audioBlob = createSyntheticAudioBlob()

  const voiceFeedback: VoiceFeedback[] = [
    {
      id: 1,
      schoolId: 'SCH-NAROK-01',
      timestamp: '2026-08-31T06:45:00Z',
      durationSeconds: 34,
      audioBlob,
      category: 'infrastructure_barrier',
      status: 'escalated',
      transcriptSummary: 'Elder Ole Saitoti (Enabelbel Village): "The seasonal rains flooded the Talek river crossing this morning. 12 girls from our boma cannot cross to school without a wooden footbridge repair."',
      synced: 1,
    },
    {
      id: 2,
      schoolId: 'SCH-TURK-02',
      timestamp: '2026-08-30T15:20:00Z',
      durationSeconds: 42,
      audioBlob,
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Community Mentor Amina: "Grade 7 girls reported the primary borehole solar pump broke down. They have to walk 6km to the riverbed after classes, leading to exhaustion and missing morning lessons."',
      synced: 1,
    },
    {
      id: 3,
      schoolId: 'SCH-KILIFI-03',
      timestamp: '2026-08-29T11:10:00Z',
      durationSeconds: 28,
      audioBlob,
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'Parent Committee Rep (Ganze): "Requesting mentor check-in for two families in Sokoke considering withdrawing daughters for early engagement before standard 8 exams."',
      synced: 1,
    },
    {
      id: 4,
      schoolId: 'SCH-GARISSA-04',
      timestamp: '2026-08-28T09:30:00Z',
      durationSeconds: 31,
      audioBlob,
      category: 'general',
      status: 'reviewed',
      transcriptSummary: 'Head Teacher Hassan: "The new solar lamps provided under Project S.A.F.E. have improved evening study groups for 45 girls preparing for national examinations."',
      synced: 1,
    },
  ]

  await db.voiceFeedback.bulkPut(voiceFeedback)
  console.log('Project S.A.F.E. research-grounded authentic dataset seeded successfully.')
}
