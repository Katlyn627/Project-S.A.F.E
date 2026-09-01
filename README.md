# Project-S.A.F.E

Project S.A.F.E. (School Attendance & Foundational Empowerment) is an offline-first PWA and M&E retention framework for rural East Africa. It enables community mentors to log attendance offline, detect early dropout indicators within 72 hours, and deploy rapid casework interventions.

## Step 1 implementation (offline-first frontend baseline)

### 1) File tree

```text
Project-S.A.F.E/
├── LICENSE
├── README.md
└── client/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── sw.ts
        ├── components/
        │   └── AttendanceLogger.tsx
        ├── db/
        │   ├── crypto.ts
        │   └── schema.ts
        └── offline/
            ├── risk.ts
            ├── risk.test.ts
            └── syncManager.ts
```

### 2) IndexedDB schema (Dexie)

Implemented in `/home/runner/work/Project-S.A.F.E/Project-S.A.F.E/client/src/db/schema.ts`:

- `students` (`&uidCipher, classCode, gradeLevel, createdAt`)
- `attendance` (`++id, uidCipher, classCode, date, status, isExcused, synced, createdAt`)
- `riskFlags` (`++id, uidCipher, createdAt, resolvedAt`)
- `syncQueue` (`&mutationId, entity, entityId, operation, createdAt, attempts`)
- `voiceNotes` (`&noteId, uidCipher, createdAt, synced`)

PII-safe approach:
- no student names/emails/phone fields are stored in IndexedDB
- UID values are transformed to encrypted alphanumeric ciphers before storage
- sync queue payloads are AES-GCM encrypted in local storage before transmission

### 3) Service Worker + Background Sync

Implemented in:
- `/home/runner/work/Project-S.A.F.E/Project-S.A.F.E/client/vite.config.ts`
- `/home/runner/work/Project-S.A.F.E/Project-S.A.F.E/client/src/sw.ts`
- `/home/runner/work/Project-S.A.F.E/Project-S.A.F.E/client/src/offline/syncManager.ts`

Key behavior:
- Workbox injectManifest service worker strategy
- runtime background sync queue for `POST /api/sync*`
- local Dexie mutation queue flushed when online
- app registers sync tag `safe-sync-mutations`
- cache file-size guard (`maximumFileSizeToCacheInBytes: 1_800_000`) to keep initial cached payload well below 1.8 MB

### 4) React attendance logging component

Implemented in `/home/runner/work/Project-S.A.F.E/Project-S.A.F.E/client/src/components/AttendanceLogger.tsx`:

- class + student-code + date + status capture
- offline-first local writes to Dexie attendance table
- encrypted mutation queue entries for later sync
- local early-warning flag creation when there are more than 3 consecutive unexcused absences
- immediate sync attempt when online; otherwise deferred sync
