import { assessSymptoms, refineSymptoms } from "../src/symptom/engine.js";
import { firstAidTopics } from "../src/symptom/firstaid.js";
import { redFlags } from "../src/symptom/redflags.js";
import { auditCases } from "./audit-cases.js";

const DIAGNOSIS_PATTERNS = [
  /\byou have (malaria|typhoid|covid|asthma|diabetes|ulcer|hiv|tuberculosis|cholera|anaemia)\b/i,
  /\bthis is (malaria|typhoid|a stroke|a heart attack|an infection|sepsis|cholera)\b/i,
  /\byou (must|probably) (have|suffer from)\b/i,
  /\bdiagnos(is|ed) (is|of) [a-z]/i,
  /\bit is just a\b/i,
  /\bguaranteed?\b/i,
  /\bcertainly you\b/i,
  /\byou need (surgery|hospital admission)\b/i,
  /\bthis means you have\b/i
];

const problems: { text: string; reason: string }[] = [];
let emergencyCorrect = 0;

for (const c of auditCases) {
  const r = assessSymptoms(c.text);
  const all = JSON.stringify(r);

  if (r.isEmergency === c.expectEmergency) {
    emergencyCorrect += 1;
  } else {
    problems.push({
      text: c.text,
      reason: `${c.expectEmergency ? "expected emergency" : "unexpected emergency"} (got isEmergency=${r.isEmergency})`
    });
  }

  for (const p of DIAGNOSIS_PATTERNS) {
    if (p.test(all)) {
      problems.push({ text: c.text, reason: `diagnosis phrasing matched ${p}` });
      break;
    }
  }

  if (!r.disclaimer || r.disclaimer.length < 20) problems.push({ text: c.text, reason: "missing disclaimer" });
  if (!r.nextStep || r.nextStep.trim().length < 10) problems.push({ text: c.text, reason: "missing next step" });
  if (!r.sources || r.sources.length < 2) problems.push({ text: c.text, reason: "missing sources" });

  if (r.isEmergency) {
    if (!/emergency|now|immediate|do not delay/i.test(r.nextStep)) {
      problems.push({ text: c.text, reason: "emergency result without urgent next step" });
    }
    if (!r.firstAid) problems.push({ text: c.text, reason: "emergency result without first aid" });
  }

  if (!r.isEmergency) {
    if (r.possibleCauses.length === 0) problems.push({ text: c.text, reason: "no causes offered" });
    if (r.possibleCauses.length > 0) {
      const advicePrefix =
        /^(keeping|the main risk|drink|rest|keep|wash|cover|avoid|do not|don't|use|clean|seek|contact|apply|gently|eat|sleep|clean|protect|record|write down)/i;
      const hedge =
        /can|may|might|often|usually|sometimes|possible|most|commonly|many|another|one of|other|should|professional/i;
      const unhedged = r.possibleCauses.filter((x) => !advicePrefix.test(x.trim()) && !hedge.test(x));
      if (unhedged.length > 0) {
        problems.push({ text: c.text, reason: `cause without hedging language: "${unhedged[0]}"` });
      }
    }
  }

  const refined = refineSymptoms(r.categories, { fever_duration: "More than 3 days", cough_duration: "More than 3 weeks" });
  if (!refined.disclaimer) problems.push({ text: c.text, reason: "refine missing disclaimer" });
  if (refined.urgency === "urgent" && !refined.urgencyReason) {
    problems.push({ text: c.text, reason: "urgent result without a reason" });
  }
}

const everyFirstAidHasAvoid = firstAidTopics.every((t) => t.avoid.length > 0 && t.steps.length > 0);
if (!everyFirstAidHasAvoid) problems.push({ text: "first aid library", reason: "a topic is missing steps or avoid list" });

const everyRedFlagHasGuidance = redFlags.every((f) => f.guidance.trim().length > 20);
if (!everyRedFlagHasGuidance) problems.push({ text: "red flags", reason: "a red flag has no guidance" });

console.log(`cases tested: ${auditCases.length}`);
console.log(`emergency classification correct: ${emergencyCorrect}/${auditCases.length}`);
console.log(`first-aid topics: ${firstAidTopics.length}, red-flag groups: ${redFlags.length}`);
console.log(`problems: ${problems.length}`);
for (const p of problems) console.log(`  - "${p.text}" :: ${p.reason}`);

const ok = problems.length === 0;
console.log(ok ? "AUDIT PASS" : "AUDIT FAIL");
process.exit(ok ? 0 : 1);
