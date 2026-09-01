import { db, type Student, type Attendance, type Alert, type VoiceFeedback, type LanguageCode } from './schema'

export interface SchoolMeta {
  id: string
  name: string
  country: string
  countryFlag: string
  district: string
  outOfSchoolRate: number // UNESCO UIS estimated female out-of-school rate
  primaryBarrier: string
  mentor: string
  prefix: string
}

export const TOP_25_COUNTRIES_REGISTRY: SchoolMeta[] = [
  { id: 'SCH-SSD-01', name: 'Malakal Peace Model Academy', country: 'South Sudan', countryFlag: '🇸🇸', district: 'Upper Nile State', outOfSchoolRate: 76, primaryBarrier: 'Protracted Conflict & Displacement', mentor: 'MENTOR-ACHOL-SSD', prefix: 'SSD-MAL' },
  { id: 'SCH-TCD-02', name: 'Kanem Girls Foundational Institute', country: 'Chad', countryFlag: '🇹🇩', district: 'Kanem Region', outOfSchoolRate: 71, primaryBarrier: 'Severe Drought & Early Marriage', mentor: 'MENTOR-FATIME-TCD', prefix: 'TCD-KAN' },
  { id: 'SCH-MLI-03', name: 'Mopti Sahel Community School', country: 'Mali', countryFlag: '🇲🇱', district: 'Mopti Region', outOfSchoolRate: 68, primaryBarrier: 'Sahel Insecurity & WASH Deficits', mentor: 'MENTOR-KADIATOU-MLI', prefix: 'MLI-MOP' },
  { id: 'SCH-NER-04', name: 'Maradi Girls Protection Academy', country: 'Niger', countryFlag: '🇳🇪', district: 'Maradi Region', outOfSchoolRate: 67, primaryBarrier: 'Early Child Marriage (ECM 76%)', mentor: 'MENTOR-AISHA-NER', prefix: 'NER-MAR' },
  { id: 'SCH-CAF-05', name: 'Bangui Community Resilience School', country: 'Central African Republic', countryFlag: '🇨🇫', district: 'Bangui / Ombella', outOfSchoolRate: 65, primaryBarrier: 'Lack of Safe Infrastructure', mentor: 'MENTOR-SOLANGE-CAF', prefix: 'CAF-BAN' },
  { id: 'SCH-SOM-06', name: 'Baidoa Hope Foundational Academy', country: 'Somalia', countryFlag: '🇸🇴', district: 'Bay Region', outOfSchoolRate: 64, primaryBarrier: 'Drought Displacement & Herding', mentor: 'MENTOR-FADUMO-SOM', prefix: 'SOM-BAI' },
  { id: 'SCH-AFG-07', name: 'Kabul Community Learning Circle', country: 'Afghanistan', countryFlag: '🇦🇫', district: 'Kabul Province', outOfSchoolRate: 62, primaryBarrier: 'Secondary Education Bans', mentor: 'MENTOR-ZAHRA-AFG', prefix: 'AFG-KAB' },
  { id: 'SCH-NGA-08', name: 'Maiduguri Safe Space Model', country: 'Nigeria', countryFlag: '🇳🇬', district: 'Borno State', outOfSchoolRate: 58, primaryBarrier: 'North-East Conflict & Poverty', mentor: 'MENTOR-HAUWA-NGA', prefix: 'NGA-MAI' },
  { id: 'SCH-COD-09', name: 'Goma Great Lakes Academy', country: 'DR Congo', countryFlag: '🇨🇩', district: 'North Kivu', outOfSchoolRate: 55, primaryBarrier: 'Militia Transit & Displacement', mentor: 'MENTOR-ESPERANCE-COD', prefix: 'COD-GOM' },
  { id: 'SCH-ETH-10', name: 'Jigjiga Pastoralist Girls School', country: 'Ethiopia', countryFlag: '🇪🇹', district: 'Somali Region', outOfSchoolRate: 54, primaryBarrier: '12km Water Fetching Burden', mentor: 'MENTOR-RAHEL-ETH', prefix: 'ETH-JIG' },
  { id: 'SCH-GIN-11', name: 'Kankan Girls Model Institute', country: 'Guinea', countryFlag: '🇬🇳', district: 'Kankan Region', outOfSchoolRate: 53, primaryBarrier: 'Transition Exam Dropout', mentor: 'MENTOR-MARIAMA-GIN', prefix: 'GIN-KAN' },
  { id: 'SCH-BFA-12', name: 'Kaya Sahel Girls Center', country: 'Burkina Faso', countryFlag: '🇧🇫', district: 'Centre-Nord', outOfSchoolRate: 52, primaryBarrier: 'Forced School Closures', mentor: 'MENTOR-SAWADOGO-BFA', prefix: 'BFA-KAY' },
  { id: 'SCH-YEM-13', name: 'Hodeidah Red Sea Model Academy', country: 'Yemen', countryFlag: '🇾🇪', district: 'Hodeidah Governorate', outOfSchoolRate: 51, primaryBarrier: 'Economic Collapse & Safety', mentor: 'MENTOR-AMAL-YEM', prefix: 'YEM-HOD' },
  { id: 'SCH-PAK-14', name: 'Quetta Rural Girls Academy', country: 'Pakistan', countryFlag: '🇵🇰', district: 'Balochistan', outOfSchoolRate: 50, primaryBarrier: 'Extreme Distance & Gender Norms', mentor: 'MENTOR-GUL-PAK', prefix: 'PAK-QUE' },
  { id: 'SCH-SDN-15', name: 'El Fasher Peace Primary', country: 'Sudan', countryFlag: '🇸🇩', district: 'North Darfur', outOfSchoolRate: 49, primaryBarrier: 'Conflict Disruption & Famine', mentor: 'MENTOR-HINDA-SDN', prefix: 'SDN-FAS' },
  { id: 'SCH-MOZ-16', name: 'Pemba Coastal Resilience Center', country: 'Mozambique', countryFlag: '🇲🇿', district: 'Cabo Delgado', outOfSchoolRate: 48, primaryBarrier: 'Cyclones & Early Marriage', mentor: 'MENTOR-ANACELIA-MOZ', prefix: 'MOZ-PEM' },
  { id: 'SCH-MDG-17', name: 'Ambovombe Southern Drought Academy', country: 'Madagascar', countryFlag: '🇲🇬', district: 'Androy Region', outOfSchoolRate: 47, primaryBarrier: 'Climate Hunger & Domestic Work', mentor: 'MENTOR-HASINA-MDG', prefix: 'MDG-AMB' },
  { id: 'SCH-LBR-18', name: 'Sanniquellie Rural Primary', country: 'Liberia', countryFlag: '🇱🇷', district: 'Nimba County', outOfSchoolRate: 46, primaryBarrier: 'Road Inaccessibility & Fees', mentor: 'MENTOR-BLESSING-LBR', prefix: 'LBR-SAN' },
  { id: 'SCH-SLE-19', name: 'Kabala Girls Foundational', country: 'Sierra Leone', countryFlag: '🇸🇱', district: 'Koinadugu District', outOfSchoolRate: 45, primaryBarrier: 'MHM Period Poverty', mentor: 'MENTOR-ISATA-SLE', prefix: 'SLE-KAB' },
  { id: 'SCH-KEN-20', name: 'Kakuma Peace Model Primary', country: 'Kenya', countryFlag: '🇰🇪', district: 'Turkana County', outOfSchoolRate: 42, primaryBarrier: 'Arid ASAL Drought & Commute', mentor: 'MENTOR-AMINA-TRK', prefix: 'KEN-TRK' },
  { id: 'SCH-UGA-21', name: 'Moroto Pastoralist Girls Academy', country: 'Uganda', countryFlag: '🇺🇬', district: 'Karamoja Region', outOfSchoolRate: 41, primaryBarrier: 'Agro-Pastoral Migration', mentor: 'MENTOR-ESTHER-KRM', prefix: 'UGA-KRM' },
  { id: 'SCH-TZA-22', name: 'Shinyanga Rural Girls Model', country: 'Tanzania', countryFlag: '🇹🇿', district: 'Shinyanga Region', outOfSchoolRate: 39, primaryBarrier: 'Early Marriage & Mining Belts', mentor: 'MENTOR-MARIA-SHY', prefix: 'TZA-SHY' },
  { id: 'SCH-MWI-23', name: 'Nsanje Shire River Academy', country: 'Malawi', countryFlag: '🇲🇼', district: 'Nsanje District', outOfSchoolRate: 38, primaryBarrier: 'Seasonal Flash Flooding', mentor: 'MENTOR-CHIFUNDO-MWI', prefix: 'MWI-NSJ' },
  { id: 'SCH-SEN-24', name: 'Kolda Southern Girls Academy', country: 'Senegal', countryFlag: '🇸🇳', district: 'Kolda Region', outOfSchoolRate: 37, primaryBarrier: 'Rural Distance & Agriculture', mentor: 'MENTOR-AMINATA-SEN', prefix: 'SEN-KOL' },
  { id: 'SCH-NPL-25', name: 'Jumla Himalayan Model School', country: 'Nepal', countryFlag: '🇳🇵', district: 'Karnali Province', outOfSchoolRate: 35, primaryBarrier: 'Extreme Mountain Commutes', mentor: 'MENTOR-SUNITA-NPL', prefix: 'NPL-JUM' },
]

