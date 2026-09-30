export type RedFlag = {
  keywords: string[];
  label: string;
  firstAid: string;
  guidance: string;
};

export const redFlags: RedFlag[] = [
  {
    keywords: ["chest pain", "chest pressure", "crushing chest", "tightness in chest"],
    label: "severe chest pain",
    firstAid: "chest_pain",
    guidance:
      "Severe chest pain could be a sign of a heart problem. Do not wait — get emergency professional care now."
  },
  {
    keywords: [
      "cannot breathe",
      "can't breathe",
      "cannot get air",
      "gasping",
      "difficulty breathing",
      "trouble breathing",
      "struggling to breathe",
      "struggling for breath",
      "blue lips",
      "lips are blue",
      "chest pain when i breathe"
    ],
    label: "difficulty breathing",
    firstAid: "breathing",
    guidance:
      "Difficulty breathing is a serious warning sign. Get emergency professional care now."
  },
  {
    keywords: ["unconscious", "not waking up", "won't wake", "unresponsive", "collapse", "collapsed"],
    label: "unconsciousness",
    firstAid: "unconscious",
    guidance:
      "An unresponsive person needs emergency professional care immediately. Do not delay."
  },
  {
    keywords: ["seizure", "fitting", "convulsion", "convulsing"],
    label: "seizure",
    firstAid: "seizure",
    guidance:
      "A seizure can be serious. Call for emergency professional care and keep the person safe from injury."
  },
  {
  keywords: [
    "heavy bleeding",
    "bleeding heavily",
    "won't stop bleeding",
    "will not stop bleeding",
    "bleeding out",
    "profuse bleeding",
    "bleeding that will not stop",
    "blood will not stop",
    "blood is not stopping",
    "still bleeding",
    "bleeding a lot",
    "lots of blood",
    "blood everywhere",
    "soaking blood"
  ],
    label: "heavy bleeding",
    firstAid: "bleeding",
    guidance:
      "Heavy bleeding needs urgent professional care. Apply firm pressure and get emergency help now."
  },
  {
    keywords: [
      "swollen face",
      "face is swollen",
      "swollen lips",
      "swelling of the lips",
      "swollen tongue",
      "tongue is swollen",
      "throat swollen",
      "throat is closing",
      "throat is swelling",
      "cannot breathe through my throat",
      "face swelling",
      "allergic reaction",
      "anaphylaxis",
      "hives all over"
    ],
    label: "severe allergic reaction",
    firstAid: "allergic_reaction",
    guidance:
      "Swelling of the face, lips, or tongue can be a severe allergic reaction. Get emergency professional care now."
  },
  {
    keywords: [
      "slurred speech",
      "cannot speak properly",
      "face drooping",
      "drooping face",
      "face is drooping",
      "one side of my face",
      "side of my face is",
      "weak arm",
      "arm is weak",
      "cannot lift my arm",
      "weakness on one side",
      "one side is weak",
      "sudden weakness",
      "sudden confusion",
      "cannot speak",
      "speech is slurred",
      "sudden blurred vision",
      "sudden blindness"
    ],
    label: "possible stroke signs",
    firstAid: "stroke",
    guidance:
      "Sudden weakness, drooping, or slurred speech can be signs of a stroke. Get emergency professional care now."
  },
  {
    keywords: [
      "poisoned",
      "poisoning",
      "swallowed poison",
      "ate poison",
      "drank poison",
      "drank bleach",
      "drank kerosene",
      "chemical on my skin",
      "chemical I drank",
      "swallowed a chemical",
      "swallowed chemical",
      "swallowed something",
      "ate something toxic",
      "overdose",
      "overdose on",
      "took too many",
      "took a whole packet",
      "took the whole packet",
      "took many tablets",
      "swallowed tablets",
      "ate a bunch of tablets",
      "took all the"
    ],
    label: "poisoning",
    firstAid: "poisoning",
    guidance:
      "Poisoning is an emergency. Get emergency professional care now and, if possible, tell the professional what was taken."
  },
  {
    keywords: ["suicidal", "want to end my life", "kill myself", "hurt myself on purpose", "self harm"],
    label: "thoughts of self-harm",
    firstAid: "distress",
    guidance:
      "Please speak with a professional now. You deserve help — contact a healthcare professional or emergency service immediately."
  },
  {
    keywords: [
      "blood in vomit",
      "vomiting blood",
      "threw up blood",
      "blood in stool",
      "bloody stool",
      "blood in my stool",
      "bleeding when I poop",
      "coughing blood",
      "coughed up blood",
      "coughing up blood",
      "blood when I cough",
      "blood in my sputum",
      "bleeding from my nose that will not stop",
      "nose bleed that will not stop",
      "nose bleeding will not stop",
      "blood in my nose",
      "blood in my urine",
      "peeing blood"
    ],
    label: "serious bleeding",
    firstAid: "bleeding",
    guidance:
      "Blood in vomit or stool can be serious. Get professional assessment as an emergency."
  },
  {
    keywords: [
      "about to faint",
      "feeling faint",
      "feel faint",
      "about to pass out",
      "passed out",
      "blacked out",
      "fainted",
      "fainting",
      "dizzy and about to",
      "vision went black",
      "nearly fainted"
    ],
    label: "fainting or collapse warning",
    firstAid: "unconscious",
    guidance:
      "Feeling close to fainting, or having fainted, needs professional assessment. Lie down, and get professional care now — urgent if it does not settle."
  },
  {
    keywords: [
      "pregnant and bleeding",
      "bleeding while pregnant",
      "bleeding in pregnancy",
      "pregnancy bleeding",
      "bleeding and i am pregnant",
      "i am pregnant and bleeding",
      "bleeding when pregnant",
      "bleeding and pregnant",
      "water coming out of my belly",
      "water coming out of my pregnant belly",
      "my water broke",
      "waters broke",
      "water has broken",
      "fluid coming from my vagina",
      "leaking fluid from my belly",
      "belly is leaking fluid",
      "baby is not moving",
      "baby has stopped moving",
      "no movements from the baby",
      "baby not moving",
      "i am pregnant and bleeding heavily"
    ],
    label: "pregnancy emergency",
    firstAid: "bleeding",
    guidance:
      "Bleeding, leaking fluid, or reduced movement during pregnancy needs emergency professional care now. Do not wait."
  }
];

export type RedFlagMatch = RedFlag & { matched: string };

const FILLER_WORDS = /\b(is|are|was|were|am|be|been|being|the|a|an|my|me|i|we|our|of|to|that|it|its|and|so|very|really)\b/g;

export function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(FILLER_WORDS, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectRedFlag(text: string): RedFlagMatch | null {
  const lower = text.toLowerCase();
  const normalized = normalizeForMatching(text);

  for (const flag of redFlags) {
    for (const keyword of flag.keywords) {
      if (lower.includes(keyword)) {
        return { ...flag, matched: keyword };
      }
      const normalizedKeyword = normalizeForMatching(keyword);
      if (normalizedKeyword.length >= 4 && normalized.includes(normalizedKeyword)) {
        return { ...flag, matched: keyword };
      }
    }
  }
  return null;
}