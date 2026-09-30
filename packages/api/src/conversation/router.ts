import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { accessLogs, conversations } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { newestFirst, ownedConversation, toConversationView } from "./store.js";

const router = Router();

router.use(requireAuth, requireRole("patient", "caregiver"));

router.post("/", async (req, res) => {
  const body = req.body ?? {};
  const symptomText = typeof body.symptomText === "string" ? body.symptomText.slice(0, 2000) : "";
  if (symptomText.trim().length < 3) {
    res.status(400).json({ error: "Describe what is bothering you before saving." });
    return;
  }
  const title = (typeof body.title === "string" && body.title.trim()) || symptomText.trim().slice(0, 60);
  const intakeMode = ["typed", "voice", "guided", "icons"].includes(body.intakeMode)
    ? body.intakeMode
    : "typed";

  const rows = await db
    .insert(conversations)
    .values({
      patientId: req.user!.id,
      title,
      symptomText,
      intakeMode,
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : [],
      possibleCauses: Array.isArray(body.possibleCauses) ? body.possibleCauses : [],
      urgency: body.urgency === "urgent" ? "urgent" : "routine",
      isEmergency: body.isEmergency === true,
      notes: Array.isArray(body.notes) ? body.notes : []
    })
    .returning();
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["conversation", rows[0].id],
      action: "conversation_saved"
    })
    .execute();
  res.status(201).json(toConversationView(rows[0]));
});

router.get("/", async (req, res) => {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.patientId, req.user!.id))
    .orderBy(newestFirst())
    .execute();
  res.json(rows.map(toConversationView));
});

router.get("/:id", async (req, res) => {
  const rows = await db
    .select()
    .from(conversations)
    .where(ownedConversation(req.params.id, req.user!.id))
    .execute();
  if (rows.length === 0) {
    res.status(404).json({ error: "conversation not found" });
    return;
  }
  res.json(toConversationView(rows[0]));
});

router.post("/:id/pause", async (req, res) => {
  const rows = await db
    .update(conversations)
    .set({ status: "paused", updatedAt: new Date() })
    .where(ownedConversation(req.params.id, req.user!.id))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "conversation not found" });
    return;
  }
  res.json(toConversationView(rows[0]));
});

router.post("/:id/continue", async (req, res) => {
  const rows = await db
    .update(conversations)
    .set({ status: "active", updatedAt: new Date() })
    .where(ownedConversation(req.params.id, req.user!.id))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "conversation not found" });
    return;
  }
  res.json(toConversationView(rows[0]));
});

router.post("/:id/complete", async (req, res) => {
  const rows = await db
    .update(conversations)
    .set({ status: "completed", updatedAt: new Date() })
    .where(ownedConversation(req.params.id, req.user!.id))
    .returning();
  if (rows.length === 0) {
    res.status(404).json({ error: "conversation not found" });
    return;
  }
  res.json(toConversationView(rows[0]));
});

router.delete("/:id", async (req, res) => {
  const rows = await db
    .delete(conversations)
    .where(ownedConversation(req.params.id, req.user!.id))
    .returning({ id: conversations.id });
  if (rows.length === 0) {
    res.status(404).json({ error: "conversation not found" });
    return;
  }
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["conversation", req.params.id],
      action: "conversation_deleted"
    })
    .execute();
  res.json({ ok: true });
});

export default router;
