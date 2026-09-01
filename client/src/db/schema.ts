import Dexie, { type EntityTable } from 'dexie'

export type StudentStatus = 'active' | 'at-risk' | 'remediated' | 'transferred'
export type AlertStatus = 'open' | 'investigating' | 'resolved'
export type CountryCode = 'Kenya' | 'Uganda' | 'Tanzania'

export interface Student {
  uid: string // e.g. 'SAFE-KE-NRK-0101' - Encrypted / Pseudonymized Unique Identifier (Zero Plaintext PII)
  schoolId: string // e.g. 'SCH-KE-NRK-01'
  country: CountryCode
  districtName?: string // e.g. 'Narok County', 'Karamoja Region', 'Dodoma Region'
  gradeLevel: number // 6, 7, 8
  status: StudentStatus
  riskFactor?: string // e.g. 'MHM / Period Poverty', 'Flood / River Crossing Barrier', 'Long Commute (>8km)', etc.
  assignedMentor?: string // e.g. 'MENTOR-FAITH-01'
  createdAt?: string
}

export interface Attendance {
  id?: number
  studentUid: string
  date: string // 'YYYY-MM-DD'
  present: boolean
  unexcused: boolean
  category?: string // 'mhm_wash' | 'climate_flood' | 'commute_distance' | 'domestic_labour' | 'illness' | 'routine' | 'market_day'
  notes?: string
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
}

export interface Alert {
  id?: number
  studentUid: string
  schoolId?: string
  country?: CountryCode
  triggeredDate: string // 'YYYY-MM-DD'
  consecutiveAbsences: number
  status: AlertStatus
  rootCause?: string
  assignedMentor?: string
  interventionNotes?: string
  interventionType?: 'dignity_kit' | 'walking_bus' | 'home_visit' | 'feeding_program' | 'remedial_tutoring' | 'borehole_water'
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
  resolvedAt?: string
}

export interface VoiceFeedback {
  id?: number
  schoolId: string
  country?: CountryCode
  timestamp: string // ISO 8601
  audioBlob?: Blob
  durationSeconds?: number
  transcriptSummary?: string
  language?: 'Swahili' | 'English' | 'Maa' | 'Karimojong' | 'Somali'
  category?: 'infrastructure_barrier' | 'safeguarding_concern' | 'health_mhm' | 'general'
  status: 'pending' | 'reviewed' | 'escalated'
  synced: number // 0 = pending sync, 1 = synced
}

export class SafeDatabase extends Dexie {
  students!: EntityTable<Student, 'uid'>
  attendance!: EntityTable<Attendance, 'id'>
  alerts!: EntityTable<Alert, 'id'>
  voiceFeedback!: EntityTable<VoiceFeedback, 'id'>

  constructor() {
    super('safe-offline-db')

    this.version(4).stores({
      students: '&uid, schoolId, country, gradeLevel, status, riskFactor',
      attendance: '++id, studentUid, date, present, unexcused, category, synced, [studentUid+date]',
      alerts: '++id, studentUid, schoolId, country, triggeredDate, consecutiveAbsences, status, synced',
      voiceFeedback: '++id, schoolId, country, timestamp, category, status, synced',
    })
  }
}

export const db = new SafeDatabase()
