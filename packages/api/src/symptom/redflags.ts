export type RedFlag = {
  keywords: string[];
  label: string;
  guidance: string;
};

export const redFlags: RedFlag[] = [
  {
    keywords: ["chest pain", "chest pressure", "crushing chest", "tightness in chest"],
    label: "severe chest pain",
    guidance:
      "Severe chest pain could be a sign of a heart problem. Do not wait — get emergency professional care now."
  },
  {
    keywords: ["cannot breathe", "can't breathe", "difficulty breathing", "short of breath", "struggling to breathe", "breathing fast"],
    label: "difficulty breathing",
    guidance:
      "Difficulty breathing is a serious warning sign. Get emergency professional care now."
  },
  {
    keywords: ["unconscious", "not waking up", "won't wake", "unresponsive", "collapse", "collapsed"],
    label: "unconsciousness",
    guidance:
      "An unresponsive person needs emergency professional care immediately. Do not delay."
  },
  {
    keywords: ["seizure", "fitting", "convulsion", "convulsing"],
    label: "seizure",
    guidance:
      "A seizure can be serious. Call for emergency professional care and keep the person safe from injury."
  },
  {
    keywords: ["heavy bleeding", "bleeding heavily", "won't stop bleeding", "bleeding out", "profuse bleeding"],
    label: "heavy bleeding",
    guidance:
      "Heavy bleeding needs urgent professional care. Apply firm pressure and get emergency help now."
  },
  {
    keywords: ["swollen face", "swollen lips", "swollen tongue", "throat swollen", "allergic reaction"],
    label: "severe allergic reaction",
    guidance:
      "Swelling of the face, lips, or tongue can be a severe allergic reaction. Get emergency professional care now."
  },
  {
    keywords: ["slurred speech", "face drooping", "drooping face", "weak arm", "weakness on one side", "sudden confusion"],
    label: "possible stroke signs",
    guidance:
      "Sudden weakness, drooping, or slurred speech can be signs of a stroke. Get emergency professional care now."
  },
  {
    keywords: ["poisoned", "poisoning", "swallowed poison", "overdose"],
    label: "poisoning",
    guidance:
      "Poisoning is an emergency. Get emergency professional care now and, if possible, tell the professional what was taken."
  },
  {
    keywords: ["suicidal", "want to end my life", "kill myself", "hurt myself on purpose", "self harm"],
    label: "thoughts of self-harm",
    guidance:
      "Please speak with a professional now. You deserve help — contact a healthcare professional or emergency service immediately."
  },
  {
    keywords: ["blood in vomit", "vomiting blood", "blood in stool", "bloody stool", "coughing blood"],
    label: "serious bleeding",
    guidance:
      "Blood in vomit or stool can be serious. Get professional assessment as an emergency."
  }
];

export type RedFlagMatch = RedFlag & { matched: string };

export function detectRedFlag(text: string): RedFlagMatch | null {
  const lower = text.toLowerCase();
  for (const flag of redFlags) {
    for (const keyword of flag.keywords) {
      if (lower.includes(keyword)) {
        return { ...flag, matched: keyword };
      }
    }
  }
  return null;
}