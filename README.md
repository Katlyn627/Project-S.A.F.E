# Project S.A.F.E. (School Attendance & Foundational Empowerment)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![PWA Ready](https://img.shields.io/badge/PWA-offline--first-blue)]()

An offline-first Progressive Web Application (PWA) and M&E framework designed to combat adolescent female school dropout across rural, low-connectivity districts.

---

## 📌 Project Overview

In rural East Africa, adolescent girls experience a 42% higher dropout rate than male peers due to long commutes, early marriage pressures, and climate-induced burdens. Standard paper-based monitoring suffers from a 30–60 day reporting latency, delaying critical interventions.

**Project S.A.F.E.** bridges this gap by providing decentralized community mentors and school heads with an offline-sync mobile logging system that reduces intervention latency from months to under 72 hours.

### Key Targets & Impact
* **Target Reach:** 30 partner schools, 120 certified educators/mentors, 4,500+ female students.
* **Latency Reduction:** Identification of at-risk students within <72 hours.
* **Attendance Impact:** 40% target reduction in chronic absenteeism and 85% casework remediation rate.
* **Long-Term Goal:** 25% increase in female secondary graduation rates.

---

## 🚀 Key Features

* **Offline-First CRUD Architecture:** Uses IndexedDB to store attendance records locally on low-cost devices without active connectivity.
* **Automated Early-Warning Engine:** Triggers caseworker alerts when attendance anomalies (e.g., >3 consecutive absences) are detected.
* **Low-Bandwidth Background Sync:** Queues lightweight payloads (<1.8 MB total asset bundle) for automatic background syncing over 2G/EDGE networks.
* **Safeguarding & Data Ethics:** Implements end-to-end PII anonymization via unique encrypted alphanumeric Beneficiary IDs (UIDs) compliant with Do No Harm, Keeping Children Safe, and GDPR Art. 8 guidelines.
* **Voice-Note Feedback (FCRM):** Asynchronous voice-entry module enabling low-literacy community reporting.

---

## 🛠️ Tech Stack

* **Frontend:** React / Vue / Vanilla JS (PWA with Service Workers & Web App Manifest)
* **Client Storage:** IndexedDB (via Dexie.js / Workbox)
* **Backend API:** Node.js / Python / Go (REST or GraphQL)
* **Database:** PostgreSQL (Encrypted Beneficiary Stores)
* **Sync & Queue:** Background Sync API / WebSockets

---

## 📂 Repository Structure

```text
├── .github/              # Issue templates, PR templates, and CI/CD workflows
├── docs/                 # LogFrames, Theory of Change, and Safeguarding guidelines
│   ├── LOGFRAME.md
│   └── SAFEGUARDING.md
├── client/               # PWA Frontend source code
│   ├── public/           # Manifest, icons, service worker assets
│   └── src/
│       ├── components/   # UI components (Attendance, Casework, FCRM Voice Module)
│       ├── db/           # IndexedDB schemas and sync logic
│       └── utils/        # UID hashing and client-side encryption
├── server/               # Central Aggregation API & Database migrations
│   ├── src/
│   │   ├── controllers/
│   │   └── models/
│   └── tests/
├── scripts/              # Data export & seed scripts for offline testing
├── .env.example          # Environment variable template
└── README.md
