import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../index.js";
import { refreshTokens, users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken
} from "./tokens.js";
import { requireAuth } from "./middleware.js";

const router = Router();

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

async function issueTokenPair(userId: string, role: string): Promise<TokenPair> {
  const refreshToken = generateRefreshToken();
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiry()
  });
  const accessToken = await signAccessToken({ sub: userId, role });
  return { accessToken, refreshToken };
}

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (typeof name !== "string" || name.length < 2) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "valid email is required" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "password must be at least 8 characters" });
    return;
  }
  const allowedRole = ["patient", "caregiver", "community_health_worker", "nurse", "doctor"].includes(role)
    ? role
    : "patient";

  const existing = await db.select().from(users).where(eq(users.email, email)).execute();
  if (existing.length > 0) {
    res.status(409).json({ error: "email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const rows = await db
    .insert(users)
    .values({ name, email, passwordHash, role: allowedRole })
    .returning({ id: users.id, role: users.role });
  const created = rows[0];

  const tokens = await issueTokenPair(created.id, created.role);
  res.status(201).json({ id: created.id, role: created.role, ...tokens });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const rows = await db.select().from(users).where(eq(users.email, email)).execute();
  const user = rows[0];
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    res.status(401).json({ error: "invalid email or password" });
    return;
  }
  const tokens = await issueTokenPair(user.id, user.role);
  res.json({ id: user.id, name: user.name, role: user.role, ...tokens });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== "string") {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }
  const hash = hashRefreshToken(refreshToken);
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)))
    .execute();
  const record = rows[0];
  if (!record || record.expiresAt.getTime() < Date.now()) {
    res.status(401).json({ error: "invalid or expired refresh token" });
    return;
  }
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, record.id))
    .execute();
  const userRows = await db.select().from(users).where(eq(users.id, record.userId)).execute();
  const user = userRows[0];
  if (!user) {
    res.status(401).json({ error: "user not found" });
    return;
  }
  const tokens = await issueTokenPair(user.id, user.role);
  res.json({ id: user.id, role: user.role, ...tokens });
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== "string") {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashRefreshToken(refreshToken)))
    .execute();
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const rows = await db.select().from(users).where(eq(users.id, req.user!.id)).execute();
  const user = rows[0];
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
    createdAt: user.createdAt
  });
});

export default router;