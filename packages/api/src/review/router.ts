import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { accessLogs, consentRecords, reviewRequests, users } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { buildReviewSummary } from "./summary.js";

const router = Router();

router.use(requireAuth, requireRole("patient", "caregiver"));

function toView(row: typeof reviewRequests.$inferSelect) {
  return {
    id: row.id,
    symptomText: row.symptomText,
    summary: row.summary,
    possibleCauses: row.possibleCauses as string[],
    urgency: row.urgency,
    status: row.status,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt
  };
}

router.post("/requests", async (req, res) => {
  const body = req.body ?? {};
  const symptomText = typeof body.symptomText === "string" ? body.symptomText.slice(0, 2000) : "";
  if (symptomText.trim().length < 3) {
    res.status(400).json({ error: "Describe the problem before requesting a review." });
    return;
  }
  const possibleCauses = Array.isArray(body.possibleCauses) ? body.possibleCauses.slice(0, 10) : [];
  const urgency = body.urgency === "urgent" ? "urgent" : "routine";
  const emergency = body.emergency === true;

  const userRows = await db.select().from(users).where(eq(users.id, req.user!.id)).execute();
  const summary = buildReviewSummary({
    patientName: userRows[0]?.name ?? "",
    symptomText,
    possibleCauses,
    urgency,
    emergency
  });

  const rows = await db
    .insert(reviewRequests)
    .values({ patientId: req.user!.id, symptomText, summary, possibleCauses, urgency })
    .returning();
  const created = rows[0];

  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["review_request", created.id],
      action: "review_request_created_pending_patient_approval"
    })
    .execute();

  res.status(201).json(toView(created));
});

router.get("/requests", async (req, res) => {
  const rows = await db
    .select()
    .from(reviewRequests)
    .where(eq(reviewRequests.patientId, req.user!.id))
    .orderBy(desc(reviewRequests.createdAt))
    .execute();
  res.json(rows.map(toView));
});

router.get("/requests/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(reviewRequests)
    .where(and(eq(reviewRequests.id, req.params.id), eq(reviewRequests.patientId, req.user!.id)))
    .execute();
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "review request not found" });
    return;
  }
  res.json({
    ...toView(row),
    whatWillBeShared: {
      summary: row.summary,
      possibleCauses: row.possibleCauses,
      urgency: row.urgency,
      recipient: "a healthcare worker reviewing your case",
      note: "Nothing is shared with anyone until you approve it."
    }
  });
});

router.post("/requests/:id/approve", async (req, res) => {
  const rows = await db
    .select()
    .from(reviewRequests)
    .where(and(eq(reviewRequests.id, req.params.id), eq(reviewRequests.patientId, req.user!.id)))
    .execute();
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "review request not found" });
    return;
  }
  if (row.status !== "pending") {
    res.status(409).json({ error: `this request is already ${row.status}` });
    return;
  }
  const updated = await db
    .update(reviewRequests)
    .set({ status: "approved", decidedAt: new Date() })
    .where(eq(reviewRequests.id, row.id))
    .returning();
  await db.insert(consentRecords).values({
    patientId: req.user!.id,
    granteeRole: "health_worker",
    scope: ["review_request", row.id],
    purpose: "professional review of patient-submitted summary",
    createdBy: "patient"
  });
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["review_request", row.id],
      action: "review_request_approved_for_sharing"
    })
    .execute();
  res.json(toView(updated[0]));
});

router.post("/requests/:id/decline", async (req, res) => {
  const rows = await db
    .select()
    .from(reviewRequests)
    .where(and(eq(reviewRequests.id, req.params.id), eq(reviewRequests.patientId, req.user!.id)))
    .execute();
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "review request not found" });
    return;
  }
  if (row.status !== "pending") {
    res.status(409).json({ error: `this request is already ${row.status}` });
    return;
  }
  const updated = await db
    .update(reviewRequests)
    .set({ status: "declined", decidedAt: new Date() })
    .where(eq(reviewRequests.id, row.id))
    .returning();
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["review_request", row.id],
      action: "review_request_declined_nothing_shared"
    })
    .execute();
  res.json(toView(updated[0]));
});

export default router;
