export type DocumentPattern = {
  id: string;
  documentType: string;
  testName: string;
  plainMeaning: string;
  whyItMatters: string;
  normalRange: string;
  concerningWhen: string;
  clarify: string;
};

export const documentPatterns: DocumentPattern[] = [
  {
    id: "hemoglobin",
    documentType: "lab report",
    testName: "Haemoglobin (Hb) / Hemoglobin",
    plainMeaning: "Haemoglobin carries oxygen around your body. A low level means your blood is carrying less oxygen than it should.",
    whyItMatters: "It is one of the main tests used to check for anaemia.",
    normalRange: "Often around 11 to 16 g/dL for adults, but the range depends on age, pregnancy, and sex.",
    concerningWhen: "A low result can cause tiredness, dizziness, and breathlessness on effort.",
    clarify: "Ask a healthcare professional whether you need treatment or extra iron, and whether you should repeat the test."
  },
  {
    id: "wbc",
    documentType: "lab report",
    testName: "White blood cell count (WBC)",
    plainMeaning: "White blood cells help fight infection. The count shows how many are in your blood.",
    whyItMatters: "It helps suggest whether the body is fighting an infection.",
    normalRange: "Roughly 4,000 to 11,000 cells per microlitre for most adults.",
    concerningWhen: "A high count often goes with infection or inflammation. A low count means fewer defences.",
    clarify: "Ask what the result means together with your symptoms, because one number alone does not show what is wrong."
  },
  {
    id: "malaria",
    documentType: "test result",
    testName: "Malaria parasite test / Rapid diagnostic test",
    plainMeaning: "This test checks whether malaria parasites were found in your blood.",
    whyItMatters: "If positive, malaria treatment is usually needed quickly.",
    normalRange: "Negative means no parasites were seen.",
    concerningWhen: "A positive result needs treatment advised by a professional, and fever with malaria still needs monitoring.",
    clarify: "Ask how to take the treatment correctly and what to do if the fever does not settle after completing it."
  },
  {
    id: "glucose",
    documentType: "lab report",
    testName: "Blood glucose / Blood sugar",
    plainMeaning: "Blood glucose measures sugar in your blood. It tells whether your body is handling sugar normally.",
    whyItMatters: "High readings over time can mean diabetes.",
    normalRange: "Fasting is often 70 to 99 mg/dL. Ranges vary by laboratory and pregnancy status.",
    concerningWhen: "Very high readings with thirst and passing a lot of urine need prompt professional review.",
    clarify: "Ask whether you need a repeat test, a glucose tolerance test, or treatment."
  },
  {
    id: "blood_pressure",
    documentType: "vital signs",
    testName: "Blood pressure",
    plainMeaning: "Blood pressure measures how hard your blood pushes against your blood vessels.",
    whyItMatters: "High blood pressure often has no symptoms but increases risk of stroke and heart problems.",
    normalRange: "Around 120 over 80 mmHg is often considered normal for adults.",
    concerningWhen: "Around 180 over 120 or higher, especially with chest pain, breathlessness, weakness, or vision change, is an emergency.",
    clarify: "Ask whether your reading needs treatment and how often to have it checked."
  },
  {
    id: "urine",
    documentType: "lab report",
    testName: "Urine test (protein, blood, sugar)",
    plainMeaning: "A urine test looks for substances that are not normally in urine, such as protein, blood, or sugar.",
    whyItMatters: "It can show infection, kidney problems, or diabetes.",
    normalRange: "Normally no protein, blood, or sugar.",
    concerningWhen: "Blood or protein in urine needs follow-up, especially with swelling or fever.",
    clarify: "Ask whether further testing is needed and whether you should drink more water."
  },
  {
    id: "pregnancy",
    documentType: "test result",
    testName: "Pregnancy test / Urine hCG",
    plainMeaning: "This test looks for a hormone that is present during pregnancy.",
    whyItMatters: "It tells you whether you may be pregnant, which changes which medicines are safe.",
    normalRange: "A negative result means the hormone was not detected.",
    concerningWhen: "If the test is positive and you have pain or bleeding, you need professional care urgently.",
    clarify: "Ask which medicines and activities are safe, and where to go for antenatal care."
  },
  {
    id: "typhoid",
    documentType: "test result",
    testName: "Widal test / Typhoid test",
    plainMeaning: "These tests look for signs of a typhoid infection in the blood.",
    whyItMatters: "Typhoid can cause prolonged fever and needs the right treatment.",
    normalRange: "A negative or non-significant result is generally reassuring, but tests are not always conclusive.",
    concerningWhen: "Prolonged fever with stomach pain or tiredness needs professional assessment regardless of the result.",
    clarify: "Ask whether treatment is needed and how soon you should be reassessed."
  },
  {
    id: "hiv",
    documentType: "test result",
    testName: "HIV test",
    plainMeaning: "This test looks for the HIV virus in your blood.",
    whyItMatters: "Knowing your status allows treatment that keeps you healthy.",
    normalRange: "A negative result is called non-reactive.",
    concerningWhen: "A reactive result needs confirmatory testing and counselling with a professional.",
    clarify: "Ask about confirmatory testing and counselling. You can ask for your result privately."
  }
];

