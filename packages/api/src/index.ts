import "dotenv/config";
import cors from "cors";
import express from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import authRouter from "./auth/router.js";

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://rural_help:rural_help_dev@localhost:5432/rural_help"
});
export const db = drizzle(pool);

app.use("/api/auth", authRouter);

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