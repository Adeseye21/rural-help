import { assessSymptoms, refineSymptoms, sourcesForCategories } from "../src/symptom/engine.js";
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

/**
 * Names like "malaria" or "typhoid" are allowed when the copy is pointing at a
 * test a professional might order. What must never appear is the app telling
 * the patient that they have one.
 */
const DIAGNOSIS_ASSERTION =
  /\b(you have|you are suffering from|you may have|this is|it is|its is|must be|diagnosed with|confirmed|you definitely have|it must be)\s+(malaria|typhoid|covid|asthma|diabetes|ulcer|hiv|tuberculosis|cholera|anaemia|sepsis|a stroke|a heart attack)\b/i;

function assertsDiagnosis(payload: string): boolean {
  return DIAGNOSIS_ASSERTION.test(payload);
}

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
  if (assertsDiagnosis(all)) {
    problems.push({ text: c.text, reason: "asserts a diagnosis in output" });
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
    const advicePrefix =
      /^(keeping|the main risk|drink|rest|keep|wash|cover|avoid|do not|don't|use|clean|seek|contact|apply|gently|eat|sleep|clean|protect|record|write down)/i;
    const hedge =
      /can|may|might|often|usually|sometimes|possible|most|commonly|many|another|one of|other|should|professional/i;
    const unhedged = r.possibleCauses.filter((x) => !advicePrefix.test(x.trim()) && !hedge.test(x));
    if (unhedged.length > 0) {
      problems.push({ text: c.text, reason: `cause without hedging language: "${unhedged[0]}"` });
    }
  }

  const refined = refineSymptoms(r.categories, { fever_duration: "More than 3 days", cough_duration: "More than 2 weeks" });
  if (!refined.disclaimer) problems.push({ text: c.text, reason: "refine missing disclaimer" });
  if (refined.urgency === "urgent" && !refined.urgencyReason) {
    problems.push({ text: c.text, reason: "urgent result without a reason" });
  }
}

const everyFirstAidHasAvoid = firstAidTopics.every((t) => t.avoid.length > 0 && t.steps.length > 0);
if (!everyFirstAidHasAvoid) problems.push({ text: "first aid library", reason: "a topic is missing steps or avoid list" });

const everyRedFlagHasGuidance = redFlags.every((f) => f.guidance.trim().length > 20);
if (!everyRedFlagHasGuidance) problems.push({ text: "red flags", reason: "a red flag has no guidance" });

// Body ache must stay its own answer, and fever + body ache must be a third
// separate answer rather than being merged into either one.
const acheOnly = assessSymptoms("I have leg ache");
if (!acheOnly.categories.includes("body_ache")) {
  problems.push({ text: "I have leg ache", reason: `body ache not detected: ${acheOnly.categories}` });
}
if (acheOnly.categories.includes("fever")) {
  problems.push({ text: "I have leg ache", reason: "body ache wrongly matched fever" });
}
if (acheOnly.needsSameDayCare === true) {
  problems.push({ text: "I have leg ache", reason: "body ache alone should not demand same-day care" });
}

const feverOnly = assessSymptoms("I have a fever");
if (!feverOnly.categories.includes("fever") || feverOnly.categories.includes("body_ache")) {
  problems.push({ text: "I have a fever", reason: `fever changed: ${feverOnly.categories}` });
}

const both = assessSymptoms("I have a fever and body ache all over");
if (both.categories[0] !== "fever_with_body_ache") {
  problems.push({
    text: "fever and body ache",
    reason: `expected fever_with_body_ache first, got ${both.categories}`
  });
}
if (!both.needsSameDayCare) {
  problems.push({ text: "fever and body ache", reason: "combination is not flagged for same-day care" });
}
if (assertsDiagnosis(JSON.stringify(both))) {
  problems.push({ text: "fever and body ache", reason: "asserts a diagnosis in output" });
}

const refinedCombo = refineSymptoms(["fever_with_body_ache"], {
  fever_ache_days: "More than 3 days",
  fever_ache_medicine: "Yes, I am still taking it"
});
if (refinedCombo.urgency !== "urgent") {
  problems.push({ text: "fever and body ache", reason: "refine did not raise urgency" });
}
if (assertsDiagnosis(JSON.stringify(refinedCombo))) {
  problems.push({ text: "fever and body ache", reason: "refine asserts a diagnosis" });
}

