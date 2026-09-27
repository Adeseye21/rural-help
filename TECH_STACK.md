# Rural Help — Tech Stack

Current deployment mode: **the app and database run locally** for now — no cloud services, no hosted database, no remote storage. The database is the local PostgreSQL instance on this machine.

## Framework

- **Monorepo** (TypeScript) with three packages:
  - **Patient app:** React 18 + Vite, built as a **PWA** for offline capability.
  - **Worker portal:** React 18 + Vite (web-based, desktop-first).
  - **API server:** Node.js + Express (TypeScript), REST.
- **Voice input:** browser Web Speech API where available; Whisper-based service as a connected fallback for higher accuracy.
- Rationale: PWA delivers the offline emergency support required by PRD §58 without app-store distribution; React/Vite keeps both client apps in one component ecosystem.

## Database

- **PostgreSQL** (v18) from day one — same database in dev and production, so no migration drift.
- Access via **Prisma ORM** (schema migrations managed by Prisma).
- Running locally as a Windows service (`postgresql-x64-18`).
- Offline capability is delivered by the client (PWA IndexedDB cache), not the server database.
- Future: local vector index for symptom-matching support.

## Authentication

- Self-hosted **JWT** scheme:
  - **Argon2id** for password hashing.
  - Short-lived access tokens + rotating refresh tokens (via `jose`).
  - Role/permission layer mapped to PRD §7 (Patient, Caregiver, CHW, Nurse, Doctor, Specialist, Facility Administrator, Medical Reviewer).
- Healthcare-worker verification: admin-issued invite codes/OTP initially.
- This foundation becomes the consent and delegation engine (PRD §17, §54).

## File Storage

- **Local filesystem in dev** behind a storage-abstraction interface.
- On deployment: **MinIO (S3-compatible)** so encryption-at-rest and regional hosting can be added.
- Used for patient documents: test results, reports, prescriptions (PRD §12).

## Constraints Driven by the PRD

- Offline-first for emergency guidance (PRD §58).
- Low-bandwidth friendly (rural connectivity, PRD §2).
- Health-data privacy and patient-controlled sharing (PRD §54, §55, §66).
- Local-language support for English + 1–2 local languages (PRD §19).