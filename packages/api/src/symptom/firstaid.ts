export type FirstAidTopic = {
  key: string;
  title: string;
  whenToUse: string;
  steps: string[];
  avoid: string[];
};

export const FIRST_AID_NOTE =
  "Rural Help suggestion: this is basic first-aid information. It does not replace training or professional care. In an emergency, get professional help first.";

export const firstAidTopics: FirstAidTopic[] = [
  {
    key: "bleeding",
    title: "Severe bleeding",
    whenToUse: "Blood is spurting, flowing heavily, or will not stop.",
    steps: [
      "Press firmly on the wound with a clean cloth or gauze and keep pressing without lifting it.",
      "If blood soaks through, add another cloth on top. Do not remove the first one.",
      "Lay the person down and raise the injured area above the body if this does not hurt more.",
      "Keep the person warm and calm while help is on the way."
    ],
    avoid: [
      "Do not pull out an object stuck in the wound — press around it instead.",
      "Do not wash or push anything into a deep wound."
    ]
  },
  {
    key: "breathing",
    title: "Difficulty breathing",
    whenToUse: "The person cannot breathe normally, is gasping, or has blue lips.",
    steps: [
      "Help the person sit upright in the position that makes breathing easiest.",
      "Loosen tight clothing around the neck, chest, and waist.",
      "Keep them calm and stay with them.",
      "Get emergency professional care now."
    ],
    avoid: [
      "Do not lay a person with breathing difficulty flat on their back.",
      "Do not give food or drink to someone struggling to breathe."
    ]
  },
  {
    key: "chest_pain",
    title: "Severe chest pain",
    whenToUse: "Chest pain is severe, crushing, or spreading to the arm, jaw, or back.",
    steps: [
      "Stop all activity and sit the person upright.",
      "Keep them calm and still.",
      "Do not let them drive themselves.",
      "Get emergency professional care now."
    ],
    avoid: ["Do not wait to see if the pain improves on its own."]
  },
  {
    key: "unconscious",
    title: "Unresponsive person",
    whenToUse: "The person does not respond to a loud voice or a gentle shake.",
    steps: [
      "Shout for help and check for a response.",
      "Turn them onto their side if they are breathing, so they do not choke.",
      "If they are not breathing normally, begin chest compressions if you are trained to.",
      "Get emergency professional care immediately."
    ],
    avoid: [
      "Do not give food, drink, or medicine to someone who is not awake.",
      "Do not leave an unresponsive person alone."
    ]
  },
  {
    key: "seizure",
    title: "Seizure (fitting)",
    whenToUse: "The person is shaking, stiffening, or is not responding for a short time.",
    steps: [
      "Clear the area around the person and cushion their head with something soft.",
      "Note the time the seizure started.",
      "Stay with them until the shaking stops.",
      "When it stops, turn them onto their side and get professional care."
    ],
    avoid: [
      "Do not hold the person down or restrain their movements.",
      "Do not put anything in their mouth.",
      "Do not give water or food until they are fully alert."
    ]
  },
  {
    key: "stroke",
    title: "Possible stroke",
    whenToUse: "Sudden face drooping, arm weakness, slurred speech, or sudden confusion.",
    steps: [
      "Note the exact time the signs started and tell the healthcare professional.",
      "Get emergency professional care now.",
      "Keep the person calm, sitting up, and comfortable.",
      "Stay with them until help arrives."
    ],
    avoid: ["Do not give food, drink, or medicine."]
  },
  {
    key: "allergic_reaction",
    title: "Severe allergic reaction",
    whenToUse: "Swelling of the face, lips, or tongue, or trouble breathing after an allergen.",
    steps: [
      "If the person has a prescribed auto-injector, help them use it.",
      "Get emergency professional care now.",
      "Lay them down with legs raised, unless breathing is difficult.",
      "Stay with them and tell responders what happened."
    ],
    avoid: ["Do not wait to see if the swelling goes down by itself."]
  },
  {
    key: "burns",
    title: "Burns",
    whenToUse: "Skin is burned by heat, chemicals, or sun.",
    steps: [
      "Cool the burn under clean, cool running water for 20 minutes.",
      "Remove jewellery or loose clothing near the burn, unless stuck to the skin.",
      "Cover loosely with cling film or a clean cloth.",
      "Get professional care for anything larger than the size of a coin, or for deep burns."
    ],
    avoid: [
      "Do not apply butter, ash, oil, toothpaste, or ice.",
      "Do not burst blisters."
    ]
  },
  {
    key: "fracture",
    title: "Broken bone or serious injury",
    whenToUse: "After a fall, the limb looks wrong, or there is severe pain and swelling.",
    steps: [
      "Keep the person still and support the injured limb in the position found.",
      "Apply a cold pack wrapped in cloth for up to 20 minutes.",
      "Raise the injured area if it helps and if there is no worsening pain.",
      "Get professional assessment."
    ],
    avoid: [
      "Do not try to straighten or push a bone back.",
      "Do not let the injured person walk if a bone may be broken."
    ]
  },
  {
    key: "choking",
    title: "Choking",
    whenToUse: "The person cannot speak, cough, or breathe.",
    steps: [
      "Encourage coughing if the person can still cough forcefully.",
      "Give 5 firm blows between the shoulder blades with the heel of your hand.",
      "Then give up to 5 abdominal thrusts above the belly button.",
      "Alternate 5 blows and 5 thrusts, and get emergency help."
    ],
    avoid: [
      "Do not do abdominal thrusts on an infant or on someone who is pregnant — seek help instead.",
      "Do not give water to 'wash it down'."
    ]
  },
  {
    key: "poisoning",
    title: "Poisoning",
    whenToUse: "Someone swallowed, inhaled, or touched a harmful substance.",
    steps: [
      "Move the person away from the substance and into fresh air if safe.",
      "Rinse the mouth with clean water if they are awake.",
      "Keep the container or a photo of the substance to show responders.",
      "Get emergency professional care immediately."
    ],
    avoid: [
      "Do not make the person vomit.",
      "Do not give food or drink without advice from a professional."
    ]
  },
  {
    key: "heat",
    title: "Heat exhaustion or heat stroke",
    whenToUse: "The person is very hot, dizzy, weak, confused, or has stopped sweating.",
    steps: [
      "Move the person to shade or a cool, ventilated place.",
      "Loosen clothing and cool the skin with a wet cloth.",
      "Sip cool water slowly if the person is fully awake.",
      "Get help if they do not improve within 30 minutes or get worse."
    ],
    avoid: ["Do not leave the person alone in the heat."]
  },
  {
    key: "dehydration",
    title: "Dehydration",
    whenToUse: "Very thirsty, dry mouth, dark or very little urine, dizziness.",
    steps: [
      "Rest the person in shade.",
      "Give small, frequent sips of water or an oral rehydration solution.",
      "Cool the skin with a damp cloth.",
      "Get professional care if the person cannot keep fluids down or is not improving."
    ],
    avoid: ["Do not give strong coffee or alcohol to someone who is dehydrated."]
  },
  {
    key: "distress",
    title: "Thoughts of harming yourself",
    whenToUse: "Someone talks about ending their life or hurting themselves.",
    steps: [
      "Stay with the person and take them seriously.",
      "Remove anything they could use to harm themselves, if it is safe to do so.",
      "Contact a healthcare professional or emergency service now.",
      "Do not leave them alone until help takes over."
    ],
    avoid: ["Do not promise to keep a secret or leave them by themselves."]
  }
];

export function firstAidByKey(key: string): FirstAidTopic | undefined {
  return firstAidTopics.find((t) => t.key === key);
}
