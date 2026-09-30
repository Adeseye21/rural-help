import "dotenv/config";
import cors from "cors";
import express from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import authRouter from "./auth/router.js";
import patientRouter from "./patient/router.js";
import symptomRouter from "./symptom/router.js";
import reviewRouter from "./review/router.js";
import facilityRouter from "./facility/router.js";
import conversationRouter from "./conversation/router.js";
import reminderRouter from "./reminder/router.js";
import documentRouter from "./document/router.js";
import offlineRouter from "./offline/router.js";

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://rural_help:rural_help_dev@localhost:5432/rural_help"
});
export const db = drizzle(pool);

app.use("/api/auth", authRouter);
app.use("/api/patient", patientRouter);
app.use("/api/symptom", symptomRouter);
app.use("/api/review", reviewRouter);
app.use("/api/facilities", facilityRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/documents", documentRouter);
app.use("/api/offline", offlineRouter);

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "rural-help-api", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", service: "rural-help-api", database: "unreachable" });
  }
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Rural Help API listening on http://localhost:${port}`);
});