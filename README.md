# Project S.A.F.E. (School Attendance & Foundational Empowerment)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-blue)](https://project-safe-server.onrender.com/)
[![Compliance](https://img.shields.io/badge/Compliance-GDPR%20Art.%208%20%7C%20UN%20CRC-green)](#safeguarding--privacy)
[![Offline First](https://img.shields.io/badge/Storage-IndexedDB%20(Dexie.js)-orange)](#architecture)

Project S.A.F.E. is an offline-first Progressive Web App (PWA) engineered to prevent school dropouts and protect adolescent female students across low-connectivity regions in East Africa. By eliminating dependence on persistent internet access, it bridges the gap between daily classroom attendance and humanitarian caseworker intervention.

---

## Key Metrics & Impact Targets

| Metric | Target |
| :--- | :--- |
| **Reach** | 30 Schools / 4,500+ Adolescent Female Students |
| **Absenteeism Reduction** | 40% reduction in chronic absenteeism |
| **Intervention Latency** | < 72 Hours (reduced from 30–60 days) |
| **Casework Remediation** | 85% successful resolution & re-enrollment |

---

## Core Features

- **Offline Roll-Call & Case Logging:** Capture attendance and student wellness records offline with instant local writes.
- **Early-Warning Telemetry:** Automated triggers flag at-risk patterns to alert caseworkers before dropout occurs.
- **FCRM Voice Module:** Built-in low-bandwidth audio feedback and complaints mechanism.
- **M&E Telemetry Dashboard:** Real-time visibility into student counts, unsynced mutations, and device storage health.

---

## Architecture & Tech Stack

- **Frontend & PWA:** Service Workers, Web App Manifest, Cache API.
- **Client-Side Storage:** `Dexie.js` (IndexedDB v2 wrapper) managing local mutation ledgers (`safe-offline-db`).
- **Sync Engine:** Background sync queue with a 72-hour max retention policy.
- **Network Budget:** Strict payload limit (<1.8 MB bundle) optimized for 2G/EDGE networks.
- **Hosting & Infrastructure:** Deployed continuously on [Render](https://project-safe-server.onrender.com/).

---

## Safeguarding & Privacy

Child data protection is built into the data layer:
- **Zero Plaintext PII:** Sensitive identifiers are never stored unencrypted on client devices.
- **Client-Side Encryption:** AES-GCM 256-bit encryption with blind pseudonymized UIDs.
- **Standards:** Compliant with **GDPR Art. 8** and the **UN Convention on the Rights of the Child (UN CRC)**.

---

## Live Deployment

Explore the web app and live M&E telemetry:
[https://project-safe-server.onrender.com/](https://project-safe-server.onrender.com/)
