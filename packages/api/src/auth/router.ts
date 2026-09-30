import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "../index.js";
import { passwordResets, refreshTokens, users } from "../db/schema.js";
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

const RESET_CODE_TTL_MINUTES = 30;

/**
 * The reset code is returned in the response only when no email provider is
 * configured, so local development works without mail. Never enable this in a
 * deployed environment: it would hand an account-takeover code to any caller
 * who knows an email address.
 */
function devResetCodesAllowed(): boolean {
  return process.env.EXPOSE_RESET_CODE === "true" && process.env.NODE_ENV !== "production";
}

function hashResetCode(code: string): string {
  return hashRefreshToken(code);
}

/**
 * Small in-process limiter. Sufficient for a single-instance deployment; a
 * multi-instance setup needs a shared store (Redis or the database).
 */
function createRateLimiter(options: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function prune(now: number) {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }

  return function consume(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    if (hits.size > 5000) prune(now);

    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (entry.count >= options.max) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

const forgotLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
const resetLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

function limiterKey(req: { ip?: string }, fallback: string): string {
  return req.ip ?? fallback;
}

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== "string") {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const limit = forgotLimiter(limiterKey(req, "unknown"));
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    res.status(429).json({
      error: "too many reset requests. Wait a while before asking for another code."
    });
    return;
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).execute();
  if (rows.length === 0) {
    // Same response shape whether or not the account exists, so this endpoint
    // cannot be used to discover which email addresses are registered.
    res.json({
      ok: true,
      message: "If that email is registered, a reset code has been issued."
    });
    return;
  }
  const code = randomBytes(4).toString("base64url");
  await db.insert(passwordResets).values({
    userId: rows[0].id,
    tokenHash: hashResetCode(code),
    expiresAt: new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000)
  });

  if (!devResetCodesAllowed()) {
    res.json({
      ok: true,
      message: "If that email is registered, a reset code has been issued."
    });
    return;
  }

  res.json({
    ok: true,
    message: "A reset code has been issued.",
    devCode: code,
    devNote: "Local development only: no email is sent. Set EXPOSE_RESET_CODE=true to see this."
  });
});

router.post("/reset-password", async (req, res) => {
  const { email, code, password } = req.body ?? {};
  if (typeof email !== "string" || typeof code !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "email, code, and a new password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "password must be at least 8 characters" });
    return;
  }

  const limit = resetLimiter(`${limiterKey(req, "unknown")}:${email.toLowerCase()}`);
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    res.status(429).json({
      error: "too many attempts. Wait a while before trying the code again."
    });
    return;
  }

  // One message for every failure mode, so this endpoint cannot be used to
  // find out which email addresses have accounts.
  const invalidCode = { error: "invalid email or reset code" };

  const userRows = await db.select().from(users).where(eq(users.email, email)).execute();
  const user = userRows[0];
  if (!user) {
    res.status(400).json(invalidCode);
    return;
  }
  const resetRows = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.userId, user.id), eq(passwordResets.tokenHash, hashResetCode(code))))
    .execute();
  const reset = resetRows[0];
  if (!reset || reset.consumedAt || reset.expiresAt.getTime() < Date.now()) {
    res.status(400).json(invalidCode);
    return;
  }

  // A reset code is single use. Retire it before the password is written so a
  // failed write cannot leave a live code behind.
  await db
    .update(passwordResets)
    .set({ consumedAt: new Date() })
    .where(eq(passwordResets.id, reset.id))
    .execute();

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id)).execute();
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, user.id))
    .execute();
  res.json({ ok: true, message: "Password updated. You can now sign in." });
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