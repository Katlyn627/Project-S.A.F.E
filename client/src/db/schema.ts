import Dexie, { type EntityTable } from 'dexie'

export type StudentStatus = 'active' | 'at-risk' | 'remediated' | 'transferred'
export type AlertStatus = 'open' | 'investigating' | 'resolved'

export interface Student {
  uid: string // e.g. 'SAFE-KE-0012' - Encrypted / Pseudonymized Unique Identifier (Zero Plaintext PII)
  schoolId: string // e.g. 'SCH-NAROK-01'
  gradeLevel: number // e.g. 7 or 8
  status: StudentStatus
  riskFactor?: string // e.g. 'MHM / Period Poverty', 'Flood / River Crossing Barrier', 'Long Commute (>8km)'
  assignedMentor?: string // e.g. 'MENTOR-FAITH-04'
  createdAt?: string
}

export interface Attendance {
  id?: number
  studentUid: string
  date: string // 'YYYY-MM-DD'
  present: boolean
  unexcused: boolean
  category?: string // 'mhm_wash' | 'climate_flood' | 'commute_distance' | 'domestic_labour' | 'illness' | 'unknown'
  notes?: string
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
}

export interface Alert {
  id?: number
  studentUid: string
  schoolId?: string
  triggeredDate: string // 'YYYY-MM-DD'
  consecutiveAbsences: number
  status: AlertStatus
  rootCause?: string // e.g. 'Flash Flood / River Crossing Barrier'
  assignedMentor?: string
  interventionNotes?: string
  interventionType?: 'dignity_kit' | 'walking_bus' | 'home_visit' | 'feeding_program' | 'remedial_tutoring'
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
  resolvedAt?: string
}

export interface VoiceFeedback {
  id?: number
  schoolId: string
  timestamp: string // ISO 8601
  audioBlob?: Blob
  durationSeconds?: number
  transcriptSummary?: string
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

    this.version(3).stores({
      students: '&uid, schoolId, gradeLevel, status, riskFactor',
      attendance: '++id, studentUid, date, present, unexcused, category, synced, [studentUid+date]',
      alerts: '++id, studentUid, schoolId, triggeredDate, consecutiveAbsences, status, synced',
      voiceFeedback: '++id, schoolId, timestamp, category, status, synced',
    })
  }
}

export const db = new SafeDatabase()
