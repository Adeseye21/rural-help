import { explainDocument } from "../src/document/explainer.js";

const cases: { name: string; text: string }[] = [
  {
    name: "malaria + hb + bp",
    text: "MALARIA PARASITE TEST\nResult: Positive\nHaemoglobin: 9.8 g/dL\nBlood pressure: 145/95"
  },
  { name: "hb only", text: "Haemoglobin: 9.8 g/dL\nMCV 74 fL" },
  { name: "bp only", text: "Blood pressure 145/95 mmHg" },
  { name: "glucose only", text: "Blood glucose 140 mg/dL" },
  { name: "widal only", text: "Widal test: significant" },
  { name: "unrelated note", text: "Visit clinic on Monday. Bring your card." },
  { name: "hiv only", text: "HIV test result: reactive" },
  { name: "urine only", text: "Urine protein: trace" }
];

for (const c of cases) {
  const r = explainDocument(c.text);
  console.log(
    `${c.name} -> [${r.matched.map((m) => m.testName).join(" | ")}] unmatched=${r.unmatchedLines.length}`
  );
}
