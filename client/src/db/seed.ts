import { db, type Student, type Attendance, type Alert, type VoiceFeedback, type CountryCode } from './schema'

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
  const shouldReSeed = force || count < 200
  if (!shouldReSeed) return

  await db.students.clear()
  await db.attendance.clear()
  await db.alerts.clear()
  await db.voiceFeedback.clear()

  const students: Student[] = []
  const alerts: Alert[] = []
  const attendanceRecords: Attendance[] = []

  const attendanceDates = [
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28',
    '2026-08-31'
  ]

  let alertCounter = 1

  // 1. Generate 216 Real Students across 8 Schools in 3 Countries
  SCHOOL_REGISTRY.forEach((school) => {
    const grades = [6, 7, 8]

    grades.forEach((gradeLevel) => {
      for (let i = 1; i <= 9; i++) {
        const studentNumber = (gradeLevel * 100 + i).toString().padStart(4, '0')
        const uid = `SAFE-${school.prefix}-${studentNumber}`
        const riskFactor = RISK_FACTOR_POOL[(i + gradeLevel) % RISK_FACTOR_POOL.length]

        let status: Student['status'] = 'active'
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

        // Historical Attendance Logs
        attendanceDates.forEach((date, dateIdx) => {
          let present = true
          let unexcused = false
          let category = 'routine'
          let notes = 'Present in class'

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
          } else if (i === 7) {
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
          } else {
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

        // Casework Alerts
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

  // 2. Seed Multi-Lingual Community Voice Feedback across all regional languages
  const voiceNotes: VoiceFeedback[] = [
    {
      id: 1,
      schoolId: 'SCH-KE-NRK-01',
      country: 'Kenya',
      timestamp: '2026-08-31T06:45:00Z',
      durationSeconds: 12,
      language: 'Maa',
      category: 'infrastructure_barrier',
      status: 'escalated',
      transcriptSummary: 'Elder Ole Saitoti from Enabelbel: Seasonal heavy rainfall has caused the Talek river crossing to overflow. Sixteen adolescent girls in Grade 7 and 8 are unable to walk to class until the footbridge is repaired.',
      synced: 1,
    },
    {
      id: 2,
      schoolId: 'SCH-KE-TRK-02',
      country: 'Kenya',
      timestamp: '2026-08-30T15:20:00Z',
      durationSeconds: 14,
      language: 'Swahili',
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Community Mentor Amina in Kakuma: Wasichana wa Darasa la Saba wameripoti kuwa pampu ya maji ya jua imeharibika. Wanalazimika kutembea kilomita kenda kutafuta maji mtoni, na hii inawafanya wakose masomo ya asubuhi.',
      synced: 1,
    },
    {
      id: 3,
      schoolId: 'SCH-UG-KRM-05',
      country: 'Uganda',
      timestamp: '2026-08-29T11:10:00Z',
      durationSeconds: 13,
      language: 'Karimojong',
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'Mother Lokol in Moroto: Pastoralist families are preparing for seasonal cattle migration. We urgently request mobile mentor circles so that our older daughters do not drop out of school before final examinations.',
      synced: 1,
    },
    {
      id: 4,
      schoolId: 'SCH-TZ-DDM-07',
      country: 'Tanzania',
      timestamp: '2026-08-28T09:30:00Z',
      durationSeconds: 11,
      language: 'Swahili',
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Mwakilishi wa Wazazi Kondoa: Usambazaji wa vifaa vya usafi na taulo za kike umepunguza utoro kwa asilimia themanini. Wasichana waliokuwa wakikaa nyumbani siku nne kwa mwezi sasa wanahudhuria darasani kila siku.',
      synced: 1,
    },
    {
      id: 5,
      schoolId: 'SCH-KE-KLF-03',
      country: 'Kenya',
      timestamp: '2026-08-27T14:15:00Z',
      durationSeconds: 12,
      language: 'Swahili',
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'Afisa wa Kulinda Watoto Joyce huko Ganze: Tumeingilia kati kuzuia ndoa ya mapema kwa wanafunzi wawili wa Darasa la Nane. Chifu na wazee wa kijiji wameweka makubaliano rasmi ya kuhakikisha wasichana wanamaliza masomo.',
      synced: 1,
    },
    {
      id: 6,
      schoolId: 'SCH-UG-WNL-06',
      country: 'Uganda',
      timestamp: '2026-08-26T16:00:00Z',
      durationSeconds: 11,
      language: 'English',
      category: 'general',
      status: 'reviewed',
      transcriptSummary: 'Head Teacher Grace at Rhino Camp: The solar study lamps and evening remedial peer circles have enabled forty-five girls in candidate classes to study safely after sunset without household disruptions.',
      synced: 1,
    },
    {
      id: 7,
      schoolId: 'SCH-TZ-SHY-08',
      country: 'Tanzania',
      timestamp: '2026-08-25T10:45:00Z',
      durationSeconds: 10,
      language: 'Swahili',
      category: 'infrastructure_barrier',
      status: 'reviewed',
      transcriptSummary: 'Mlezi Maria huko Shinyanga: Vikundi vya kutembea pamoja kwa usalama vimewasindikiza wasichana ishirini na wanne shuleni bila hofu yoyote ya usalama kwenye njia ndefu za vijijini.',
      synced: 1,
    },
    {
      id: 8,
      schoolId: 'SCH-KE-GRS-04',
      country: 'Kenya',
      timestamp: '2026-08-24T08:10:00Z',
      durationSeconds: 12,
      language: 'Somali',
      category: 'general',
      status: 'reviewed',
      transcriptSummary: 'Elder Abdi in Dadaab: Barnaamijka quraacda dugsiga iyo buugaagta cusub waxay si weyn u caawiyeen in gabdhaha fasalka lixaad iyo toddobaad ay si buuxda ugu soo xaadiraan casharada subaxii.',
      synced: 1,
    },
  ]

  await db.voiceFeedback.bulkPut(voiceNotes)
  console.log('Project S.A.F.E. Enterprise Dataset with authentic multi-lingual transcripts loaded.')
}
