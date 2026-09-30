# Rural Help — Privacy & Compliance Map

Phase 0 deliverable 0.3. This document maps how the platform handles (a) health-data classification, (b) consent, (c) legal and emergency exceptions, (d) audit, and (e) breach response. It is a living document: update when jurisdiction or feature scope changes.

## Data Classification

| Category | Examples | Sensitivity | Storage rules |
|---|---|---|---|
| Identity | name, email, phone | Personal | Encrypted at rest; shown only to authorized roles |
| Health record | conditions, medicines, allergies, assessments, results | Highly sensitive | Access-logged; consent-gated sharing |
| Emergency summary | conditions, allergies, medicines, emergency contact | Highly sensitive | Patient-curated; offline on device |
| Consent decisions | grants, withdrawals, scope | Highly sensitive | Immutable append-only log |
| Access metadata | who/when/what accessed | Sensitive | Append-only (PRD §55) |
| Resource/facility | equipment, stock, services | Internal | Not patient data; facility-scoped |
| Aggregated analytics | counts, trends | De-identified | Identity-stripped; no raw reports |

## Consent Model (summary)

- Sharing a patient's information requires **explicit patient approval** per action (what / why / who), recorded as a consent record (PRD §54).
- Withdrawal revokes access **immediately** at the resource level; in-flight requests complete only if recorded before withdrawal.
- Trusted caregiver access is granted/limited/revoked by the patient (PRD §17).
- Full design in `consent-design.md`.

## Legal & Emergency Exceptions

- An emergency-care exception may permit disclosure without prior consent **only** when required to address an immediate threat to the patient's or another's life, and the disclosure is scoped to what is necessary (PRD §54).
- The exception event is recorded in the access log with reason and authorizing professional.
- Mandatory reporting requirements (e.g., notifiable disease) follow the applicable authority's rules and are logged as legal disclosures, not treated as general consent.

## Audit & Access History

- Every access to a patient record writes an access-log entry: actor, role, subject, scope, timestamp (PRD §55).
- Patients can view their access history and report unrecognized access; reports enter the feedback pipeline (PRD §50).

## Breach Response

1. Detect and contain (revoke sessions/tokens; isolate affected region).
2. Notify in line with applicable law and the responsible authority within required timelines.
3. Communicate to affected patients in simple language with a remedial-action plan.
4. Root-cause review and control update; log as a safety-critical report.

## Jurisdiction Checklist

- Identify applicable health-data protection law and medical-device/software classification **before** any cross-border deployment.
- Document: retention periods, deletion rights, legitimate-interest bases, data-subject request handling, and breach-notification SLAs.
- Pending decision: initial target region(s) — not yet selected. This drives sections above.