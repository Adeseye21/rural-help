import { detectRedFlag } from "./redflags.js";
import { FIRST_AID_NOTE, firstAidByKey } from "./firstaid.js";

export type Question = {
  id: string;
  text: string;
  options: string[];
};

export type Category = {
  id: string;
  keywords: string[];
  causes: string[];
  questions: Question[];
};

/**
 * Reported instead of plain `fever` + `body_ache` when both are present.
 */
export const FEVER_WITH_BODY_ACHE_ID = "fever_with_body_ache";

export const categories: Category[] = [
  {
    id: "fever",
    keywords: ["fever", "temperature", "hot", "burning up", "chills"],
    causes: [
      "Fever is most often caused by an infection.",
      "It can also be caused by other conditions, so a professional should decide the cause."
    ],
    questions: [
      {
        id: "fever_height",
        text: "How high is the fever?",
        options: ["Low (under 38°C / 100°F)", "High (38–39°C / 100–102°F)", "Very high (above 39°C / 102°F)", "I do not know"]
      },
      {
        id: "fever_duration",
        text: "How long have you had it?",
        options: ["Less than 1 day", "1–3 days", "More than 3 days", "On and off"]
      },
      {
        id: "fever_rash",
        text: "Do you have a stiff neck or a rash?",
        options: ["No", "Stiff neck", "Rash", "Both"]
      }
    ]
  },
  {
    id: "cough",
    keywords: ["cough", "coughing", "sore throat", "cold"],
    causes: [
      "A cough is commonly caused by an infection or irritation in the airways.",
      "Smoke and dust can also cause coughing."
    ],
    questions: [
      {
        id: "cough_duration",
        text: "How long has the cough lasted?",
        options: ["Less than 1 week", "1–2 weeks", "More than 2 weeks"]
      },
      {
        id: "cough_wet",
        text: "Are you coughing up anything?",
        options: ["Nothing", "Clear mucus", "Coloured mucus", "Blood"]
      },
      {
        id: "cough_fever",
        text: "Do you also have a fever?",
        options: ["No", "Yes, mild", "Yes, high"]
      }
    ]
  },
  {
    id: "headache",
    keywords: ["headache", "head pain", "migraine", "head hurts"],
    causes: [
      "Headaches have many possible causes, including stress, dehydration, and illness.",
      "An unusual or very strong headache should be assessed by a professional."
    ],
    questions: [
      {
        id: "headache_onset",
        text: "Did the headache start suddenly?",
        options: ["No, it built up slowly", "Yes, very suddenly", "On and off"]
      },
      {
        id: "headache_bad",
        text: "Is it the worst headache you have had?",
        options: ["No", "Yes"]
      },
      {
        id: "headache_injury",
        text: "Did you hit your head recently?",
        options: ["No", "Yes"]
      }
    ]
  },
  {
    id: "stomach_pain",
    keywords: ["stomach", "belly", "abdominal", "tummy", "stomach ache", "stomach pain"],
    causes: [
      "Stomach pain can have several possible causes, including infection, food, and other conditions.",
      "Severe or worsening pain needs professional assessment."
    ],
    questions: [
      {
        id: "stomach_where",
        text: "Where is the pain?",
        options: ["Upper stomach", "Lower stomach", "All over", "Right side", "Left side"]
      },
      {
        id: "stomach_severity",
        text: "How strong is the pain?",
        options: ["Mild", "Moderate", "Severe", "Getting worse"]
      },
      {
        id: "stomach_vomit",
        text: "Are you vomiting?",
        options: ["No", "Yes, once or twice", "Yes, many times"]
      }
    ]
  },
  {
    id: "diarrhea",
    keywords: ["diarrhea", "diarrhoea", "loose stool", "loose stools", "watery stool"],
    causes: [
      "Diarrhea is often caused by an infection or something you ate.",
      "The main risk is dehydration, so drinking enough water matters."
    ],
    questions: [
      {
        id: "diarrhea_duration",
        text: "How long have you had it?",
        options: ["Less than 1 day", "1–3 days", "More than 3 days"]
      },
      {
        id: "diarrhea_blood",
        text: "Is there blood in the stool?",
        options: ["No", "Yes"]
      },
      {
        id: "diarrhea_thirst",
        text: "Are you very thirsty or urinating less than usual?",
        options: ["No", "Yes, a little", "Yes, a lot"]
      }
    ]
  },
  {
    id: "injury",
    keywords: ["injury", "wound", "cut", "fell", "fall", "burned", "burn", "sprain", "bruise", "bleeding"],
    causes: [
      "An injury may need examination to check for deeper damage.",
      "Keeping the area clean and protected reduces the chance of infection."
    ],
    questions: [
      {
        id: "injury_how",
        text: "How did it happen?",
        options: ["Fall", "Cut or scrape", "Burn", "Hit or struck", "Other"]
      },
      {
        id: "injury_numb",
        text: "Is there numbness, weakness, or bone showing?",
        options: ["No", "Yes"]
      },
      {
        id: "injury_tetanus",
        text: "Is your tetanus vaccination up to date?",
        options: ["Yes", "No", "I do not know"]
      }
    ]
  },
  {
    id: "rash",
    keywords: ["rash", "skin irritation", "itchy skin", "hives", "spots on skin"],
    causes: [
      "A rash can be caused by an allergy, an infection, or skin irritation.",
      "A professional can examine a rash to identify the cause."
    ],
    questions: [
      {
        id: "rash_spread",
        text: "Is the rash spreading quickly?",
        options: ["No", "Yes"]
      },
      {
        id: "rash_other",
        text: "Do you have a fever as well?",
        options: ["No", "Yes"]
      }
    ]
  },
  {
    id: "tiredness",
    keywords: ["tired", "tiredness", "fatigue", "weak", "no energy", "exhausted"],
    causes: [
      "Tiredness has many causes, including illness, poor sleep, and stress.",
      "Long-lasting or unexplained tiredness should be discussed with a professional."
    ],
    questions: [
      {
        id: "tired_duration",
        text: "How long have you felt this way?",
        options: ["A few days", "A few weeks", "More than a month"]
      },
      {
        id: "tired_sleep",
        text: "Are you sleeping enough and resting?",
        options: ["Yes", "No", "Not sure"]
      }
    ]
  },
  {
    id: "body_ache",
    keywords: [
      "body ache",
      "body aches",
      "body pain",
      "body pains",
      "aching body",
      "aches all over",
      "ache all over",
      "paining all over",
      "pain all over",
      "pains all over",
      "muscle ache",
      "muscles ache",
      "muscle pain",
      "muscles pain",
      "joint pain",
      "joints pain",
      "joint ache",
      "aching muscles",
      "aching joints",
      "leg ache",
      "leg pain",
      "legs ache",
      "legs pain",
      "my leg is aching",
      "arm ache",
      "arm pain",
      "arm is aching",
      "shoulder ache",
      "shoulder pain",
      "shoulder is aching",
      "back ache",
      "back pain",
      "back is aching",
      "neck ache",
      "neck is aching",
      "hand ache",
      "hand pain",
      "wrist ache",
      "wrist pain",
      "finger ache",
      "fingers ache",
      "knee ache",
      "knee pain",
      "hip ache",
      "hip pain",
      "foot ache",
      "feet ache",
      "foot pain",
      "feet pain",
      "heel ache",
      "calf ache"
    ],
    causes: [
      "Body aches and joint pains have many possible causes, including infection, inflammation, overwork, or a strain.",
      "Pain in one joint that becomes hot, red, and swollen, or pain after an injury, needs professional assessment."
    ],
    questions: [
      {
        id: "body_ache_where",
        text: "Where does it hurt?",
        options: ["All over my body", "One part only", "My joints", "My muscles"]
      },
      {
        id: "body_ache_duration",
        text: "How long have you had it?",
        options: ["Less than 1 day", "1–3 days", "More than 3 days", "Longer than 1 month"]
      },
      {
        id: "body_ache_swollen",
        text: "Is the sore part swollen, red, or hot to touch?",
        options: ["No", "Yes", "I am not sure"]
      },
      {
        id: "body_ache_move",
        text: "Can you move and use that part normally?",
        options: ["Yes, normally", "Only a little", "No, I cannot move it"]
      }
    ]
  }
];

