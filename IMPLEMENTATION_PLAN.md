# Rural Help — Implementation Plan

Ordered build phases with concrete outputs. Derived from the PRD (`Rural Help.md`). Each phase ships independently, ends with an "exit criteria" that must pass before the next phase starts. Safety requirements (PRD §71) apply to every phase.

---

## Phase 0 — Foundations

**Purpose:** Lock product/technical decisions, compliance posture, and the content-governance engine before writing application code.

| # | Concrete output | Description | PRD refs |
|---|-----------------|-------------|----------|
| 0.1 | **Tech stack decision record** | Chosen languages, frameworks, hosting, and storage, justified against offline/low-bandwidth, voice input, local languages, and health-data compliance. | §4, §58 |
| 0.2 | **Architecture diagram + data model** | Component diagram (client, server, offline sync, AI orchestration, storage) and entity model: user, role, patient, consent, facility, resource, assessment, referral, follow-up, record/audit log. | §7, §15, §27 |
| 0.3 | **Privacy & compliance map** | Data classification, consent model (what/who/when), legal and emergency-care exceptions, breach process, and jurisdiction checklist. | §54, §55, §66 |
| 0.4 | **Consent & access-control design** | Role matrix (8 roles), permission table per role, consent grant/withdraw lifecycle, caregiver delegation. | §7, §17, §54 |
| 0.5 | **Design system + accessibility baseline** | Component library meeting: larger text, simple language, icons, step-by-step instruction, voice alternative. | §18, §22, §24 |
| 0.6 | **Medical content governance process** | Review workflow, roles (medical reviewers), content status fields (reviewed date, source, status), expiry/review rules. | §51, §52 |
| 0.7 | **Localization pipeline** | Translation workflow for English + 1–2 local languages, mandatory expert review of warnings/emergency strings. | §19 |
| 0.8 | **Repo hygiene** | `.gitignore`, `LICENSE`, branch strategy, CI pipeline, local dev environment, test strategy. | — |
| 0.9 | **Glossary of "AI vs professional" labels** | Canonical UI wording distinguishing AI guidance / professional advice / confirmed information. | §53, §5.5 |

**Exit criteria:** All nine artifacts exist in the repo; architecture and consent design pass an internal or external review; CI is green on scaffolded app shell.

---

## Phase 1 — MVP (PRD §73)

**Purpose:** Ship the end-to-end patient journey and the healthcare-worker case workflow with strict safety defaults.

### 1A. Patient core

| # | Concrete output | Description | PRD refs |
|---|-----------------|-------------|----------|
| 1A.1 | **Patient registration & profile** | Account creation, profile (age, conditions, medicines, allergies), consent controls, emergency summary. | §73, §15, §57 |
| 1A.2 | **Symptom guidance engine** | Multi-modal intake (type/voice/guided/icons), adaptive follow-up questions, warning-sign checks. | §8 |
| 1A.3 | **Uncertainty-safe output** | Guidance generator that states possible causes without confirming diagnosis, with "Sources / Learn More" and professional-care recommendation. | §5.5, §11, §51 |
| 1A.4 | **Emergency detection & flow** | Red-flag detection, minimized-question emergency path, immediate safety guidance, emergency contacts, nearby-facility lookup (opt-in). | §9, §69 |
| 1A.5 | **First-aid guidance** | Condition-gated first-aid steps, what-to-avoid list, "seek professional care" warnings. | §10 |
| 1A.6 | **Offline emergency pack** | Locally cached emergency guidance, saved emergency summary, sync-on-reconnect with staleness indicator. | §58 |
| 1A.7 | **Healthcare-service navigation** | Permissions-based nearby facilities, pharmacies, labs, ambulance/emergency services with capability descriptions. | §38, §59 |
| 1A.8 | **Health info explanation** | Upload/enter documents (results, reports, prescriptions); simple-language explanation + "clarify with your professional" items. | §12 |
| 1A.9 | **Visit preparation** | Guided preparation summary: symptoms, onset, history, medicines, allergies, documents, questions. | §13 |
| 1A.10 | **Professional-review request + approved sharing** | Summary generated → patient reviews → patient approves → shared to healthcare worker; rejected review folder absent from worker view. | §14, §54 |
| 1A.11 | **Follow-up reminders** | Patient-controlled reminders with opt-in/opt-out and escalation on changed symptoms. | §41, §44 |
| 1A.12 | **Conversation memory (saved info)** | Save/review/delete/pause/continue; incomplete conversations clearly marked; no auto-assumed currency. | §16 |

