import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { initDatabase } from './db.js'
import syncRoutes from './routes/sync.js'
import telemetryRoutes from './routes/telemetry.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Static audio files directory
app.use('/uploads', express.static(path.resolve('uploads')))

// API Routes
app.use('/api/v1/sync', syncRoutes)
app.use('/api/v1/telemetry', telemetryRoutes)

// Root API Welcome & Overview
app.get('/', (_req, res) => {
  res.json({
    project: 'Project S.A.F.E. (School Attendance & Foundational Empowerment)',
    role: 'Central Aggregation & Telemetry API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      telemetryStats: '/api/v1/telemetry/stats',
      syncBatch: 'POST /api/v1/sync/batch',
      syncVoice: 'POST /api/v1/sync/voice',
    },
    documentation: 'https://github.com/Katlyn627/Project-S.A.F.E',
    timestamp: new Date().toISOString(),
  })
})

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Project S.A.F.E. Aggregation Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Start server
app.listen(PORT, async () => {
  console.log(`Project S.A.F.E. Ingestion API listening on port ${PORT}`)
  await initDatabase()
})
