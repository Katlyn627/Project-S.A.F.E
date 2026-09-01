import Dexie, { type EntityTable } from 'dexie'

export type StudentStatus = 'active' | 'at-risk' | 'remediated' | 'transferred'
export type AlertStatus = 'open' | 'investigating' | 'resolved'

export interface Student {
  uid: string // e.g. 'SAFE-KE-0012' - Encrypted / Pseudonymized Unique Identifier (Zero Plaintext PII)
  schoolId: string // e.g. 'SCH-MARA-01'
  gradeLevel: number // e.g. 7 or 8
  status: StudentStatus
  createdAt?: string
}

export interface Attendance {
  id?: number
  studentUid: string
  date: string // 'YYYY-MM-DD'
  present: boolean
  unexcused: boolean
  notes?: string
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
}

export interface Alert {
  id?: number
  studentUid: string
  triggeredDate: string // 'YYYY-MM-DD'
  consecutiveAbsences: number
  status: AlertStatus
  interventionNotes?: string
  synced: number // 0 = pending sync, 1 = synced
  createdAt?: string
  resolvedAt?: string
}

export interface VoiceFeedback {
  id?: number
  schoolId: string
  timestamp: string // ISO 8601
  audioBlob: Blob
  durationSeconds?: number
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

    this.version(2).stores({
      students: '&uid, schoolId, gradeLevel, status',
      attendance: '++id, studentUid, date, present, unexcused, synced, [studentUid+date]',
      alerts: '++id, studentUid, triggeredDate, consecutiveAbsences, status, synced',
      voiceFeedback: '++id, schoolId, timestamp, status, synced',
    })
  }
}

export const db = new SafeDatabase()
