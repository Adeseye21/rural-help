# Rural Help

AI-assisted healthcare support platform for rural and underserved communities.

## Overview

Rural Help supports two main groups:

- **Patients and caregivers** — understandable health information, symptom guidance, first-aid guidance, urgency assessment, healthcare-service navigation, reminders, health education, and preparation for professional consultations.
- **Healthcare workers** — decision support based on patient information and facility resources, assessment documentation, referral preparation, follow-up, resource management, specialist consultation, and patient handover.

Rural Help is designed to **support — not replace — qualified healthcare professionals**. AI guidance is informational support; clinical assessment and treatment decisions remain the responsibility of healthcare professionals.

## Problem

People in rural communities often struggle to access appropriate healthcare: facilities are far away, equipment and medicines are limited, specialists are scarce, referrals are hard to coordinate, internet access is unreliable, and patients may not know whether a symptom needs urgent attention or how to understand medical information.

## Vision

Make appropriate healthcare information, guidance, professional support, and referral pathways more accessible to people and healthcare workers in underserved communities.

## Core Capabilities

- Symptom guidance with adaptive questions and warning-sign detection
- Emergency support with immediate safety guidance and prioritized escalation
- First-aid guidance (not a substitute for professional care)
- Health-information explanation in simple language
- Visit preparation and discharge support
- Patient health records with patient control over sharing and access
- Trusted caregiver/family access controlled by the patient
- Healthcare-worker assessment support and clinical documentation
- Resource-aware care support based on facility capabilities
- Referral preparation, transfer coordination, and referral tracking
- Specialist consultation and clinical handover
- Follow-up and long-term health management
- Health education and preventive-care support
- Local-language support with offline emergency capabilities

## Safety Principles

1. Never present uncertain information as a confirmed diagnosis.
2. Prioritize emergencies.
3. Encourage professional care when necessary.
4. Clearly distinguish AI guidance from healthcare professional advice.
5. Keep clinical decisions under healthcare-worker control.
6. Protect patient information and give patients control over sharing.
7. Clearly identify outdated or unreviewed information.
8. Avoid recommending resources unavailable at a facility.
9. Keep emergency information accessible offline where possible.
10. Provide clear escalation when the platform cannot safely support a situation.

## Status

Initial monorepo scaffolded — Express API connected to local PostgreSQL, React/Vite PWA with offline support, sign-in-page demo from the design phase still in `app.html` and `design.html`.

## Development

Monorepo (pnpm workspaces): `packages/api` (Express + TypeScript + Drizzle) and `packages/web` (React 18 + Vite PWA).

Prerequisites:

- Node.js 24 (LTS) and pnpm 12
- PostgreSQL 18 running locally with a `rural_help` database (owner role `rural_help`)

Commands (run from the repo root):

```
pnpm install
pnpm dev                # API on :3001 + web on :5173 (PWA)
pnpm typecheck          # typecheck all packages
pnpm db:generate        # generate Drizzle migration from schema
pnpm db:migrate         # apply migrations to the database
```

Configuration lives in `packages/api/.env` (copy from `.env.example`). The web dev server proxies `/api` to the API.

## Design Reference

- `design.html` — visual design system (colors, typography, buttons, inputs)
- `app.html` — sign-in page + dashboard demo from the design phase

## Product Requirements

The full specification is in [PRD.md](./PRD.md), a Product Requirements Document covering users, features, workflows, safety requirements, success measures, and MVP scope.

## License

To be determined.