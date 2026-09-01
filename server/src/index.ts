import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initDatabase } from './db.js'
import syncRoutes from './routes/sync.js'
import telemetryRoutes from './routes/telemetry.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Project S.A.F.E. Unified Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Serve Client PWA (Single Unified Service)
const possibleClientPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'client_dist'),
]

const clientDistPath = possibleClientPaths.find((p) =>
  fs.existsSync(path.join(p, 'index.html'))
)

if (clientDistPath) {
  console.log(`Serving Client PWA from: ${clientDistPath}`)
  app.use(express.static(clientDistPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next()
    }
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
} else {
  console.warn('Client dist directory not found. API only mode.')
  app.get('/', (_req, res) => {
    res.json({
      project: 'Project S.A.F.E.',
      role: 'Central API',
      status: 'online',
      message: 'Run client build to serve UI at root.',
    })
  })
}

// Start server
app.listen(PORT, async () => {
  console.log(`Project S.A.F.E. Unified App listening on port ${PORT}`)
  await initDatabase()
})
