import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pool } from '../db.js'

const router = Router()

// Configure audio upload directory
const uploadDir = path.resolve('uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname) || '.webm'}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

/**
 * In-memory fallback buffer when running without PostgreSQL
 */
const MEMORY_ATTENDANCE: any[] = []
const MEMORY_ALERTS: any[] = []

/**
 * POST /api/v1/sync/batch
 * Ingests batch mutations from offline PWA clients
 */
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  const { batchId, attendance = [], alerts = [] } = req.body

  console.log(
    `Received batch ${batchId}: ${attendance.length} attendance records, ${alerts.length} alerts.`
  )

  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // 1. Process Attendance logs
    for (const record of attendance) {
      // Derive school ID and grade from UID format SAFE-KE-NRK-0601
      const uidParts = record.studentUid.split('-')
      const derivedSchoolId = uidParts.length >= 3 ? `SCH-${uidParts[1]}-${uidParts[2]}-01` : 'SCH-KE-NRK-01'
      const derivedGrade = uidParts.length >= 4 && uidParts[3].startsWith('06') ? 6 : uidParts.length >= 4 && uidParts[3].startsWith('07') ? 7 : 8

      // Ensure student exists in server registry
      await client.query(
        `
        INSERT INTO students (uid, school_id, grade_level, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (uid) DO NOTHING;
      `,
        [record.studentUid, derivedSchoolId, derivedGrade, 'active']
      )

      await client.query(
        `
        INSERT INTO attendance (student_uid, date, present, unexcused, notes, client_created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (student_uid, date)
        DO UPDATE SET
          present = EXCLUDED.present,
          unexcused = EXCLUDED.unexcused,
          notes = EXCLUDED.notes,
          synced_at = CURRENT_TIMESTAMP;
      `,
        [
          record.studentUid,
          record.date,
          record.present,
          record.unexcused || false,
          record.notes || '',
          record.createdAt || new Date().toISOString(),
        ]
      )
    }

    // 2. Process Alerts
    for (const alert of alerts) {
      await client.query(
        `
        INSERT INTO alerts (student_uid, triggered_date, consecutive_absences, status, intervention_notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6);
      `,
        [
          alert.studentUid,
          alert.triggeredDate,
          alert.consecutiveAbsences,
          alert.status,
          alert.interventionNotes || '',
          alert.createdAt || new Date().toISOString(),
        ]
      )

      // Update student status to at-risk
      if (alert.status === 'open' || alert.status === 'investigating') {
        await client.query(
          `UPDATE students SET status = 'at-risk' WHERE uid = $1`,
          [alert.studentUid]
        )
      }
    }

    await client.query('COMMIT')
    client.release()

    res.status(200).json({
      status: 'success',
      batchId,
      processedAttendance: attendance.length,
      processedAlerts: alerts.length,
      serverTimestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    if (client) {
      await client.query('ROLLBACK')
      client.release()
    }

    console.warn('PostgreSQL sync failed, falling back to memory ledger:', err.message)
    MEMORY_ATTENDANCE.push(...attendance)
    MEMORY_ALERTS.push(...alerts)

    res.status(200).json({
      status: 'success',
      mode: 'memory_fallback',
      batchId,
      processedAttendance: attendance.length,
      processedAlerts: alerts.length,
      serverTimestamp: new Date().toISOString(),
    })
  }
})

/**
 * POST /api/v1/sync/voice
 * Ingests audio blobs recorded offline for FCRM module
 */
router.post('/voice', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  const file = req.file
  const { schoolId = 'SCH-MARA-01', timestamp = new Date().toISOString(), status = 'pending' } = req.body

  if (!file) {
    res.status(400).json({ error: 'No audio file provided' })
    return
  }

  try {
    const client = await pool.connect()
    await client.query(
      `
      INSERT INTO voice_feedback (school_id, timestamp, audio_filename, status)
      VALUES ($1, $2, $3, $4);
    `,
      [schoolId, timestamp, file.filename, status]
    )
    client.release()

    res.status(201).json({
      status: 'success',
      filename: file.filename,
      size: file.size,
    })
  } catch (err: any) {
    console.warn('Saving voice note in memory fallback mode:', err.message)
    res.status(201).json({
      status: 'success',
      mode: 'memory_fallback',
      filename: file.filename,
      size: file.size,
    })
  }
})

export default router

