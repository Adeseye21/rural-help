# Rural Help — "AI vs Professional" Glossary

Phase 0 deliverable 0.9. Canonical labels used across the UI so patients always know the nature of what they are reading (PRD §53, §5.5, §26). These exact labels are enforced in code and content.

## The three categories

| Category | Definition | Canonical UI label |
|---|---|---|
| AI-generated guidance | Informational support produced by the platform; may describe possible causes; never a confirmed diagnosis | **Rural Help suggestion** / "This is information, not a diagnosis." |
| Healthcare professional advice | Assessment or instruction given by a verified professional | **From your healthcare professional** |
| Healthcare professional-confirmed information | A diagnosis or finding confirmed by a professional, recorded separately from AI output | **Confirmed by your healthcare professional** |

## Fixed wording rules

- Never say "You have condition X" for AI output. Use: "These symptoms can have several possible causes. A healthcare professional should assess you to determine the cause."
- AI navigations always surface a professional-care next step when the situation is not clearly self-limited.
- Clinical records distinguish two fields: `rural_help_suggestion` and `healthcare_worker_confirmed_assessment` (PRD §26).
- AI output and confused-diagnosis text must not be stored in the same field as a confirmed assessment.

## Enforcement

The automated safety suite asserts that no published AI output contains confirmed-diagnosis phrasing (declared in the implementation plan's Safety Guardrails and wired as a regression test in later phases).