import { Router } from "express";
import { db } from "../index.js";
import { accessLogs } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { assessSymptoms, refineSymptoms } from "./engine.js";
import { FIRST_AID_NOTE, firstAidTopics } from "./firstaid.js";

const router = Router();

router.use(requireAuth, requireRole("patient", "caregiver"));

router.get("/first-aid", async (req, res) => {
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["first_aid"],
      action: "first_aid_guides_viewed"
    })
    .execute();
  res.json({ note: FIRST_AID_NOTE, topics: firstAidTopics });
});

router.post("/assess", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.slice(0, 2000) : "";
  if (text.trim().length < 3) {
    res.status(400).json({ error: "Please describe what is bothering you." });
    return;
  }
  const result = assessSymptoms(text);
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["symptom", "assessment"],
      action: "symptom_assessment_requested"
    })
    .execute();
  res.json(result);
});

router.post("/refine", async (req, res) => {
  const { categories, answers } = req.body ?? {};
  if (!Array.isArray(categories) || typeof answers !== "object" || answers === null) {
    res.status(400).json({ error: "The previous step is empty. Start with a symptom description." });
    return;
  }
  const result = refineSymptoms(categories as string[], answers as Record<string, string>);
  void db
    .insert(accessLogs)
    .values({
      patientId: req.user!.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      scope: ["symptom", "assessment"],
      action: "symptom_assessment_refined"
    })
    .execute();
  res.json(result);
});

export default router;