### 1B. Healthcare-worker core

| # | Concrete output | Description | PRD refs |
|---|-----------------|-------------|----------|
| 1B.1 | **Verified worker access** | Registration and verification flow for CHWs/nurses/doctors; role-based access enforced. | §7 |
| 1B.2 | **Patient case intake** | Inbox of patient-approved reviews + shared summaries; worker opens case. | §68, §14 |
| 1B.3 | **Assessment documentation** | Structured assessment capture producing an editable record that the worker reviews and approves. | §31, §26 |
| 1B.4 | **AI-assisted clinical support** | Suggestions presented as **Rural Help suggestion**, never as confirmed assessment; separate confirmation field owned by worker. | §26, §25.1, §53 |
| 1B.5 | **Facility capability profile** | Facility creates/maintains services, equipment, medicines, supplies, referral capabilities. | §29, §27 |
| 1B.6 | **Resource-aware guidance** | Management options filtered by confirmed condition + current facility resources; guidance adjusts when resources change. | §27 |
| 1B.7 | **Referral preparation** | Identify facility, reason, referral summary, missing-information check. | §34 |
| 1B.8 | **Referral tracking (basic)** | Status: initiated → received → arrived → completed; follow-up reminders generated. | §35 |
| 1B.9 | **Follow-up management (worker)** | Worker follow-up lists, check-ins, missed-follow-up alerts, escalation triggers. | §41, §42 |
| 1B.10 | **Clinical handover** | Handover summary generation; outgoing worker reviews/approves. | §32 |
| 1B.11 | **Basic resource management** | Facility resource inventory with low-stock/unavailable flags and shortage view. | §28 |
| 1B.12 | **Content source display** | Reviewed-date, source, and review status shown on all medical content. | §51, §52 |

**Exit criteria:** 1A.1–1A.12 and 1B.1–1B.12 pass safety soak (see Safety Guardrails) and a field pilot with at least one facility and 20 patients in both English and a local language; no confirmed-diagnosis language found in audit of 100 AI outputs.

---

## Phase 2 — Care Continuity & Patient Control

**Purpose:** Complete the longitudinal record: caregiver support, full PHR controls, medication/discharge/return flows, and reassessment.

| # | Concrete output | Description | PRD refs |
|---|-----------------|-------------|----------|
| 2.1 | **Trusted caregiver delegation** | Patient grants/limits/revokes caregiver access; per-information-type permissions; action log. | §17, §15 |
| 2.2 | **Full patient health records** | View, correct own info, request corrections to professional records, control sharing, delete saved info, change history. | §15 |
| 2.3 | **Access history & reporting** | Who/what/when audit view for the patient + unrecognized-access reporting. | §55 |
| 2.4 | **Medication & treatment tracking** | Professional- or patient-entered treatments; reminders, completion tracking, professional-order adherence, problem alerts. | §44 |
| 2.5 | **Discharge support** | Worker-reviewed discharge instructions: treatment, medicines, home care, warning signs, follow-up date, when to return. | §61 |
| 2.6 | **Returning-patient review** | Post-referral checklist: referral info, treatment received, current condition, follow-up instructions, outstanding needs. | §37 |
| 2.7 | **Conversation reassessment** | "What changed?" flow: verify warning signs, compare to earlier situation, adjust guidance, escalate when appropriate; original assessment flagged as no longer automatically valid. | §60 |
| 2.8 | **Multiple conditions** | Multi-condition organization (conditions, medicines, treatments, appointments, providers); relationship highlighting for professional review. | §63 |
| 2.9 | **Emergency health summary management** | Patient-curated emergency summary with last-updated stamp and explicit share control. | §57 |
| 2.10 | **Transfer coordination** | Receiving-facility identification, transport-type distinction (ordinary vs emergency), patient info packet. | §36 |

**Exit criteria:** Longitudinal test — one fictional patient exercises referral → treatment → return → reassessment with caregiver access, with full audit trail visible to the patient.

---

## Phase 3 — Professional & Community Ecosystem

**Purpose:** Connect workers to specialists and communities to verified public-health support.

