# Rural Help — Localization Pipeline

Phase 0 deliverable 0.7. English + 1–2 local languages at MVP (PRD §19). This pipeline keeps medical warnings safe in every language.

## Language Set

- MVP: English + one pilot local language (to be chosen with the community liaison).
- Expansion follow community usage data.

## String Categories

| Category | Example | Translation rules |
|---|---|---|
| Emergency/warning | "Seek emergency care now" | Verified by a medical reviewer AND a local-language expert; frozen once signed off |
| Medical guidance | symptom explanations | Expert review after machine translation |
| UI chrome | buttons, labels | Standard review; no expert gate |
| Legal/privacy | consent screens | Jurisdiction-aware; review required |

## Workflow

1. Source strings are stored as keys in a single catalog (`translations/<key>.json` per language).
2. Machine-assisted first pass, then human translator.
3. **Emergency/warning category:** mandatory second review by an independent local-language expert; result recorded as `verified`.
4. CI gate: key-parity across all language files; warning-key `verified` flag required.
5. On merge, the PWA bundles strings; emergency keys also ship in the offline pack (PRD §58).

## Governance

- Interpolation must never split a warning sentence across fragments (breaks reviewability).
- Number/date/locale formatting uses per-locale conventions.
- A string change invalidates verification and re-queues review (content governance integration).