export const SCHOOL_REGISTRY = TOP_25_COUNTRIES_REGISTRY

const RISK_FACTOR_POOL = [
  'MHM / Period Poverty & WASH Deficit',
  'Seasonal Flash Flood / River Crossing Barrier',
  'Severe Drought / 10-14km Water Fetching',
  'Long Distance Commute (>8km Mountain/Desert)',
  'Early Child Marriage (ECM) Pressure',
  'Domestic Labour & Sibling Caregiving',
  'Primary-to-Secondary Transition Barrier',
  'Pastoralist / Conflict Displacement Transit',
]

export const seedMockData = async (force: boolean = false) => {
  const count = await db.students.count()
  const shouldReSeed = force || count < 350
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

  // 1. Generate 18 Students per School across all 25 Countries (Total: 450 Beneficiary Profiles)
  TOP_25_COUNTRIES_REGISTRY.forEach((school) => {
    const grades = [6, 7, 8]

    grades.forEach((gradeLevel) => {
      // 6 students per grade = 18 per country
      for (let i = 1; i <= 6; i++) {
        const studentNumber = (gradeLevel * 100 + i).toString().padStart(4, '0')
        const uid = `SAFE-${school.prefix}-${studentNumber}`
        const riskFactor = RISK_FACTOR_POOL[(i + gradeLevel + school.outOfSchoolRate) % RISK_FACTOR_POOL.length]

        let status: Student['status'] = 'active'
        if (i === 3) status = 'at-risk'
        if (i === 5) status = 'remediated'

        students.push({
          uid,
          schoolId: school.id,
          country: school.country,
          countryFlag: school.countryFlag,
          districtName: school.district,
          gradeLevel,
          status,
          riskFactor,
          assignedMentor: school.mentor,
          createdAt: '2026-08-01T08:00:00Z',
        })

        // Generate Multi-Day Attendance Logs
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
                : riskFactor.includes('Marriage')
                ? 'child_marriage'
                : riskFactor.includes('MHM')
                ? 'mhm_wash'
                : 'domestic_labour'
              notes = `Unexcused streak: ${riskFactor}`
            }
          } else if (i === 5) {
            if (dateIdx >= 5 && dateIdx <= 7) {
              present = false
              unexcused = true
              category = 'commute_distance'
              notes = 'Historical absence (Prior to Project SAFE intervention)'
            } else {
              present = true
              unexcused = false
              category = 'routine'
              notes = 'Present (Remediated post-casework intervention)'
            }
          } else {
            const isSingleExcused = (i * 3 + dateIdx) % 12 === 0
            if (isSingleExcused) {
              present = false
              unexcused = false
              category = 'illness'
              notes = 'Excused medical clinic recovery note'
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

        // Generate Casework Alerts
        if (i === 3) {
          alerts.push({
            id: alertCounter++,
            studentUid: uid,
            schoolId: school.id,
            country: school.country,
            countryFlag: school.countryFlag,
            triggeredDate: '2026-08-31',
            consecutiveAbsences: 4,
            status: 'open',
            rootCause: riskFactor,
            assignedMentor: school.mentor,
            interventionType: riskFactor.includes('Flood')
              ? 'walking_bus'
              : riskFactor.includes('MHM')
              ? 'dignity_kit'
              : 'home_visit',
            interventionNotes: `CRITICAL ALERT (<72h Target): 4 consecutive unexcused absences in ${school.district}, ${school.country}. Vulnerability: ${riskFactor}. Immediate caseworker dispatch required.`,
            synced: 1,
            createdAt: '2026-08-31T07:30:00Z',
          })
        } else if (i === 5) {
          alerts.push({
            id: alertCounter++,
            studentUid: uid,
            schoolId: school.id,
            country: school.country,
            countryFlag: school.countryFlag,
            triggeredDate: '2026-08-18',
            consecutiveAbsences: 3,
            status: 'resolved',
            rootCause: riskFactor,
            assignedMentor: school.mentor,
            interventionType: 'walking_bus',
            interventionNotes: `CASEWORK REMEDIATED: Completed mentor triage in ${school.district}, ${school.country}. Enrolled student in verified peer walking group and provided dignity supplies. Student achieved 100% attendance over subsequent 8 days.`,
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

  // 2. Seed 12 Multi-Lingual Community Voice Feedback Reports covering Global Dialects
  const voiceNotes: VoiceFeedback[] = [
    {
      id: 1,
      schoolId: 'SCH-SSD-01',
      country: 'South Sudan',
      countryFlag: '🇸🇸',
      timestamp: '2026-08-31T06:45:00Z',
      durationSeconds: 14,
      language: 'English',
      category: 'displacement',
      status: 'escalated',
      transcriptSummary: 'Community Elder Achol in Malakal, South Sudan: Recent rainy season flooding on the Nile river basin has submerged three footbridges. Over thirty girls in upper primary cannot reach the school safely without canoe transport escorts.',
      synced: 1,
    },
    {
      id: 2,
      schoolId: 'SCH-TCD-02',
      country: 'Chad',
      countryFlag: '🇹🇩',
      timestamp: '2026-08-30T15:20:00Z',
      durationSeconds: 13,
      language: 'French',
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Mentore Fatimé à Kanem, Tchad: La distribution de kits de dignité et de serviettes réutilisables a permis à quarante filles de poursuivre leurs études sans interruption mensuelle pendant les cours de sciences.',
      synced: 1,
    },
    {
      id: 3,
      schoolId: 'SCH-NER-04',
      country: 'Niger',
      countryFlag: '🇳🇪',
      timestamp: '2026-08-29T11:10:00Z',
      durationSeconds: 15,
      language: 'Hausa',
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'Malama Aisha a Maradi, Nijar: Mun gudanar da tattaunawa tare da shugabannin al\'umma domin dakatar da auren wuri ga \'yan mata biyar na aji takwas. Iyaye sun amince su bar su su kammala jarrabawar karshe.',
      synced: 1,
    },
    {
      id: 4,
      schoolId: 'SCH-SOM-06',
      country: 'Somalia',
      countryFlag: '🇸🇴',
      timestamp: '2026-08-28T09:30:00Z',
      durationSeconds: 12,
      language: 'Somali',
      category: 'safeguarding_concern',
      status: 'reviewed',
      transcriptSummary: 'Hooyo Fadumo oo ku sugan Baydhabo: Qoysaska xoolo-dhaqatada ah ee abaaruhu saameeyeen waxay u baahan yihiin goobo waxbarasho oo wareega si gabdhuhu aysan uga tagin dugsiga inta lagu jiro guuritaanka.',
      synced: 1,
    },
    {
      id: 5,
      schoolId: 'SCH-KEN-20',
      country: 'Kenya',
      countryFlag: '🇰🇪',
      timestamp: '2026-08-27T14:15:00Z',
      durationSeconds: 13,
      language: 'Swahili',
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Mlezi Amina huko Kakuma, Kenya: Mradi wa SAFE umesaidia kupunguza utoro kwa asilimia themanini na tano kwa kutoa taulo za kike na kuboresha vyoo vya faragha shuleni.',
      synced: 1,
    },
    {
      id: 6,
      schoolId: 'SCH-UGA-21',
      country: 'Uganda',
      countryFlag: '🇺🇬',
      timestamp: '2026-08-26T16:00:00Z',
      durationSeconds: 12,
      language: 'Karimojong',
      category: 'general',
      status: 'reviewed',
      transcriptSummary: 'Mother Lokol in Moroto, Uganda: The evening solar study circles have allowed fifty adolescent girls to study safely after sunset without being burdened by household chores in the kraals.',
      synced: 1,
    },
    {
      id: 7,
      schoolId: 'SCH-TZA-22',
      country: 'Tanzania',
      countryFlag: '🇹🇿',
      timestamp: '2026-08-25T10:45:00Z',
      durationSeconds: 11,
      language: 'Swahili',
      category: 'infrastructure_barrier',
      status: 'reviewed',
      transcriptSummary: 'Afisa Maria huko Shinyanga, Tanzania: Vikundi vya kutembea pamoja vimewezesha wasichana wadogo kuvuka maeneo ya machimbo kwa usalama mkubwa asubuhi na jioni.',
      synced: 1,
    },
    {
      id: 8,
      schoolId: 'SCH-AFG-07',
      country: 'Afghanistan',
      countryFlag: '🇦🇫',
      timestamp: '2026-08-24T08:10:00Z',
      durationSeconds: 14,
      language: 'Dari',
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'Zahra from Kabul Community Circle: Underground home literacy circles for forty adolescent girls continue to operate with peer learning materials and foundational math instruction.',
      synced: 1,
    },
    {
      id: 9,
      schoolId: 'SCH-PAK-14',
      country: 'Pakistan',
      countryFlag: '🇵🇰',
      timestamp: '2026-08-23T12:00:00Z',
      durationSeconds: 13,
      language: 'Urdu',
      category: 'infrastructure_barrier',
      status: 'reviewed',
      transcriptSummary: 'Ustadha Gul in Quetta, Pakistan: Doorstep mentor escorts and community transport support have increased female attendance in Grade 6 and 7 by over forty percent this term.',
      synced: 1,
    },
    {
      id: 10,
      schoolId: 'SCH-MOZ-16',
      country: 'Mozambique',
      countryFlag: '🇲🇿',
      timestamp: '2026-08-22T09:15:00Z',
      durationSeconds: 12,
      language: 'Portuguese',
      category: 'health_mhm',
      status: 'reviewed',
      transcriptSummary: 'Mentora Anacélia em Pemba, Moçambique: Os kits de higiene e apoio psicossocial permitiram que alunas deslocadas pelo ciclone regressassem às aulas com total regularidade.',
      synced: 1,
    },
    {
      id: 11,
      schoolId: 'SCH-NPL-25',
      country: 'Nepal',
      countryFlag: '🇳🇵',
      timestamp: '2026-08-21T14:30:00Z',
      durationSeconds: 13,
      language: 'Nepali',
      category: 'infrastructure_barrier',
      status: 'reviewed',
      transcriptSummary: 'Sunita in Jumla, Karnali Nepal: Mountain trail safety groups have helped thirty-five girls navigate steep landslide paths during monsoons to attend primary school.',
      synced: 1,
    },
    {
      id: 12,
      schoolId: 'SCH-YEM-13',
      country: 'Yemen',
      countryFlag: '🇾🇪',
      timestamp: '2026-08-20T11:00:00Z',
      durationSeconds: 14,
      language: 'Arabic',
      category: 'safeguarding_concern',
      status: 'escalated',
      transcriptSummary: 'Amal in Hodeidah, Yemen: Emergency school meals and solar lamps have provided critical stability for adolescent girls facing extreme family displacement and food insecurity.',
      synced: 1,
    },
  ]

  await db.voiceFeedback.bulkPut(voiceNotes)
  console.log(
    `Project S.A.F.E. Top 25 Global Countries Dataset Loaded: ${students.length} students across 25 countries, ${attendanceRecords.length} attendance records, ${alerts.length} casework alerts, and ${voiceNotes.length} multi-lingual voice notes.`
  )
}
