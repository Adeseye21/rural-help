import { db } from "../index.js";
import { conversations, healthDocuments, patientProfiles, reminders, reviewRequests } from "../db/schema.js";
import { and, desc, eq } from "drizzle-orm";

export async function buildVisitPreparation(patientId: string) {
  const [profileRows, convoRows, docRows, reminderRows, reviewRows] = await Promise.all([
    db.select().from(patientProfiles).where(eq(patientProfiles.patientId, patientId)).execute(),
    db.select().from(conversations).where(eq(conversations.patientId, patientId)).orderBy(desc(conversations.updatedAt)).limit(5).execute(),
    db.select().from(healthDocuments).where(eq(healthDocuments.patientId, patientId)).orderBy(desc(healthDocuments.createdAt)).limit(5).execute(),
    db.select().from(reminders).where(and(eq(reminders.patientId, patientId), eq(reminders.status, "active"))).execute(),
    db.select().from(reviewRequests).where(eq(reviewRequests.patientId, patientId)).orderBy(desc(reviewRequests.createdAt)).limit(5).execute()
  ]);

  const profile = profileRows[0] ?? null;

  const symptomList = convoRows
    .filter((c) => c.status !== "completed")
    .map((c) => ({
      title: c.title,
      reported: c.symptomText,
      urgency: c.urgency,
      isEmergency: c.isEmergency,
      isIncomplete: c.status === "active" && (c.notes as string[]).length === 0,
      since: c.updatedAt
    }));

  const missingInformation: string[] = [];
  if (!profile?.dateOfBirth) missingInformation.push("Your age is not saved yet.");
  if (!profile?.bloodType) missingInformation.push("Your blood type is not saved yet.");
  if (!profile?.emergencyContactName) missingInformation.push("No emergency contact name is saved.");
  if (!profile?.emergencyContactPhone) missingInformation.push("No emergency contact phone is saved.");
  if (!profile?.emergencySummary) missingInformation.push("Your emergency summary is empty.");
  if (symptomList.length === 0) missingInformation.push("You have not described any symptoms yet.");
  if (docRows.length === 0) missingInformation.push("No test result or prescription has been added.");
  if ((profile?.medicines ?? []).length === 0) missingInformation.push("The medicines you are taking are not written down.");
  if ((profile?.allergies ?? []).length === 0) missingInformation.push("Your allergies are not written down.");
  if ((profile?.conditions ?? []).length === 0) missingInformation.push("Your ongoing health conditions are not written down.");

  const questionsToAsk = [
    "What could be causing these symptoms?",
    "What tests do I need, and when should I come back?",
    "Which medicines should I take, and for how long?",
    "What should I avoid doing while I recover?",
    "What signs mean I should come back immediately?"
  ];

  return {
    generatedAt: new Date(),
    patient: {
      age: profile?.dateOfBirth ?? null,
      bloodType: profile?.bloodType ?? null,
      conditions: profile?.conditions ?? [],
      medicines: profile?.medicines ?? [],
      allergies: profile?.allergies ?? [],
      emergencyContact: profile?.emergencyContactName
        ? { name: profile.emergencyContactName, phone: profile.emergencyContactPhone }
        : null,
      emergencySummary: profile?.emergencySummary ?? null,
      emergencySummaryUpdatedAt: profile?.emergencySummaryUpdatedAt ?? null,
      locationSharing: profile?.shareLocation ?? false
    },
    symptoms: symptomList,
    documents: docRows.map((d) => ({ title: d.title, addedAt: d.createdAt })),
    reminders: reminderRows.map((r) => ({ label: r.label, nextDueAt: r.nextDueAt, instructions: r.instructions })),
    reviewRequests: reviewRows.map((r) => ({
      symptomText: r.symptomText,
      urgency: r.urgency,
      status: r.status,
      createdAt: r.createdAt
    })),
    questionsToAsk,
    missingInformation,
    privacy: {
      sharedWith: "nobody yet",
      note: "This summary stays on your account. It is shared with a healthcare worker only if you approve a review request."
    },
    disclaimer:
      "Rural Help suggestion: this preparation sheet is generated from information you entered. It is not a medical record and it is not a diagnosis."
  };
}
