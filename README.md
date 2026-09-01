# Project S.A.F.E. (School Attendance & Foundational Empowerment)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://project-safe-server.onrender.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-38BDF8?style=for-the-badge&logo=pwa&logoColor=white)](https://project-safe-server.onrender.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **An offline-first Progressive Web Application (PWA) and M&E tracking platform designed for rural East African schools operating in low-bandwidth (2G/EDGE) environments to prevent adolescent female school dropout.**

🔗 **Live Deployment:** [https://project-safe-server.onrender.com/](https://project-safe-server.onrender.com/)

---

## 📌 Executive Summary & Humanitarian Context

In rural East Africa, adolescent girls experience a **42% higher dropout rate** than their male peers due to long commutes, early marriage pressures, economic insecurity, and climate-induced disruptions. Standard paper-based monitoring systems suffer from a **30–60 day reporting latency**, causing critical intervention windows to pass unnoticed.

**Project S.A.F.E.** bridges this gap by providing decentralized community educators, school heads, and mentors with an offline-first mobile logging system that reduces the intervention latency from **months to under 72 hours**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PROJECT S.A.F.E. IMPACT MATRIX                   │
├────────────────────────┬─────────────────────────┬──────────────────────────┤
│ TARGET REACH           │ INTERVENTION LATENCY    │ ABSENTEEISM TARGET       │
│ 30 Partner Schools     │ < 72 Hours              │ 40% Target Reduction     │
│ 4,500+ Female Students │ (Down from 30–60 days)  │ 85% Casework Remediation │
└────────────────────────┴─────────────────────────┴──────────────────────────┘
```

---

## 🚀 Key Architectural Features

### 1. 📶 Offline-First CRUD Engine (IndexedDB + Dexie.js)
* Works 100% offline in remote field conditions with zero active connectivity.
* Local writes commit in $< 10\text{ ms}$ to an encrypted IndexedDB client store.
* Compound indices (`[schoolId+date]`, `[studentUid+date]`) provide instantaneous roster queries even on low-spec mobile hardware (1–2 GB RAM).

### 2. ⚠️ Automated 72-Hour Early-Warning Engine
* Analyzes student attendance streaks locally on the device.
* Detects attendance anomalies ($\ge 3$ consecutive unexcused absences) and automatically generates open safeguarding casework alerts without requiring server connectivity.

### 3. 🔄 Resilient Low-Bandwidth Background Sync
* Queues mutations locally with retry counters and exponential backoff.
* Automatically syncs batch payloads to the central PostgreSQL ingestion engine whenever 2G/EDGE or Wi-Fi network connectivity is detected.
* **Payload Budget:** Initial production client bundle is optimized to **$< 360\text{ KB}$** (far below the strict $1.8\text{ MB}$ humanitarian limit).

### 4. 🎙️ Asynchronous FCRM Voice Module
* Built-in audio recorder capturing voice notes (`MediaRecorder` / Opus / WebM compression).
* Enables low-literacy community members, parents, and mentors to submit safeguarding feedback without barrier.
* Offline audio queue stores voice blobs locally in IndexedDB with local playback.

### 5. 🛡️ Child Safeguarding & Zero-PII Compliance
* **Zero Plaintext PII:** No student names, home addresses, or private personal data are stored in browser storage or IndexedDB.
* Uses pseudonymized alphanumeric Unique Identifiers (e.g. `SAFE-KE-0058`).
* Fully adheres to **GDPR Art. 8**, **UN Convention on the Rights of the Child (CRC)**, and **Keeping Children Safe** standards.

---

## 🛠️ Tech Stack & System Architecture

```
                               ┌────────────────────────────────────────┐
                               │       CLIENT (PWA / Offline-First)      │
                               │ React 19 · Vite · Tailwind · Dexie.js   │
                               └───────────────────┬────────────────────┘
                                                   │
                                     (Automatic Background Sync)
                                                   │
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │       BACKEND (Central Ingestion)      │
                               │   Node.js · Express · TypeScript       │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │           PERSISTENCE LAYER            │
                               │        PostgreSQL Database 16          │
                               └────────────────────────────────────────┘
```

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
* **Offline Storage & Service Worker:** Dexie.js (IndexedDB), Workbox PWA (`injectManifest`)
* **Backend Ingestion API:** Node.js, Express, TypeScript, Multer
* **Database:** PostgreSQL 16 (Connection Pool & Automated Schema Migrations)
* **DevOps & Deployment:** Render Blueprint (`render.yaml`), Docker, Docker Compose, Nginx

---

## 📂 Repository Structure

```text
├── client/                     # Offline-First React PWA
│   ├── src/
│   │   ├── components/         # Roll-call logger, Casework pipeline, FCRM audio recorder
│   │   ├── db/                 # Dexie schema, mock seed script, Web Crypto
│   │   ├── hooks/              # useOfflineSync background sync hook
│   │   ├── offline/            # Early-warning anomaly detector (<72h)
│   │   └── sw.ts               # Workbox service worker & background sync queue
│   ├── Dockerfile
│   └── nginx.conf              # Nginx Brotli/Gzip configuration
├── server/                     # Central Ingestion & Telemetry API
│   ├── src/
│   │   ├── routes/             # /api/v1/sync and /api/v1/telemetry endpoints
│   │   ├── db.ts               # PostgreSQL connection pool & migrations
│   │   └── index.ts            # Unified Express entrypoint
│   └── Dockerfile
├── docker-compose.yml          # Local containerized orchestration
├── render.yaml                 # 1-Click Render cloud infrastructure blueprint
└── README.md
```

---

## 🧪 Testing the Live Demo (Offline Simulation)

You can test the offline capabilities directly on the **[Live Demo](https://project-safe-server.onrender.com/)**:

1. Open the [Live Web App](https://project-safe-server.onrender.com/).
2. Open Chrome DevTools (`F12` or `Inspect`) $\to$ go to the **Network** tab $\to$ change throttling to **Offline**.
3. **Log Attendance:** Notice the status pill switches to `Offline Mode`. Mark students present or absent; records commit instantly with `Pending Sync`.
4. **Trigger Early Warning:** Mark student `SAFE-KE-0058` absent across 3 consecutive days. Check the **Early-Warning & Casework** tab to see the automated risk alert triggered locally.
5. **Record Voice Feedback:** Go to the **FCRM Voice Module** tab, record an audio message, and listen to the playback.
6. **Reconnect & Sync:** Switch Network back to **Online (No Throttling)**. The sync manager will automatically flush all queued mutations to the central database.

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Katlyn627/Project-S.A.F.E.git
cd Project-S.A.F.E
```

### 2. Run with Docker Compose (Recommended)
```bash
docker compose up --build
```
* **Web App:** `http://localhost:80`
* **API Server:** `http://localhost:8000`
* **Database:** `localhost:5432`

### 3. Run Manually

#### Backend:
```bash
cd server
npm install
npm run dev
```

#### Frontend:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

#### Run Unit Tests:
```bash
cd client
npm test
```

---

## 📜 Ethical Safeguarding & Data Governance

Project S.A.F.E. was developed under humanitarian **Do No Harm** guidelines:
* **GDPR Art. 8 & Data Protection Act (Kenya, 2019):** No personal data from minors is held on field devices.
* **Encrypted Identifiers:** All student tracking uses cryptographic UIDs linked to central school registries only accessible by certified caseworkers.
* **Audit Trail:** Every casework status update (`open` $\to$ `investigating` $\to$ `resolved`) maintains an immutable timestamp log.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
