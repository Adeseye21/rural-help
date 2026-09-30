import { Router } from "express";
import { and, asc, eq, isNull, lte } from "drizzle-orm";
import { db } from "../index.js";
import { accessLogs, reminders } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

const router = Router();

router.use(requireAuth, requireRole("patient", "caregiver"));

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_ESCALATION_NOTE =
  "This reminder is past its date. If your symptoms are the same or getting worse, contact a healthcare professional. If they are severe or getting worse fast, seek urgent care now.";

function toView(row: typeof reminders.$inferSelect) {
  const overdue = row.status === "active" && row.nextDueAt.getTime() < Date.now();
  return {
    id: row.id,
    conversationId: row.conversationId,
    label: row.label,
    instructions: row.instructions,
    intervalDays: row.intervalDays,
    nextDueAt: row.nextDueAt,
    status: row.status,
    isOverdue: overdue,
    escalationNote: row.escalationNote ?? DEFAULT_ESCALATION_NOTE,
    createdAt: row.createdAt
  };
}

router.get("/", async (req, res) => {
  const status = req.query.status;
  const rows = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.patientId, req.user!.id),
        status === "active" ? eq(reminders.status, "active") : undefined
      )
    )
    .orderBy(asc(reminders.nextDueAt))
    .execute();
  res.json(rows.map(toView));
});

router.get("/due", async (req, res) => {
  const rows = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.patientId, req.user!.id),
        eq(reminders.status, "active"),
        lte(reminders.nextDueAt, new Date())
      )
    )
    .orderBy(asc(reminders.nextDueAt))
    .execute();
  res.json(rows.map(toView));
});

router.post("/", async (req, res) => {
  const body = req.body ?? {};
  const label = typeof body.label === "string" ? body.label.slice(0, 120) : "";
  if (label.trim().length < 2) {
    res.status(400).json({ error: "Give the reminder a short name." });
    return;
  }
  const intervalDays = Math.min(Math.max(Number(body.intervalDays) || 1, 1), 90);
  const nextDueAt = new Date(Date.now() + intervalDays * DAY_MS);

  const rows = await db
    .insert(reminders)
    .values({
      patientId: req.user!.id,
      conversationId: typeof body.conversationId === "string" ? body.conversationId : null,
      label,
      instructions:
        typeof body.instructions === "string" && body.instructions.trim()
          ? body.instructions.slice(0, 1000)
          : "Check how you are feeling today. If symptoms are the same or worse, contact a healthcare professional.",
      intervalDays,
      nextDueAt,
      escalationNote:
        typeof body.escalationNote === "string" && body.escalationNote.trim()
          ? body.escalationNote.slice(0, 500)
          : DEFAULT_ESCALATION_NOTE
    })
    .returning();
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["reminder", rows[0].id],
      action: "reminder_created_opt_in"
    })
    .execute();
  res.status(201).json(toView(rows[0]));
});

router.post("/:id/snooze", async (req, res) => {
  const intervalDays = Math.min(Math.max(Number(req.body?.intervalDays) || 1, 1), 90);
  const rows = await db
    .update(reminders)
    .set({ nextDueAt: new Date(Date.now() + intervalDays * DAY_MS), updatedAt: new Date() })
    .where(and(eq(reminders.id, req.params.id), eq(reminders.patientId, req.user!.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "reminder not found" });
    return;
  }
  res.json(toView(rows[0]));
});

router.post("/:id/pause", async (req, res) => {
  const rows = await db
    .update(reminders)
    .set({ status: "paused", updatedAt: new Date() })
    .where(and(eq(reminders.id, req.params.id), eq(reminders.patientId, req.user!.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "reminder not found" });
    return;
  }
  res.json(toView(rows[0]));
});

router.post("/:id/resume", async (req, res) => {
  const rows = await db
    .update(reminders)
    .set({ status: "active", nextDueAt: new Date(Date.now() + 1 * DAY_MS), updatedAt: new Date() })
    .where(and(eq(reminders.id, req.params.id), eq(reminders.patientId, req.user!.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "reminder not found" });
    return;
  }
  res.json(toView(rows[0]));
});

router.post("/:id/complete", async (req, res) => {
  const rows = await db
    .update(reminders)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(reminders.id, req.params.id), eq(reminders.patientId, req.user!.id)))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "reminder not found" });
    return;
  }
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["reminder", req.params.id],
      action: "reminder_completed"
    })
    .execute();
  res.json(toView(rows[0]));
});

router.delete("/:id", async (req, res) => {
  const rows = await db
    .delete(reminders)
    .where(and(eq(reminders.id, req.params.id), eq(reminders.patientId, req.user!.id)))
    .returning({ id: reminders.id });
  if (rows.length === 0) {
    res.status(404).json({ error: "reminder not found" });
    return;
  }
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["reminder", req.params.id],
      action: "reminder_removed_opt_out"
    })
    .execute();
  res.json({ ok: true });
});

export default router;