export type AssessResult = {
  isEmergency: boolean;
  emergencyLabel?: string;
  safetyGuidance?: string;
  matchedKeyword?: string;
  needsSameDayCare?: boolean;
  needsSameDayCareReason?: string;
  firstAid?: {
    key: string;
    title: string;
    whenToUse: string;
    steps: string[];
    avoid: string[];
  };
  categories: string[];
  possibleCauses: string[];
  questions: Question[];
  nextStep: string;
  sources: { title: string; detail: string; kind: "learning" | "service" }[];
  disclaimer: string;
};

export const DISCLAIMER =
  "Rural Help suggestion: this is information, not a diagnosis. A healthcare professional should assess you to determine the cause.";

export const GENERAL_SOURCES = [
  {
    title: "Where to get help now",
    detail: "Ask your community health worker, visit the nearest health facility, or call your local emergency number.",
    kind: "service" as const
  },
  {
    title: "About home care and first aid",
    detail: "Keep a first aid box at home, and write down your medicines, allergies, and ongoing conditions so anyone can help you.",
    kind: "learning" as const
  }
];

export const CATEGORY_LEARN_MORE: Record<string, { label: string; learnMore: string }> = {
  fever: {
    label: "Looking after a fever",
    learnMore:
      "Rest in a cool room, keep drinking fluids, and record your temperature if you can. Seek care if a fever lasts more than three days, if a baby under three months has a fever, or if you have a stiff neck or a rash that does not fade."
  },
  cough: {
    label: "Looking after a cough",
    learnMore:
      "Warm drinks and staying away from smoke can help. Seek care if cough lasts more than 2 weeks, brings up blood, or comes with breathlessness, chest pain, weight loss or night sweats."
  },
  headache: {
    label: "Looking after a headache",
    learnMore:
      "Rest in a quiet dark room, drink water, and take any medicine you already use as advised. Seek care for a sudden severe headache, a headache with weakness or vision change, or one that keeps returning."
  },
  stomach_pain: {
    label: "Looking after stomach pain",
    learnMore:
      "Sips of clean water and rest can help while your stomach settles. Seek care for severe or one-sided pain, pain with a fever, blood in vomit or stool, or vomiting that will not stop."
  },
  diarrhea: {
    label: "Looking after diarrhoea",
    learnMore:
      "Keep drinking small sips of clean water or ORS to replace what you lose. If you have ORS, prepare it with clean water as the packet says. Wash hands after using the toilet and before food. Seek care for blood in stool, high fever, severe tummy pain, or if a child becomes weak or drowsy."
  },
  injury: {
    label: "Caring for a wound",
    learnMore:
      "Clean a wound with clean water and cover it. Do not apply herbs, toothpaste or ash to a wound. Seek care if a bite or dirty wound is involved, if you cannot move or feel a limb, or if bleeding will not stop."
  },
  rash: {
    label: "Looking after a rash",
    learnMore:
      "Keep the skin cool and clean and do not scratch. Seek care if the rash does not fade when pressed, if you have a fever, if it spreads quickly, or if your face or throat swell."
  },
  tiredness: {
    label: "Looking after tiredness",
    learnMore:
      "Sleep, eat regular meals, and drink enough water. Seek care if tiredness lasts more than two weeks, or comes with fever, weight loss, chest pain, or swelling in your legs."
  },
  body_ache: {
    label: "Looking after body aches and joint pain",
    learnMore:
      "Rest the sore part, keep moving gently so the joint does not stiffen, and drink plenty of water. Seek care if one joint becomes hot, red, or swollen, if you cannot move a limb, if a foot or leg feels cold, pale, or numb, or if the pain follows an injury."
  },
  fever_with_body_ache: {
    label: "Fever together with body aches",
    learnMore:
      "Fever with body aches is a common pattern of several different illnesses, and some of them need treatment quickly. A professional can examine you and decide whether a test, such as a malaria test or blood count, is needed. Seek care same-day, and more urgently if you have a stiff neck, a rash that does not fade when pressed, confusion, vomiting that will not stop, difficulty breathing, or if it is a baby, a pregnant person, an older adult, a very frail person, someone with sickle cell disease, or someone who cannot keep fluids down."
  }
};

