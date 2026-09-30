import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { accessLogs, consentRecords, patientProfiles, users } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

const router = Router();

router.use(requireAuth, requireRole("patient"));

function toPublicProfile(row: typeof patientProfiles.$inferSelect, name: string) {
  return {
    id: row.id,
    name,
    dateOfBirth: row.dateOfBirth,
    bloodType: row.bloodType,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    emergencySummary: row.emergencySummary,
    conditions: row.conditions,
    medicines: row.medicines,
    allergies: row.allergies,
    emergencySummaryUpdatedAt: row.emergencySummaryUpdatedAt,
    shareLocation: row.shareLocation,
    allowEmergencyAccess: row.allowEmergencyAccess
  };
}

router.get("/profile", async (req, res) => {
  const patientId = req.user!.id;
  const rows = await db.select().from(patientProfiles).where(eq(patientProfiles.patientId, patientId)).execute();
  const profile = rows[0] ?? null;
  const userRows = await db.select().from(users).where(eq(users.id, patientId)).execute();
  void db
    .insert(accessLogs)
    .values({
      patientId,
      actorId: patientId,
      actorRole: "patient",
      scope: ["profile"],
      action: "read_own_profile"
    })
    .execute();
  res.json(profile ? toPublicProfile(profile, userRows[0]?.name ?? "") : null);
});

router.put("/profile", async (req, res) => {
  const patientId = req.user!.id;
  const body = req.body ?? {};
  const existing = await db.select().from(patientProfiles).where(eq(patientProfiles.patientId, patientId)).execute();
  const updates: Record<string, unknown> = {};
  if (typeof body.dateOfBirth === "string") updates.dateOfBirth = body.dateOfBirth;
  if (typeof body.bloodType === "string") updates.bloodType = body.bloodType;
  if (typeof body.emergencyContactName === "string") updates.emergencyContactName = body.emergencyContactName;
  if (typeof body.emergencyContactPhone === "string") updates.emergencyContactPhone = body.emergencyContactPhone;
  if (typeof body.emergencySummary === "string") {
    updates.emergencySummary = body.emergencySummary;
    updates.emergencySummaryUpdatedAt = new Date();
  }
  for (const key of ["conditions", "medicines", "allergies"] as const) {
    if (Array.isArray(body[key])) {
      updates[key] = body[key].filter((v: unknown): v is string => typeof v === "string").slice(0, 30);
    }
  }
  if (typeof body.shareLocation === "boolean") updates.shareLocation = body.shareLocation;
  if (typeof body.allowEmergencyAccess === "boolean") updates.allowEmergencyAccess = body.allowEmergencyAccess;
  updates.updatedAt = new Date();

  if (existing.length === 0) {
    await db.insert(patientProfiles).values({ patientId, ...updates }).execute();
  } else {
    await db.update(patientProfiles).set(updates).where(eq(patientProfiles.patientId, patientId)).execute();
  }

  const rows = await db.select().from(patientProfiles).where(eq(patientProfiles.patientId, patientId)).execute();
  const userRows = await db.select().from(users).where(eq(users.id, patientId)).execute();
  void db
    .insert(accessLogs)
    .values({
      patientId,
      actorId: patientId,
      actorRole: "patient",
      scope: ["profile"],
      action: "update_own_profile"
    })
    .execute();
  res.json(toPublicProfile(rows[0], userRows[0]?.name ?? ""));
});

router.get("/consent", async (req, res) => {
  const patientId = req.user!.id;
  const rows = await db.select().from(consentRecords).where(eq(consentRecords.patientId, patientId)).execute();
  res.json(rows.map((r) => ({ ...r, scope: r.scope as string[] })));
});

router.get("/access", async (req, res) => {
  const patientId = req.user!.id;
  const rows = await db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.patientId, patientId))
    .orderBy(accessLogs.occurredAt)
    .execute();
  res.json(rows.map((r) => ({ ...r, scope: r.scope as string[] })));
});

export default router;