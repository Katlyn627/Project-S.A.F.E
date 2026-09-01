import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://safe_user:safe_secure_password_123@localhost:5432/safe_humanitarian_db',
  max: 10,
  idleTimeoutMillis: 30000,
})

/**
 * Initializes PostgreSQL schema migrations.
 */
export const initDatabase = async () => {
  try {
    const client = await pool.connect()
    console.log('Connected to PostgreSQL successfully.')

    // 1. Students Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        uid VARCHAR(64) PRIMARY KEY,
        school_id VARCHAR(64) NOT NULL,
        grade_level INT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 2. Attendance Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_uid VARCHAR(64) NOT NULL REFERENCES students(uid) ON DELETE CASCADE,
        date DATE NOT NULL,
        present BOOLEAN NOT NULL,
        unexcused BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        client_created_at TIMESTAMP WITH TIME ZONE,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_uid, date)
      );
    `)

    // 3. Alerts Table (Early-Warning Casework)
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        student_uid VARCHAR(64) NOT NULL REFERENCES students(uid) ON DELETE CASCADE,
        triggered_date DATE NOT NULL,
        consecutive_absences INT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'open',
        intervention_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE
      );
    `)

    // 4. Voice Feedback Table (FCRM Audio Reports)
    await client.query(`
      CREATE TABLE IF NOT EXISTS voice_feedback (
        id SERIAL PRIMARY KEY,
        school_id VARCHAR(64) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        audio_filename VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Prepopulate sample students if empty
    const { rows } = await client.query('SELECT COUNT(*) FROM students')
    if (parseInt(rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO students (uid, school_id, grade_level, status) VALUES
        ('SAFE-KE-0012', 'SCH-MARA-01', 7, 'active'),
        ('SAFE-KE-0034', 'SCH-MARA-01', 7, 'active'),
        ('SAFE-KE-0058', 'SCH-MARA-01', 8, 'at-risk'),
        ('SAFE-KE-0071', 'SCH-MARA-01', 8, 'active'),
        ('SAFE-KE-0095', 'SCH-MARA-01', 8, 'active'),
        ('SAFE-KE-0104', 'SCH-RIV-02', 7, 'active'),
        ('SAFE-KE-0128', 'SCH-RIV-02', 7, 'at-risk'),
        ('SAFE-KE-0143', 'SCH-RIV-02', 8, 'active'),
        ('SAFE-KE-0167', 'SCH-RIV-02', 8, 'active'),
        ('SAFE-KE-0189', 'SCH-RIV-02', 8, 'remediated')
        ON CONFLICT DO NOTHING;
      `)
      console.log('Pre-populated central PostgreSQL with baseline student directory.')
    }

    client.release()
  } catch (err: any) {
    console.warn(
      'PostgreSQL connection not available or offline. Operating in resilient memory mode for development.',
      err.message
    )
  }
}

