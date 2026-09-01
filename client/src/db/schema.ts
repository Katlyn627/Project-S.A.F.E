import Dexie, { type EntityTable } from 'dexie'

export type AttendanceStatus = 'present' | 'absent'

export interface StudentRecord {
  uidCipher: string
  classCode: string
  gradeLevel: string
  createdAt: string
}

export interface AttendanceRecord {
  id?: number
  uidCipher: string
  classCode: string
  date: string
  status: AttendanceStatus
  isExcused: boolean
  synced: boolean
  createdAt: string
}

export interface RiskFlag {
  id?: number
  uidCipher: string
  reason: string
  createdAt: string
  resolvedAt?: string
}

export interface SyncMutation {
  mutationId: string
  entity: 'attendance' | 'risk_flag' | 'voice_note'
  entityId: string
  operation: 'upsert' | 'delete'
  payloadCipher: string
  createdAt: string
  attempts: number
  lastAttemptAt?: string
}

export interface VoiceNote {
  noteId: string
  uidCipher: string
  audioBlob: Blob
  mimeType: string
  durationMs: number
  synced: boolean
  createdAt: string
}

class SafeDexieDatabase extends Dexie {
  students!: EntityTable<StudentRecord, 'uidCipher'>
  attendance!: EntityTable<AttendanceRecord, 'id'>
  riskFlags!: EntityTable<RiskFlag, 'id'>
  syncQueue!: EntityTable<SyncMutation, 'mutationId'>
  voiceNotes!: EntityTable<VoiceNote, 'noteId'>

  constructor() {
    super('safe-offline-db')

    this.version(1).stores({
      students: '&uidCipher, classCode, gradeLevel, createdAt',
      attendance: '++id, uidCipher, classCode, date, status, isExcused, synced, createdAt',
      riskFlags: '++id, uidCipher, createdAt, resolvedAt',
      syncQueue: '&mutationId, entity, entityId, operation, createdAt, attempts',
      voiceNotes: '&noteId, uidCipher, createdAt, synced',
    })
  }
}

export const db = new SafeDexieDatabase()
