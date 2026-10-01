import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
import { corsOriginList, isOriginAllowed, siteAuthGate } from "./deploy-gate.js";

const app = express();
app.set("trust proxy", 1);

// A wildcard origin on an API that stores health data would let any website on
// the internet call it. Only explicitly configured origins are allowed.
const allowedOrigins = corsOriginList();
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin and non-browser callers (health checks, curl) send no origin.
      if (!origin) return callback(null, true);
      callback(null, isOriginAllowed(origin));
    }
  })
);

app.use(express.json());
app.use(siteAuthGate);

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

// The web build is served from this same origin so the app never needs a
// separate API base URL, and so a field tester only ever needs one link.
const here = path.dirname(fileURLToPath(import.meta.url));
const webDist = process.env.WEB_DIST_PATH ?? path.resolve(here, "../../web/dist");

app.use(
  express.static(webDist, {
    index: false,
    setHeaders(res, filePath) {
      // The service worker must never be cached, or updates never reach devices.
      if (filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  })
);

// SPA fallback, but only for real navigation requests so unknown /api paths
// still return JSON 404 rather than the HTML shell.
app.get(/^\/(?!api\/|health).*/, (req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(webDist, "index.html"), (err) => {
    if (err) next();
  });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Rural Help API listening on http://localhost:${port}`);
  if (allowedOrigins.length === 0) {
    console.log("[cors] ALLOWED_ORIGINS is empty: only same-origin browser calls are accepted.");
  } else {
    console.log(`[cors] allowed origins: ${allowedOrigins.join(", ")}`);
  }
  if (process.env.NODE_ENV === "production" && !process.env.SITE_BASIC_AUTH_PASSWORD) {
    console.warn(
      "[deploy] SITE_BASIC_AUTH_PASSWORD is not set. The site is reachable by anyone who finds the URL."
    );
  }
});