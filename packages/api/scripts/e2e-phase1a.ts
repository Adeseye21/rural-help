const BASE = process.env.BASE ?? "http://localhost:5173";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name} -> ${detail}`);
    console.log(`FAIL  ${name} -> ${detail}`);
  }
}

async function req(method, path, { body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let data = null;
  if (text.length) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { _raw: text.slice(0, 120) };
    }
  }
  return { status: res.status, ok: res.ok, data };
}

const stamp = Date.now();
const reg = await req("POST", "/api/auth/register", {
  body: { name: "E2E User", email: `e2e_${stamp}@example.com`, password: "password123" }
});
if (!reg.ok) {
  console.log(`FATAL: register failed ${reg.status} ${JSON.stringify(reg.data)}`);
  process.exit(1);
}
const token = reg.data.accessToken;

// 1A.1 profile with structured fields
const prof = await req("PUT", "/api/patient/profile", {
  token,
  body: {
    dateOfBirth: "1990-04-02",
    bloodType: "O+",
    emergencyContactName: "Amina Bello",
    emergencyContactPhone: "08012345678",
    emergencySummary: "Asthma, uses inhaler",
    conditions: ["asthma"],
    medicines: ["salbutamol inhaler"],
    allergies: ["penicillin"],
    shareLocation: true
  }
});
check(
  "1A.1 profile structured fields",
  prof.ok &&
    prof.data.conditions.includes("asthma") &&
    prof.data.allergies.includes("penicillin") &&
    prof.data.medicines.includes("salbutamol inhaler") &&
    prof.data.bloodType === "O+" &&
    prof.data.dateOfBirth === "1990-04-02",
  JSON.stringify(prof.data)
);

// 1A.2 typed intake
const assess = await req("POST", "/api/symptom/assess", { token, body: { text: "fever and headache" } });
check(
  "1A.2 typed intake detects categories",
  assess.ok && assess.data.categories.includes("fever") && assess.data.categories.includes("headache"),
  JSON.stringify(assess.data.categories)
);
// 1A.3 sources
check("1A.3 assess sources returned", assess.ok && assess.data.sources.length >= 2, `${assess.data?.sources?.length}`);

const refine = await req("POST", "/api/symptom/refine", {
  token,
  body: { categories: assess.data.categories, answers: { fever_duration: "More than 3 days" } }
});
check(
  "1A.3 refine notes and sources",
  refine.ok && refine.data.notes.length >= 1 && refine.data.sources.length >= 2,
  `${refine.data?.notes?.length}/${refine.data?.sources?.length}`
);

// 1A.4 red flags
const em = await req("POST", "/api/symptom/assess", { token, body: { text: "severe bleeding that will not stop" } });
check("1A.4 red flag triggers emergency", em.ok && em.data.isEmergency === true, JSON.stringify(em.data.emergencyLabel));
check("1A.4 emergency has first aid", em.ok && Boolean(em.data.firstAid?.key), `${em.data?.firstAid?.key}`);
check("1A.4 emergency has safety guidance", em.ok && Boolean(em.data.safetyGuidance), "missing");

// 1A.7 facilities distance handling
const facNoCoords = await req("GET", "/api/facilities", { token });
const withDistanceNoCoords = facNoCoords.data.facilities.filter((f) => "distanceKm" in f);
check(
  "1A.7 no distance field without coords",
  facNoCoords.ok && facNoCoords.data.locationUsed === false && withDistanceNoCoords.length === 0,
  `used=${facNoCoords.data?.locationUsed} withDist=${withDistanceNoCoords.length}`
);
const facCoords = await req("GET", "/api/facilities?lat=6.5244&lng=3.3792", { token });
const allNumeric = facCoords.data.facilities.every((f) => typeof f.distanceKm === "number");
check(
  "1A.7 distance present and numeric with coords",
  facCoords.ok && facCoords.data.locationUsed === true && allNumeric,
  `used=${facCoords.data?.locationUsed} allNumeric=${allNumeric}`
);

// 1A.12 conversation memory
const convoDone = await req("POST", "/api/conversations", {
  token,
  body: {
    symptomText: "fever and headache",
    intakeMode: "voice",
    categoryIds: assess.data.categories,
    possibleCauses: assess.data.possibleCauses,
    urgency: "routine",
    notes: ["fever_duration: More than 3 days"]
  }
});
check(
  "1A.12 save conversation keeps intake mode",
  convoDone.ok && convoDone.data.intakeMode === "voice" && convoDone.data.isIncomplete === false,
  JSON.stringify(convoDone.data).slice(0, 160)
);
const paused = await req("POST", `/api/conversations/${convoDone.data.id}/pause`, { token });
const continued = await req("POST", `/api/conversations/${convoDone.data.id}/continue`, { token });
check(
  "1A.12 pause then continue",
  paused.ok && paused.data.status === "paused" && continued.ok && continued.data.status === "active",
  `${paused.data?.status}/${continued.data?.status}`
);
const convoPartial = await req("POST", "/api/conversations", { token, body: { symptomText: "just a cough" } });
check("1A.12 incomplete conversation flagged", convoPartial.ok && convoPartial.data.isIncomplete === true, "not flagged");

const convoList = await req("GET", "/api/conversations", { token });
check("1A.12 conversation list", convoList.ok && convoList.data.length >= 2, `${convoList.data?.length}`);

// 1A.11 reminders
const rem = await req("POST", "/api/reminders", {
  token,
  body: { label: "Check my fever", instructions: "Note if it is improving", intervalDays: 2, conversationId: convoDone.data.id }
});
check(
  "1A.11 create reminder active with escalation copy",
  rem.ok && rem.data.status === "active" && rem.data.isOverdue === false && Boolean(rem.data.escalationNote),
  JSON.stringify(rem.data).slice(0, 140)
);
const due = await req("GET", "/api/reminders/due", { token });
check("1A.11 due list excludes future reminders", due.ok && due.data.length === 0, `${due.data?.length}`);
const remPause = await req("POST", `/api/reminders/${rem.data.id}/pause`, { token });
const remResume = await req("POST", `/api/reminders/${rem.data.id}/resume`, { token });
check(
  "1A.11 pause then resume",
  remPause.data.status === "paused" && remResume.data.status === "active",
  `${remPause.data?.status}/${remResume.data?.status}`
);
const remSnooze = await req("POST", `/api/reminders/${rem.data.id}/snooze`, { token, body: { intervalDays: 3 } });
check("1A.11 snooze pushes due date forward", remSnooze.ok && new Date(remSnooze.data.nextDueAt) > new Date(rem.data.nextDueAt), "not pushed");
const remDone = await req("POST", `/api/reminders/${rem.data.id}/complete`, { token });
check("1A.11 complete reminder", remDone.data.status === "completed", remDone.data?.status);

// 1A.8 health documents
const docTwo = await req("POST", "/api/documents", { token, body: { rawText: "Haemoglobin: 9.8 g/dL\nMalaria test: Positive" } });
check(
  "1A.8 explains two recognised tests",
  docTwo.ok && docTwo.data.explanation.length === 2,
  JSON.stringify(docTwo.data.explanation.map((x) => x.testName))
);
check("1A.8 clarify items generated", docTwo.ok && docTwo.data.clarifyItems.length === 2, `${docTwo.data?.clarifyItems?.length}`);
const docNone = await req("POST", "/api/documents", { token, body: { rawText: "Visit clinic on Monday and bring your card" } });
check("1A.8 no false positives on unrelated text", docNone.ok && docNone.data.explanation.length === 0, `${docNone.data?.explanation?.length}`);
const docMixed = await req("POST", "/api/documents", { token, body: { rawText: "my chest is tight and I cannot breathe well today" } });
check("1A.8 unknown words produce no guesses", docMixed.ok && docMixed.data.explanation.length === 0, `${docMixed.data?.explanation?.length}`);

// 1A.9 visit preparation
const prep = await req("GET", "/api/offline/preparation", { token });
check(
  "1A.9 prep merges profile and conversations",
  prep.ok && prep.data.patient.allergies.includes("penicillin") && prep.data.symptoms.length >= 2,
  `allergies=${prep.data?.patient?.allergies} symptoms=${prep.data?.symptoms?.length}`
);
check(
  "1A.9 prep has questions and privacy note",
  prep.ok && prep.data.questionsToAsk.length === 5 && prep.data.privacy.sharedWith === "nobody yet",
  `q=${prep.data?.questionsToAsk?.length}`
);

// 1A.6 offline pack
const pack = await req("GET", "/api/offline");
check(
  "1A.6 offline pack complete",
  pack.ok &&
    pack.data.version >= 1 &&
    pack.data.firstAid.length === 14 &&
    pack.data.redFlagWarnings.length >= 12 &&
    pack.data.emergencyNumbers.length >= 1,
  `v=${pack.data?.version} aid=${pack.data?.firstAid?.length} flags=${pack.data?.redFlagWarnings?.length}`
);

// 1A.4 extra emergency phrasing the rural users actually type
const emergencyPhrases = [
  "one side of my face is drooping",
  "my face is swollen and my throat is closing",
  "I took a whole packet of paracetamol",
  "I am pregnant and bleeding",
  "water is coming out of my pregnant belly",
  "blood in my vomit",
  "I am bleeding from my nose and it will not stop"
];
const missedEmergencies = [];
for (const phrase of emergencyPhrases) {
  const r = await req("POST", "/api/symptom/assess", { token, body: { text: phrase } });
  if (!r.ok || r.data.isEmergency !== true) missedEmergencies.push(phrase);
}
check(
  "1A.4 everyday emergency phrasing detected",
  missedEmergencies.length === 0,
  missedEmergencies.join(" | ")
);

const routinePhrases = ["I am short of breath when climbing stairs", "I feel dizzy when I stand up", "I have a mild cough"];
const falseEmergencies = [];
for (const phrase of routinePhrases) {
  const r = await req("POST", "/api/symptom/assess", { token, body: { text: phrase } });
  if (!r.ok || r.data.isEmergency === true) falseEmergencies.push(phrase);
}
check("1A.4 routine phrases not escalated", falseEmergencies.length === 0, falseEmergencies.join(" | "));

// 1A.7 no location sorting when consent is off
const cg2 = await req("POST", "/api/auth/register", {
  body: { name: "No Location", email: `nl_${Date.now()}@example.com`, password: "password123" }
});
const noConsentFac = await req("GET", "/api/facilities?lat=6.5244&lng=3.3792", { token: cg2.data.accessToken });
check(
  "1A.7 distances hidden when location sharing is off",
  noConsentFac.ok &&
    noConsentFac.data.locationUsed === false &&
    noConsentFac.data.facilities.every((f) => !("distanceKm" in f)),
  `used=${noConsentFac.data?.locationUsed}`
);

// Role and ownership gates
const cg = await req("POST", "/api/auth/register", {
  body: { name: "Care Giver", email: `cg_${Date.now()}@example.com`, password: "password123", role: "caregiver" }
});
const cgToken = cg.data.accessToken;
const cgProfile = await req("PUT", "/api/patient/profile", { token: cgToken, body: { bloodType: "A+" } });
check("role gate blocks caregiver from patient profile", cgProfile.status === 403, `status=${cgProfile.status}`);

const other = await req("POST", "/api/auth/register", {
  body: { name: "Other", email: `o_${Date.now()}@example.com`, password: "password123" }
});
const otherRead = await req("GET", `/api/conversations/${convoDone.data.id}`, { token: other.data.accessToken });
check("other patient cannot read someone else's conversation", otherRead.status === 404, `status=${otherRead.status}`);

const noAuth = await req("GET", "/api/reminders");
check("reminders require authentication", noAuth.status === 401, `status=${noAuth.status}`);

// 1A.3 uncertainty language present in output
const text = JSON.stringify(assess.data).toLowerCase();
check(
  "1A.3 uncertainty-safe language present",
  text.includes("possible") || text.includes("can have") || text.includes("professional"),
  "no hedging language"
);

console.log(`\nPASS: ${pass}   FAIL: ${fail}`);
if (failures.length) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(` - ${f}`));
}
process.exit(fail > 0 ? 1 : 0);
