# Rural Help — Consent & Access-Control Design

Phase 0 deliverable 0.4. Concrete consent and role-permission model, mapped to PRD §7 (roles), §17 (caregiver), §54 (consent), §55 (access history).

## Roles

`user_role` enum in the database: `patient`, `caregiver`, `community_health_worker`, `nurse`, `doctor`, `specialist`, `facility_administrator`, `medical_reviewer`.

## Permission Matrix (read/act for patient data)

| Capability | Patient | Caregiver | CHW | Nurse | Doctor | Specialist | Facility Admin | Medical Reviewer |
|---|---|---|---|---|---|---|---|---|
| View own record | yes | granted only | no | per-case | per-case | per-request | no | by review scope |
| Symptom guidance | yes | via patient | assist | assist | assist | no | no | no |
| Request review | yes | on behalf | yes | yes | yes | no | no | no |
| Document assessment | no | no | per-case | yes | yes | advice only | no | no |
| Confirm condition | no | no | no | per-protocol | yes | advice only | no | no |
| Prepare referral | no | no | yes | yes | yes | no | no | no |
| Manage facility resources | no | no | limited | limited | no | no | yes | no |
| Review medical content | no | no | no | no | no | no | no | yes |

- **Caregiver** never has automatic access: it exists only as a grant the patient can limit, change, or revoke at any time (PRD §17).
- Enforcement is implemented (a) in application middleware by role, and (b) planned as PostgreSQL row-level security (RLS) on patient tables so access is safe at the data layer (see ORM decision PRD §78.1).

## Consent Records

A consent record is created on every sharing action:

```
consent_id, patient_id, grantee_role, scope[], purpose, created_at,
expires_at?, withdrawn_at?, created_by
```

- Fields of `scope[]` name exactly which data categories are shared (e.g., `[symptoms, medicines]`).
- `purpose` records why (e.g., `specialist_review`, `referral`, `research`).
- Withdrawal sets `withdrawn_at` and triggers immediate revocation at the resource layer plus an access-log entry.
- Consent decisions are **append-only**: an update writes a new record, never mutates the old one (audit integrity).
- Emergency exception: recorded as a consent record with `created_by = emergency_exception` and the authorizing professional.

## Access Log

Every read/write on patient data appends:

```
access_id, patient_id, actor_id, actor_role, scope, action, occurred_at
```

Visible to the patient in the access-history view, with unrecognized-access reporting (PRD §55).

## Guardrails

- Sensitive questions are optional and prefixed with why-it-matters (PRD §56).
- No location use without permission (PRD §59).
- RLS policies must be part of Drizzle migrations so they are code-reviewed (PRD §78.1).