| # | Concrete output | Description | PRD refs |
|---|-----------------|-------------|----------|
| 3.1 | **Specialist consultation** | Worker → case summary → worker review → share → specialist advice → worker records decision; privacy-protected. | §33 |
| 3.2 | **Facility-specific guidelines** | Facility-authored local guidelines, professional-review gate, clearly separate from general medical guidance, updated on capability change. | §30 |
| 3.3 | **Cost & affordability info** | Cost estimates (clearly labeled), lower-cost/public options, never a reason to delay emergency care. | §39 |
| 3.4 | **Transportation support** | Ordinary vs emergency transport options, prioritizing professional emergency services. | §40 |
| 3.5 | **Health education content hub** | General + personalized education library (hygiene, nutrition, maternal, child, medication safety, when-to-seek-care) with urgent-guidance separation. | §45 |
| 3.6 | **Diagnosis education** | Post-confirmation patient education: meaning, causes, treatment intent, expectations, precautions, warning signs, follow-up. | §62 |
| 3.7 | **Community campaigns** | Reviewed-before-publish health campaigns with source, date, local-language support, target communities. | §46 |
| 3.8 | **Local health alerts** | Verified-area alerts with source, date, area, explanation, recommended action; unverified reports blocked. | §47 |
| 3.9 | **Community health reporting** | Report → pattern → professional review → confirmation → community notification; raw reports never auto-declared outbreaks. | §48 |
| 3.10 | **Traditional/local practices support** | Q&A distinguishing tradition vs established treatment, known risks, delay-of-care warnings, no unproven-remedy endorsement. | §49 |
| 3.11 | **Feedback & quality pipeline** | Patient/worker feedback (incorrect/outdated/unsafe/UX/privacy), medical review routing, safety-priority queue. | §50 |

**Exit criteria:** A simulated community outbreak drill completes end-to-end (report → pattern → confirmation → notification) without a false public outbreak declaration; all campaigns publish behind review with visible source/date.

---

## Phase 4 — Data, Learning & Scale

**Purpose:** Expand coverage, languages, and responsible data use while protecting identity.

| # | Concrete output | Description | PRD refs |
|---|-----------------|-------------|----------|
| 4.1 | **Aggregated data & learning service** | Privacy-protected aggregation of patterns: common concerns, resource shortages, referral patterns, service demand, seasonal trends, workload. Individual identity protected; raw reports never treated as confirmed findings. | §65 |
| 4.2 | **Research-use governance** | Consent/approval workflow for secondary research use; no silent repurposing of patient data. | §66 |
| 4.3 | **Advanced resource planning** | Trend-informed shortage forecasts and facility planning views. | §65, §74 |
| 4.4 | **Broader facility network & referral mesh** | Cross-region facility registry and multi-hop referral coordination. | §74 |
| 4.5 | **More local languages** | Language expansion program with expert-reviewed warning content in each. | §19, §74 |
| 4.6 | **Advanced preventive-care programs** | Structured screening/education/prevention campaigns with outcome tracking. | §20, §74 |
| 4.7 | **Accessibility expansion** | Enhanced voice, visual, and simplified-communication modes from usage data. | §18, §24, §74 |

**Exit criteria:** Privacy impact assessment passes before 4.1 ships; metrics dashboard live; three additional languages reviewed and released.

---

## Cross-Cutting Safety Guardrails (every phase)

Automated checks that block release when violated (PRD §71):

1. Regression test suite asserting no confirmed-diagnosis language in AI output.
2. Emergency-flow tests: red-flag inputs always escalate, never advise delay.
3. Missing-resource test: guidance never recommends unavailable facility resources.
4. Access-control tests: role/permission assertions, consent withdraw → immediate revocation.
5. Offline tests: emergency pack functional with network disabled; stale-data indicator shown.
6. Content tests: every medical content record carries reviewed-date/source/status.
7. Language parity test: all warning/emergency strings present in every supported language.

## Suggested Build Order Dependencies

- Phase 1 depends on all of Phase 0.
- 1A.10 (review request) needs 1A.1 and 1A.3; 1B.2 needs 1A.10.
- 1B.6 needs 1B.5; 1B.7 needs 1B.6.
- Phase 2.6 (returning patient) needs Phase 1 referral outputs (1B.7/1B.8).
- Phase 3.9 needs 3.8 and 3.11. Phase 4.1 needs Phase 2 audit/access history and Phase 3 feedback pipeline.

## Team Shape Suggestion

- 2–3 full-stack engineers, 1 clinical/product lead, 1 UX/accessibility designer, 1 QA focused on safety tests, 1 medical reviewer (part-time), 1 community/localization liaison from Phase 1 onward.