export type ExplanationItem = {
  testName: string;
  plainMeaning: string;
  whyItMatters: string;
  normalRange: string;
  concerningWhen: string;
};

export type ExplainResult = {
  documentType: string;
  matched: {
    testName: string;
    excerpt: string;
    plainMeaning: string;
    whyItMatters: string;
    normalRange: string;
    concerningWhen: string;
  }[];
  unmatchedLines: string[];
  generalExplanation: string;
  clarifyWithProfessional: string[];
  disclaimer: string;
};

const DISCLAIMER =
  "Rural Help suggestion: this is an explanation of words on a document, not an interpretation of your results. Only a healthcare professional can say what the results mean for you.";

const GENERAL =
  "This page explains common words that appear on health documents. It does not tell you what is wrong with you.";

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ");
}

function findExcerpt(haystack: string, needle: string): string | null {
  const terms = needle
    .split(/[/\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 3);
  if (terms.length === 0) return null;
  const lower = haystack.toLowerCase();
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(haystack.length, idx + 60);
      return haystack.slice(start, end).trim();
    }
  }
  return null;
}

const GENERIC_TOKENS = new Set([
  "test",
  "blood",
  "count",
  "result",
  "report",
  "urine",
  "cell",
  "testName".toLowerCase()
]);

/**
 * A match only counts when a distinctive part of the test name appears.
 * Requiring one generic word on its own ("blood", "urine") produced false
 * positives, which would tell a patient their document contains a test it
 * does not.
 */
function distinctiveHit(normalisedDoc: string, testName: string): boolean {
  const phrases = testName
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const phrase of phrases) {
    const words = normalise(phrase).split(" ").filter((w) => w.length > 2);
    const distinctive = words.filter((w) => !GENERIC_TOKENS.has(w));
    if (distinctive.length === 0) continue;
    if (distinctive.some((w) => normalisedDoc.includes(w))) return true;
    if (words.length > 1 && words.every((w) => normalisedDoc.includes(w))) return true;
  }
  return false;
}

export function explainDocument(rawText: string): ExplainResult {
  const normalised = normalise(rawText);
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const matched: ExplainResult["matched"] = [];

  for (const pattern of documentPatterns) {
    if (!distinctiveHit(normalised, pattern.testName)) continue;
    const excerpt = findExcerpt(rawText, pattern.testName) ?? rawText.slice(0, 120).trim();
    matched.push({
      testName: pattern.testName,
      excerpt,
      plainMeaning: pattern.plainMeaning,
      whyItMatters: pattern.whyItMatters,
      normalRange: pattern.normalRange,
      concerningWhen: pattern.concerningWhen
    });
  }

  const clarifyWithProfessional = matched.length > 0
    ? matched.map((m) => {
        const pattern = documentPatterns.find((p) => p.testName === m.testName)!;
        return pattern.clarify;
      })
    : [
        "Bring this document to a healthcare professional and ask them to explain the results with you.",
        "Ask which numbers on this document need action and which are normal for you."
      ];

  const matchedNames = new Set(matched.map((m) => m.testName));

  const unmatchedLines = lines
    .filter((line) => {
      const n = normalise(line);
      if (n.length < 3) return false;
      return !documentPatterns.some((p) => {
        const hit = distinctiveHit(n, p.testName);
        return hit || matchedNames.has(p.testName);
      });
    })
    .slice(0, 8);

  return {
    documentType: matched.length > 0 ? matched[0].testName : "health document",
    matched,
    unmatchedLines,
    generalExplanation: GENERAL,
    clarifyWithProfessional,
    disclaimer: DISCLAIMER
  };
}
