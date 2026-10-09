# Reviewer Questions Memo v2 — consolidated across all four reviews

**Status:** Batch A (fully-specified wording) is implemented and verified:
typecheck, safety 116/116 (with 19 new pinned assertions), E2E 32/32,
auth 9/9. Everything below is what we still need from reviewers before the
corresponding code ships.

## Already settled by reviewer majority (no action needed)

- **B10 fever + body aches: same-day stands** (R1 Correct, R3 reasonable-in-Nigeria,
  R4 explicit keep with expanded urgent-if list vs R2 downgrade). Implemented
  with R4's paragraph, urgent-if list, prescriber-following medication note.
- **A7 stroke: keep** (R2 + R4 Correct vs R1's vague downgrade, which is discarded).
- **A13 body/joint emergency: keep** (R1 + R4 Correct vs R2 narrow).
- **C12 chronic pain → urgent (not emergency): keep** (R1 + R4 vs R2 routine).
- **Part E strings: keep verbatim** (R4 explicit; no objections).

## Questions back (numbered for reply)

**Q1 — R1 only: A7 replacement wording.** You marked stroke "Too strong" with no
replacement. R2 and R4 both marked it Correct. Do you withdraw the verdict, or
provide the exact replacement sentence?

**Q2 — R1 only: missing verdicts.** D8 burns, D10 choking, D12 heat have no
verdict marked. Please mark each Correct / Too strong / Too weak.

**Q3 — R1 only: D12 meaning.** Your comment asks to "identify the cause of the
heat stroke whether climatic or environmental." Is that a new follow-up
question for the app, or a note for professionals? One clarifying sentence.

**Q4 — R2/R3: new emergency pathways.** Sepsis warning signs, serious child
illness, seizures in pregnancy, heavy bleeding after childbirth, and R1's
"low blood sugar" flag need full text: trigger words, app wording, first aid.
We will not draft these without you.

**Q5 — R2: full-copy items.** TB/bite-rabies screening text, D8 coin-rule
replacement, ORS preparation recipe, heat-stroke split copy beyond the
red-flag line, age-specific choking algorithms, B11 fallback reorder wording.

**Q6 — RESOLVED: use 112, not 116.** R4 suggested "call 116" as a Nigerian
child helpline. No Nigerian 116 service is verifiable (116 serves other
countries; Nigeria's listed child helplines are Cece Yara 0800 800 8001 and
HDI 0808-0551-376), and 112 is Nigeria's emergency helpline. Since the D14
step is a self-harm crisis step, the general emergency number is the more
directly useful one: the shipped wording names **112 / nearest hospital
emergency / trusted person**. (Cece Yara noted here as fallback if a
child-specific line is later requested.)

**Q7 — Field findings awaiting rulings** (already in the checklist §Field-test
findings): bundle-vs-split on swollen/red/hot (B9/C10); family-calling +
no-transport emergency copy; detail-demand ruling; pictures alongside
questions (queued, not built).

**Q8 — Identities and sign-off boxes.** R1 is attributed (Oyegbenro, RN/RM/BNSC)
but boxes unchecked. R2, R3, R4 have no name, qualification, date, or checked
boxes on file. We need, per reviewer: name, qualification, date, and the
review-complete + field-testing boxes checked at minimum. Nothing counts as a
signed review without these.

## What ships only after answers

- Any new pathway (Q4), any replacement copy (Q5), any rewording (Q1–Q3),
  the 116 number (Q6 — currently Cece Yara, flagged).
- Pilot sign-off remains off until safety-critical corrections are validated
  and emergency pathways re-tested (per R3's final recommendation, agreed).
