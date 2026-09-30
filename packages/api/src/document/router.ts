import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { accessLogs, healthDocuments } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { explainDocument } from "./explainer.js";
import { buildVisitPreparation } from "./visit.js";

const router = Router();

router.use(requireAuth, requireRole("patient", "caregiver"));

function toView(row: typeof healthDocuments.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    documentType: row.documentType,
    rawText: row.rawText,
    explanation: row.explanation,
    clarifyItems: row.clarifyItems,
    createdAt: row.createdAt
  };
}

router.post("/", async (req, res) => {
  const rawText = typeof req.body?.rawText === "string" ? req.body.rawText.slice(0, 5000) : "";
  if (rawText.trim().length < 10) {
    res.status(400).json({ error: "Type or paste the words from your document first." });
    return;
  }
  const result = explainDocument(rawText);
  const title =
    (typeof req.body?.title === "string" && req.body.title.trim()) || result.matched[0]?.testName || "Health document";

  const rows = await db
    .insert(healthDocuments)
    .values({
      patientId: req.user!.id,
      title,
      documentType: req.body?.documentType ?? "health document",
      rawText,
      explanation: result.matched,
      clarifyItems: result.clarifyWithProfessional
    })
    .returning();
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["health_document", rows[0].id],
      action: "health_document_explained"
    })
    .execute();
  res.status(201).json({ ...toView(rows[0]), generalExplanation: result.generalExplanation, disclaimer: result.disclaimer });
});

router.get("/", async (req, res) => {
  const rows = await db
    .select()
    .from(healthDocuments)
    .where(eq(healthDocuments.patientId, req.user!.id))
    .orderBy(desc(healthDocuments.createdAt))
    .execute();
  res.json(rows.map(toView));
});

router.get("/visit-preparation", async (req, res) => {
  const prep = await buildVisitPreparation(req.user!.id);
  res.json(prep);
});

router.delete("/:id", async (req, res) => {
  const rows = await db
    .delete(healthDocuments)
    .where(eq(healthDocuments.id, req.params.id))
    .returning({ id: healthDocuments.id, patientId: healthDocuments.patientId });
  if (rows.length === 0 || rows[0].patientId !== req.user!.id) {
    res.status(404).json({ error: "document not found" });
    return;
  }
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["health_document", req.params.id],
      action: "health_document_deleted"
    })
    .execute();
  res.json({ ok: true });
});

export default router;