const refinedAche = refineSymptoms(["body_ache"], {
  body_ache_where: "My joints",
  body_ache_swollen: "Yes"
});
if (refinedAche.urgency !== "urgent") {
  problems.push({ text: "swollen joint", reason: "hot/swollen joint did not raise urgency" });
}

// Clinician-approved copy, pinned so no future edit can silently weaken it.
// Each assertion below traces to a reviewer verdict (R1–R4).
function pinCopy(name: string, haystack: string, needle: string): void {
  if (!haystack.includes(needle)) {
    problems.push({ text: name, reason: `approved wording missing: "${needle.slice(0, 60)}…"` });
  }
}

const bothJson = JSON.stringify(both);
pinCopy("fever with body aches", bothJson, "Do not self-treat with antimalarials or antibiotics");
pinCopy("fever with body aches", bothJson, "sickle cell disease");
pinCopy("fever with body aches", bothJson, "cannot keep fluids down");
pinCopy("fever with body aches", bothJson, "does not fade when pressed");

const coughLearn = sourcesForCategories(["cough"]);
pinCopy("cough guidance", JSON.stringify(coughLearn), "more than 2 weeks");
pinCopy("cough guidance", JSON.stringify(coughLearn), "night sweats");

const refinedComboJson = JSON.stringify(refinedCombo);
pinCopy("fever with body aches refine", refinedComboJson, "Do not change or stop prescribed treatment");
if (/stop treatment early even if you start to feel better/.test(refinedComboJson)) {
  problems.push({ text: "fever with body aches refine", reason: "unsafe superseded advice still present" });
}

const seizureFlag = redFlags.find((f) => f.label === "seizure");
pinCopy("seizure guidance", seizureFlag?.guidance ?? "", "lasts more than 5 minutes");
const faintFlag = redFlags.find((f) => f.label === "fainting or collapse warning");
pinCopy("fainting guidance", faintFlag?.guidance ?? "", "Lie flat, raise legs if possible");

const seizureAid = firstAidTopics.find((t) => t.key === "seizure");
pinCopy("seizure first aid", JSON.stringify(seizureAid), "Do not pour water on the patient");
const burnsAid = firstAidTopics.find((t) => t.key === "burns");
pinCopy("burns first aid", JSON.stringify(burnsAid), "charcoal");
pinCopy("burns first aid", JSON.stringify(burnsAid), "eggs");
const fractureAid = firstAidTopics.find((t) => t.key === "fracture");
pinCopy("fracture first aid", JSON.stringify(fractureAid), "compression");
const dehydAid = firstAidTopics.find((t) => t.key === "dehydration");
pinCopy("dehydration first aid", JSON.stringify(dehydAid), "concentrated urine");
pinCopy("dehydration first aid", JSON.stringify(dehydAid), "Continue breastfeeding for infants");
const heatAid = firstAidTopics.find((t) => t.key === "heat");
pinCopy("heat first aid", JSON.stringify(heatAid), "cool aggressively");
const chokingAid = firstAidTopics.find((t) => t.key === "choking");
pinCopy("choking first aid", JSON.stringify(chokingAid), "chest thrusts");
const distressAid = firstAidTopics.find((t) => t.key === "distress");
pinCopy("distress first aid", JSON.stringify(distressAid), "112");

const diarrheaLearn = sourcesForCategories(["diarrhea"]);
pinCopy("diarrhoea guidance", JSON.stringify(diarrheaLearn), "as the packet says");
pinCopy("diarrhoea guidance", JSON.stringify(diarrheaLearn), "Wash hands after using the toilet");
const injuryLearn = sourcesForCategories(["injury"]);
pinCopy("wound guidance", JSON.stringify(injuryLearn), "Do not apply herbs, toothpaste or ash");

console.log(`cases tested: ${auditCases.length}`);
console.log(`emergency classification correct: ${emergencyCorrect}/${auditCases.length}`);
console.log(`first-aid topics: ${firstAidTopics.length}, red-flag groups: ${redFlags.length}`);
console.log(`problems: ${problems.length}`);
for (const p of problems) console.log(`  - "${p.text}" :: ${p.reason}`);

const ok = problems.length === 0;
console.log(ok ? "AUDIT PASS" : "AUDIT FAIL");
process.exit(ok ? 0 : 1);