export function sourcesForCategories(categoryIds: string[]) {
  const extras = categoryIds
    .slice(0, 3)
    .map((id) => CATEGORY_LEARN_MORE[id])
    .filter((v): v is { label: string; learnMore: string } => Boolean(v))
    .map((v) => ({ title: v.label, detail: v.learnMore, kind: "learning" as const }));
  return [...extras, ...GENERAL_SOURCES];
}

export type FirstAidRef = {
  key: string;
  title: string;
  whenToUse: string;
  steps: string[];
  avoid: string[];
};

export function toFirstAid(key: string): FirstAidRef | undefined {
  const topic = firstAidByKey(key);
  if (!topic) return undefined;
  return {
    key: topic.key,
    title: topic.title,
    whenToUse: topic.whenToUse,
    steps: topic.steps,
    avoid: topic.avoid
  };
}

export const DEFAULT_CAUSES = [
  "A symptom like yours can have several possible causes.",
  "A healthcare professional can ask questions and examine you to find the cause."
];

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "general_when",
    text: "When did the problem start?",
    options: ["Today", "This week", "This month", "Longer ago"]
  },
  {
    id: "general_severe",
    text: "Is it getting better, the same, or worse?",
    options: ["Better", "The same", "Worse"]
  }
];

export function assessSymptoms(text: string): AssessResult {
  const flag = detectRedFlag(text.toLowerCase());
  if (flag) {
    const topic = firstAidByKey(flag.firstAid);
    return {
      isEmergency: true,
      emergencyLabel: flag.label,
      safetyGuidance: flag.guidance,
      matchedKeyword: flag.matched,
      firstAid: topic
        ? {
            key: topic.key,
            title: topic.title,
            whenToUse: topic.whenToUse,
            steps: topic.steps,
            avoid: topic.avoid
          }
        : undefined,
      categories: [],
      possibleCauses: [],
      questions: [],
      nextStep:
        "Seek emergency professional care now. Do not delay because of this app. Tell the professional about your symptoms.",
      sources: sourcesForCategories([]),
      disclaimer: FIRST_AID_NOTE
    };
  }

  const matched = categories.filter((cat) => cat.keywords.some((k) => text.toLowerCase().includes(k)));
  const matchedCategories = matched.map((c) => c.id);

  // Fever with body aches is kept as its own, separate answer rather than being
  // merged into either one, because the two together carry more meaning than
  // either alone. The app still does not name a cause.
  const hasFever = matchedCategories.includes("fever");
  const hasBodyAche = matchedCategories.includes("body_ache");
  const isFeverWithBodyAche = hasFever && hasBodyAche;

  if (isFeverWithBodyAche) {
    return {
      isEmergency: false,
      categories: [FEVER_WITH_BODY_ACHE_ID],
      possibleCauses: [
        "Fever with body aches is a common pattern of several different illnesses, and some of them need treatment quickly.",
        "Only a healthcare professional who examines you, and may do a test such as a malaria test or blood count, can tell you which it is. Do not self-treat with antimalarials or antibiotics, and do not take leftover medicine from someone else."
      ],
      questions: [
        {
          id: "fever_ache_days",
          text: "How many days have you had both the fever and the aches?",
          options: ["1 day", "2–3 days", "More than 3 days", "I do not know"]
        },
        {
          id: "fever_ache_medicine",
          text: "Have you already taken any medicine for it?",
          options: ["No", "Yes, and I finished it", "Yes, I am still taking it"]
        }
      ],
      needsSameDayCare: true,
      needsSameDayCareReason: "fever together with body aches",
      nextStep:
        "Fever together with body aches should be checked by a healthcare professional today, ideally with a test. Do not delay because of this app.",
      sources: sourcesForCategories([FEVER_WITH_BODY_ACHE_ID, "fever", "body_ache"]),
      disclaimer: DISCLAIMER
    };
  }

  const causes = matched.length > 0 ? matched.flatMap((c) => c.causes) : DEFAULT_CAUSES;
  const questions = matched.length > 0
    ? matched.flatMap((c) => c.questions).slice(0, 4)
    : DEFAULT_QUESTIONS;

  return {
    isEmergency: false,
    categories: matchedCategories,
    possibleCauses: [...new Set(causes)],
    questions,
    needsSameDayCare: false,
    nextStep: "These symptoms need to be checked so the cause can be found. Consider contact with a healthcare professional or a visit to a facility.",
    sources: sourcesForCategories(matchedCategories),
    disclaimer: DISCLAIMER
  };
}

