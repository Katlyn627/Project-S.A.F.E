import Dexie, { type EntityTable } from 'dexie'

export type StudentStatus = 'active' | 'at-risk' | 'remediated' | 'transferred'
export type AlertStatus = 'open' | 'investigating' | 'resolved'
export type LanguageCode =
  | 'Swahili'
  | 'English'
  | 'French'
  | 'Arabic'
  | 'Somali'
  | 'Maa'
  | 'Karimojong'
  | 'Hausa'
  | 'Urdu'
  | 'Dari'
  | 'Portuguese'
  | 'Nepali'
  | 'Oromo'
  | 'Luganda'

export interface Student {
  uid: string // e.g. 'SAFE-SSD-JUB-0601' - Encrypted / Pseudonymized Unique Identifier (Zero Plaintext PII)
  schoolId: string // e.g. 'SCH-SSD-01'
  country: string // e.g. 'South Sudan', 'Chad', 'Mali', 'Niger', 'Kenya', etc.
  countryFlag?: string // e.g. '🇸🇸', '🇹🇩', '🇲🇱', etc.
  districtName?: string // e.g. 'Upper Nile', 'Kanem Region', 'Turkana West'
  gradeLevel: number // 6, 7, 8
  status: StudentStatus
  riskFactor?: string // e.g. 'Child Marriage (ECM) Pressure', 'WASH / Period Poverty', 'Flood Barrier', etc.
  assignedMentor?: string // e.g. 'MENTOR-ACHOL-SSD'
  createdAt?: string
}

export interface Attendance {
  id?: number
  studentUid: string
  date: string // 'YYYY-MM-DD'
  present: boolean
  unexcused: boolean
  category?: string // 'mhm_wash' | 'climate_flood' | 'commute_distance' | 'domestic_labour' | 'illness' | 'routine' | 'child_marriage' | 'displacement'
  notes?: string
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
}

export interface Alert {
  id?: number
  studentUid: string
  schoolId?: string
  country?: string
  countryFlag?: string
  triggeredDate: string // 'YYYY-MM-DD'
  consecutiveAbsences: number
  status: AlertStatus
  rootCause?: string
  assignedMentor?: string
  interventionNotes?: string
  interventionType?: 'dignity_kit' | 'walking_bus' | 'home_visit' | 'feeding_program' | 'remedial_tutoring' | 'borehole_water' | 'safe_corridor'
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
  resolvedAt?: string
}

export interface VoiceFeedback {
  id?: number
  schoolId: string
  country?: string
  countryFlag?: string
  timestamp: string // ISO 8601
  audioBlob?: Blob
  durationSeconds?: number
  transcriptSummary?: string
  language?: LanguageCode
  category?: 'infrastructure_barrier' | 'safeguarding_concern' | 'health_mhm' | 'general' | 'displacement'
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

    this.version(5).stores({
      students: '&uid, schoolId, country, gradeLevel, status, riskFactor',
      attendance: '++id, studentUid, date, present, unexcused, category, synced, [studentUid+date]',
      alerts: '++id, studentUid, schoolId, country, triggeredDate, consecutiveAbsences, status, synced',
      voiceFeedback: '++id, schoolId, country, timestamp, category, status, synced',
    })
  }
}

export const db = new SafeDatabase()
