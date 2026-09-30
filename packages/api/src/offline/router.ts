import { Router } from "express";
import { firstAidTopics, FIRST_AID_NOTE } from "../symptom/firstaid.js";
import { redFlags } from "../symptom/redflags.js";
import { buildVisitPreparation } from "../document/visit.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();

const PACK_VERSION = 1;

const EMERGENCY_NUMBERS = [
  { label: "National emergency number", value: "112", note: "Works on most mobile networks." },
  { label: "Lagos State Ambulance Service", value: "199", note: "For patient transport to hospital." }
];

function buildPack() {
  return {
    version: PACK_VERSION,
    generatedAt: new Date().toISOString(),
    disclaimer: FIRST_AID_NOTE,
    emergencyNumbers: EMERGENCY_NUMBERS,
    redFlagWarnings: redFlags.map((f) => ({
      label: f.label,
      guidance: f.guidance,
      firstAidKey: f.firstAid
    })),
    firstAid: firstAidTopics.map((t) => ({
      key: t.key,
      title: t.title,
      whenToUse: t.whenToUse,
      steps: t.steps,
      avoid: t.avoid
    }))
  };
}

router.get("/", (req, res) => {
  res.json(buildPack());
});

router.get("/preparation", requireAuth, async (req, res) => {
  res.json(await buildVisitPreparation(req.user!.id));
});

export default router;
