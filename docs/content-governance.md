# Rural Help — Medical Content Governance

Phase 0 deliverable 0.6. Rule for creating, reviewing, publishing, and retiring medical content, satisfying PRD §51, §50, and §5.

## Content States

A medical content item has exactly one state at all times:

`draft → in_review → published → (review_due | retired)`

- **draft** — editor-authored, not visible to users.
- **in_review** — assigned to a qualified medical reviewer (role: `medical_reviewer`).
- **published** — live; carries `reviewed_at`, `reviewed_by`, and `last_reviewed_date`.
- **review_due** — content is live but beyond its review interval; flagged and re-queued for review.
- **retired** — removed from user-facing surfaces; never silently reused.

## Required Metadata

Every published item shows: title, `last_reviewed_date`, `source`, and `review_status`. Patients see a simple + "Sources / Learn More"; workers see detailed references (PRD §52).

## Review Rules

- No medical content is published without a review by a qualified professional; specialized topics require an appropriate specialist.
- Language parity: every warning/emergency string must exist in all supported languages before the item publishes (ties to the localization pipeline).
- Content referencing resources must not recommend a facility resource that is unavailable (PRD §71.10).
- Outdated content is reviewed or clearly marked retired (PRD §51).

## Safety-Critical Reports

Feedback that flags incorrect, outdated, or unsafe guidance (PRD §50):

1. Triaged to the highest-priority queue.
2. Reviewed by a qualified medical reviewer according to severity SLA.
3. If confirmed, the item is immediately moved to `retired` or `review_due` and the correction is scheduled.
4. The report and resolution are logged for the feedback/quality pipeline.

## Enforcement (automated)

- CI gate: every published item must carry `last_reviewed_date`, `source`, `review_status`.
- CI gate: all supported-language warning strings are present (language parity test).
- Content expiry: scheduled job flips `published → review_due` past the review interval.