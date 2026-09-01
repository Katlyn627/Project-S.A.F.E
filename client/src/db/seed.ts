import { db, type Student, type Attendance, type Alert, type VoiceFeedback, type CountryCode } from './schema'

/**
 * Creates a playable placeholder Audio WAV Blob for seeded FCRM voice notes
 */
const createSyntheticAudioBlob = (frequency: number = 440): Blob => {
  const sampleRate = 8000
  const durationSec = 2
  const numSamples = sampleRate * durationSec
  const buffer = new ArrayBuffer(44 + numSamples)
  const view = new DataView(buffer)

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  writeString(36, 'data')
  view.setUint32(40, numSamples, true)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const sample = Math.sin(2 * Math.PI * frequency * t)
    const uint8Sample = Math.floor((sample + 1) * 127.5)
    view.setUint8(44 + i, uint8Sample)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export interface SchoolMeta {
  id: string
  name: string
  country: CountryCode
  district: string
  mentor: string
  prefix: string
}

export const SCHOOL_REGISTRY: SchoolMeta[] = [
  { id: 'SCH-KE-NRK-01', name: 'Enabelbel Maasai Girls Academy', country: 'Kenya', district: 'Narok County', mentor: 'MENTOR-FAITH-NRK', prefix: 'KE-NRK' },
  { id: 'SCH-KE-TRK-02', name: 'Kakuma Peace Model Primary', country: 'Kenya', district: 'Turkana West', mentor: 'MENTOR-AMINA-TRK', prefix: 'KE-TRK' },
  { id: 'SCH-KE-KLF-03', name: 'Ganze Girls Foundational Academy', country: 'Kenya', district: 'Kilifi County', mentor: 'MENTOR-JOYCE-KLF', prefix: 'KE-KLF' },
  { id: 'SCH-KE-GRS-04', name: 'Dadaab Community Model Academy', country: 'Kenya', district: 'Garissa County', mentor: 'MENTOR-HALIMA-GRS', prefix: 'KE-GRS' },
  { id: 'SCH-UG-KRM-05', name: 'Moroto Pastoralist Girls Academy', country: 'Uganda', district: 'Karamoja Region', mentor: 'MENTOR-ESTHER-KRM', prefix: 'UG-KRM' },
  { id: 'SCH-UG-WNL-06', name: 'Rhino Camp Community Primary', country: 'Uganda', district: 'West Nile (Arua)', mentor: 'MENTOR-GRACE-WNL', prefix: 'UG-WNL' },
  { id: 'SCH-TZ-DDM-07', name: 'Kondoa Community Model Primary', country: 'Tanzania', district: 'Dodoma Region', mentor: 'MENTOR-NEEMA-DDM', prefix: 'TZ-DDM' },
  { id: 'SCH-TZ-SHY-08', name: 'Shinyanga Foundational Girls School', country: 'Tanzania', district: 'Shinyanga Region', mentor: 'MENTOR-MARIA-SHY', prefix: 'TZ-SHY' },
]

const RISK_FACTOR_POOL = [
  'MHM / Period Poverty & WASH Deficit',
  'Seasonal Flood / River Crossing Barrier',
  'Severe Drought / Water Fetching (8–12km)',
  'Long Commute (>8km Walking)',
  'Early Child Marriage (ECM) Threat',
  'Domestic Labour & Sibling Care',
  'Primary-to-Secondary Transition Risk',
  'Pastoralist Seasonal Migration',
]

export const seedMockData = async (force: boolean = false) => {
  const count = await db.students.count()
  if (count > 0 && !force) return

  if (force) {
    await db.students.clear()
    await db.attendance.clear()
    await db.alerts.clear()
    await db.voiceFeedback.clear()
  }

  const students: Student[] = []
  const alerts: Alert[] = []
  const attendanceRecords: Attendance[] = []

  // Calendar dates spanning last 3 weeks of academic term (Monday to Friday)
  const attendanceDates = [
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28',
    '2026-08-31'
  ]

  let alertCounter = 1

  // 1. Generate 25–28 Real Students per School (Total: 216 Students across 8 Schools in 3 Countries)
  SCHOOL_REGISTRY.forEach((school) => {
    const grades = [6, 7, 8]

    grades.forEach((gradeLevel) => {
      // 9 students per grade = 27 per school
      for (let i = 1; i <= 9; i++) {
        const studentNumber = (gradeLevel * 100 + i).toString().padStart(4, '0')
        const uid = `SAFE-${school.prefix}-${studentNumber}`
        const riskFactor = RISK_FACTOR_POOL[(i + gradeLevel) % RISK_FACTOR_POOL.length]

        let status: Student['status'] = 'active'
        // Deterministic vulnerable patterns for realistic testing
        if (i === 3) status = 'at-risk'
        if (i === 7) status = 'remediated'

        students.push({
          uid,
          schoolId: school.id,
          country: school.country,
          districtName: school.district,
          gradeLevel,
          status,
          riskFactor,
          assignedMentor: school.mentor,
          createdAt: '2026-08-01T08:00:00Z',
        })

        // 2. Generate Historical Attendance Log Pattern for this Student
        attendanceDates.forEach((date, dateIdx) => {
          let present = true
          let unexcused = false
          let category = 'routine'
          let notes = 'Present in class'

          // At-Risk Scenario (i === 3): 4-day consecutive unexcused absence at end of window
          if (i === 3) {
            if (dateIdx >= 12) {
              present = false
              unexcused = true
              category = riskFactor.includes('Flood')
                ? 'climate_flood'
                : riskFactor.includes('MHM')
                ? 'mhm_wash'
                : 'domestic_labour'
              notes = `Unexcused absence streak: ${riskFactor}`
            }
          }
          // Remediated Scenario (i === 7): Absences in middle, perfect attendance in last 8 days
          else if (i === 7) {
            if (dateIdx >= 5 && dateIdx <= 7) {
              present = false
              unexcused = true
              category = 'commute_distance'
              notes = 'Historical absence (Prior to walking bus intervention)'
            } else {
              present = true
              unexcused = false
              category = 'routine'
              notes = 'Present (Remediated post-casework intervention)'
            }
          }
          // Regular Cohort: 94% present rate with occasional single excused day
          else {
            const isSingleExcused = (i * 3 + dateIdx) % 14 === 0
            if (isSingleExcused) {
              present = false
              unexcused = false
              category = 'illness'
              notes = 'Guardian excused absence (Malaria/clinic recovery)'
            }
          }

          attendanceRecords.push({
            studentUid: uid,
            date,
            present,
            unexcused,
            category,
            notes,
            synced: 1,
            createdAt: `${date}T08:15:00Z`,
          })
        })

        // 3. Generate Casework Alerts for Flagged Students
        if (i === 3) {
          alerts.push({
            id: alertCounter++,
            studentUid: uid,
            schoolId: school.id,
            country: school.country,
            triggeredDate: '2026-08-31',
            consecutiveAbsences: 4,
            status: 'open',
            rootCause: riskFactor,
            assignedMentor: school.mentor,
            interventionType: riskFactor.includes('Flood') ? 'walking_bus' : riskFactor.includes('MHM') ? 'dignity_kit' : 'home_visit',
            interventionNotes: `CRITICAL ALERT (<72h Target): 4 consecutive unexcused absences detected in ${school.district}. Primary vulnerability: ${riskFactor}. Immediate caseworker dispatch required.`,
            synced: 1,
            createdAt: '2026-08-31T07:30:00Z',
          })
        } else if (i === 7) {
          alerts.push({
            id: alertCounter++,
            studentUid: uid,
            schoolId: school.id,
            country: school.country,
            triggeredDate: '2026-08-18',
            consecutiveAbsences: 3,
            status: 'resolved',
            rootCause: riskFactor,
            assignedMentor: school.mentor,
            interventionType: 'walking_bus',
            interventionNotes: `CASEWORK REMEDIATED: Completed mentor triage in ${school.district}. Enrolled student in verified peer walking group and provided solar study lamp. Student achieved 100% attendance over subsequent 8 days.`,
            synced: 1,
            createdAt: '2026-08-18T09:00:00Z',
            resolvedAt: '2026-08-25T14:30:00Z',
          })
        }
      }
    })
  })

  await db.students.bulkPut(students)
  await db.attendance.bulkPut(attendanceRecords)
  await db.alerts.bulkPut(alerts)

  // 4. Seed Multi-Lingual Community Voice Feedback Notes (FCRM)
  const voiceNotes: VoiceFeedback[] = [
    {
      id: 1,
      schoolId: 'SCH-KE-NRK-01',
      country: 'Kenya',
      timestamp: '2026-08-31T06:45:00Z',
      durationSeconds: 38,
      audioBlob: createSyntheticAudioBlob(440),
      language: 'Maa',
      category: 'infrastructure_barrier',
      status: 'escalated',
      transcriptSummary: 'Elder Ole Saitoti (Narok / Mara): "Seasonal heavy downpours flooded the Talek river crossing. 16 girls in Grade 7 & 8 are blocked from walking to school until the community wooden footbridge is repaired."',
      synced: 1,
    },
    {
      id: 2,
      schoolId: 'SCH-KE-TRK-02',
      country: 'Kenya',
      timestamp: '2026-08-30T15:20:00Z',
      durationSeconds: 45,
      audioBlob: createSyntheticAudioBlob(480),
      language: 'Swahili',
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Community Mentor Amina (Turkana): "Grade 7 girls reported the primary school solar borehole pump is damaged. Girls are trekking 9km to seasonal sand river wells after school, causing morning exhaustion."',
      synced: 1,
    },
    {
      id: 3,
      schoolId: 'SCH-UG-KRM-05',
      country: 'Uganda',
      timestamp: '2026-08-29T11:10:00Z',
      durationSeconds: 41,
      audioBlob: createSyntheticAudioBlob(520),
      language: 'Karimojong',
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'Mother Lokol (Moroto / Karamoja): "Pastoralist families in Nadunget are planning dry-season livestock migration. We need mobile mentor learning circles so the older daughters do not drop out permanently."',
      synced: 1,
    },
    {
      id: 4,
      schoolId: 'SCH-TZ-DDM-07',
      country: 'Tanzania',
      timestamp: '2026-08-28T09:30:00Z',
      durationSeconds: 32,
      audioBlob: createSyntheticAudioBlob(400),
      language: 'Swahili',
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Parent Committee Rep (Kondoa / Dodoma): "The dignity kits and AFRIpads distribution has drastically cut monthly absenteeism in standard 7. Girls who used to stay home 4 days a month are now attending all week."',
      synced: 1,
    },
    {
      id: 5,
      schoolId: 'SCH-KE-KLF-03',
      country: 'Kenya',
      timestamp: '2026-08-27T14:15:00Z',
      durationSeconds: 29,
      audioBlob: createSyntheticAudioBlob(460),
      language: 'Swahili',
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'CPO Joyce (Kilifi / Ganze): "Flagged early engagement risk for two Grade 8 candidates in Sokoke sub-location. Coordinated with Area Chief for child protection dialogue on Friday."',
      synced: 1,
    },
    {
      id: 6,
      schoolId: 'SCH-UG-WNL-06',
      country: 'Uganda',
      timestamp: '2026-08-26T16:00:00Z',
      durationSeconds: 35,
      audioBlob: createSyntheticAudioBlob(500),
      language: 'English',
      category: 'general',
      status: 'reviewed',
      transcriptSummary: 'Head Teacher Grace (Rhino Camp / West Nile): "Solar study lamps distributed to 40 exam candidates have enabled evening peer study groups across settlement zones."',
      synced: 1,
    },
    {
      id: 7,
      schoolId: 'SCH-TZ-SHY-08',
      country: 'Tanzania',
      timestamp: '2026-08-25T10:45:00Z',
      durationSeconds: 33,
      audioBlob: createSyntheticAudioBlob(420),
      language: 'Swahili',
      category: 'infrastructure_barrier',
      status: 'reviewed',
      transcriptSummary: 'Mentor Maria (Shinyanga): "Community walking bus groups from Solwa have safely escorted 24 female students through rural transit paths with zero harassment incidents this month."',
      synced: 1,
    },
    {
      id: 8,
      schoolId: 'SCH-KE-GRS-04',
      country: 'Kenya',
      timestamp: '2026-08-24T08:10:00Z',
      durationSeconds: 36,
      audioBlob: createSyntheticAudioBlob(450),
      language: 'Somali',
      category: 'general',
      status: 'reviewed',
      transcriptSummary: 'Elder Abdi (Dadaab / Garissa): "Midday school porridge feeding support has stabilized morning attendance in Standard 6 and 7 during the current dry spell."',
      synced: 1,
    },
  ]

  await db.voiceFeedback.bulkPut(voiceNotes)

  console.log(
    `Project S.A.F.E. Enterprise Dataset Loaded: ${students.length} students across 8 schools (3 countries), ${attendanceRecords.length} attendance records, ${alerts.length} casework alerts, and ${voiceNotes.length} voice notes.`
  )
}