export type RefineResult = {
  urgency: "routine" | "urgent";
  urgencyReason?: string;
  firstAid?: {
    key: string;
    title: string;
    whenToUse: string;
    steps: string[];
    avoid: string[];
  };
  notes: string[];
  nextStep: string;
  sources: { title: string; detail: string; kind: "learning" | "service" }[];
  disclaimer: string;
};

export function refineSymptoms(categories: string[], answers: Record<string, string>): RefineResult {
  const notes: string[] = [];
  let urgencyReason: string | undefined;
  let firstAidKey: string | undefined;

  const flag = (reason: string, note: string) => {
    urgencyReason = reason;
    notes.push(note);
  };

  if (answers.cough_wet?.trim() === "Blood") {
    flag(
      "blood in what you cough up",
      "Coughing up blood needs urgent assessment by a professional."
    );
  }
  if (answers.headache_bad?.trim() === "Yes") {
    flag(
      "a very severe headache",
      "A headache this strong should be assessed by a professional today."
    );
  }
  if (answers.stomach_severity && ["Severe", "Getting worse"].includes(answers.stomach_severity.trim())) {
    flag(
      "severe or worsening stomach pain",
      "Severe or worsening stomach pain should be assessed urgently."
    );
  }
  if (answers.diarrhea_blood?.trim() === "Yes") {
    flag(
      "blood in the stool",
      "Blood in the stool needs professional assessment."
    );
  }
  if (answers.fever_rash && ["Stiff neck", "Rash", "Both"].includes(answers.fever_rash.trim())) {
    flag(
      "a stiff neck or rash with fever",
      "A stiff neck or rash together with fever needs urgent assessment."
    );
  }
  if (answers.fever_height?.trim() === "Very high (above 39°C / 102°F)") {
    flag(
      "a very high fever",
      "A very high fever should be assessed by a professional."
    );
  }
  if (answers.injury_numb?.trim() === "Yes") {
    flag(
      "numbness or weakness after an injury",
      "Numbness, weakness, or a visible bone after an injury needs urgent assessment."
    );
  }
  if (answers.injury_tetanus && ["No", "I do not know"].includes(answers.injury_tetanus.trim())) {
    notes.push(
      "If your tetanus vaccination is not up to date, a professional may recommend a booster for injuries."
    );
  }
  if (answers.rash_spread?.trim() === "Yes") {
    flag(
      "a rash that is spreading quickly",
      "A rash spreading quickly should be seen by a professional."
    );
    firstAidKey = "allergic_reaction";
  }
  if (answers.diarrhea_thirst?.trim() === "Yes, a lot") {
    notes.push(
      "Drink water regularly. If you become very thirsty or urinate very little, you may need professional care."
    );
    firstAidKey = "dehydration";
  }
  if (answers.injury_how?.trim() === "Burn") {
    firstAidKey = "burns";
  } else if (categories.includes("injury")) {
    firstAidKey = "fracture";
  }
  if (answers.fever_duration && ["1–3 days", "More than 3 days"].includes(answers.fever_duration.trim())) {
    notes.push("A fever lasting more than a day or two is worth getting checked.");
  }
  if (answers.cough_duration?.trim() === "More than 2 weeks") {
    notes.push("A cough lasting more than two weeks should be assessed by a professional.");
  }
  if (categories.includes(FEVER_WITH_BODY_ACHE_ID)) {
    flag(
      "fever together with body aches",
      "Fever with body aches needs to be checked by a professional today, ideally with a test such as a malaria test or blood count."
    );
    if (["2–3 days", "More than 3 days", "I do not know"].includes(answers.fever_ache_days?.trim() ?? "")) {
      notes.push(
        "Follow the instructions given by the prescribing healthcare professional. Do not change or stop prescribed treatment without appropriate advice. If symptoms worsen or fail to improve or you experience concerning side effects, seek professional assessment."
      );
    }
    if (answers.fever_ache_medicine?.trim() === "Yes, I am still taking it") {
      notes.push(
        "Do not take leftover medicine meant for someone else, and tell the professional which medicine and dose you are using."
      );
    } else if (answers.fever_ache_medicine?.trim() === "Yes, and I finished it") {
      notes.push(
        "Tell the professional which medicine you took and when it finished, because that changes what they should check next."
      );
    }
  }
  if (answers.body_ache_swollen?.trim() === "Yes") {
    flag(
      "a swollen, red, or hot painful part",
      "A painful part that is swollen, red, or hot needs urgent assessment today, especially if it is a joint."
    );
    firstAidKey = "fracture";
  }
  if (answers.body_ache_move?.trim() === "No, I cannot move it") {
    flag(
      "a limb you cannot move",
      "Not being able to move or use that part needs urgent assessment. Do not force it."
    );
    firstAidKey = "fracture";
  }
  if (answers.body_ache_duration?.trim() === "Longer than 1 month") {
    flag(
      "body or joint pain lasting over a month",
      "Pain that lasts more than a month should be assessed by a professional so the cause can be found and treated."
    );
  }

  const urgency: "routine" | "urgent" = urgencyReason ? "urgent" : "routine";

  const nextStep =
    urgency === "urgent"
      ? "Please contact a healthcare professional today. Do not delay because of this app."
      : "These symptoms need to be checked so the cause can be found. Consider contact with a healthcare professional or a visit to a facility.";

  return {
    urgency,
    urgencyReason,
    firstAid: firstAidKey ? toFirstAid(firstAidKey) : undefined,
    notes: [...new Set(notes)],
    nextStep,
    sources: sourcesForCategories(categories),
    disclaimer: DISCLAIMER
  };
}
