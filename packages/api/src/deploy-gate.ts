import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Rural Help is not meant to be reachable by the whole internet while its
 * clinical content is still unreviewed, so production builds can require a
 * shared password before serving anything at all.
 *
 * Neither value is required in development, which keeps local work frictionless.
 */
const SITE_USERNAME = process.env.SITE_BASIC_AUTH_USER ?? "ruralhelp";
const SITE_PASSWORD = process.env.SITE_BASIC_AUTH_PASSWORD;

const isProduction = process.env.NODE_ENV === "production";

function safeEquals(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Paths that must stay reachable without the site password so platform health
 * checks and uptime monitors still work.
 */
const OPEN_PATHS = new Set(["/health", "/healthz"]);

/**
 * Browsers send cookies automatically on same-origin fetch, alongside whatever
 * Authorization header the app sets itself. That matters because the app's
 * authenticated calls use `Authorization: Bearer <token>`, and an explicitly
 * set header *replaces* the browser's cached Basic credentials instead of
 * adding to them. Without the cookie, every logged-in API call would fail the
 * gate even though the human passed it.
 *
 * The cookie value is an HMAC keyed on the site password, so rotating the
 * password invalidates every issued cookie with no server-side session store.
 */
const GATE_COOKIE = "__rh_gate";
const GATE_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function gateCookieValue(password: string): string {
  return createHmac("sha256", password).update("rural-help-site-gate-v1").digest("hex");
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (!name || name in out) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      out[name] = decodeURIComponent(raw);
    } catch {
      out[name] = raw;
    }
  }
  return out;
}

function hasValidGateCookie(req: Request): boolean {
  if (!SITE_PASSWORD) return false;
  const presented = parseCookies(req.headers.cookie)[GATE_COOKIE];
  if (!presented) return false;
  const expected = gateCookieValue(SITE_PASSWORD);
  const a = Buffer.from(presented, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function grantGateAccess(res: Response): void {
  if (!SITE_PASSWORD) return;
  res.cookie(GATE_COOKIE, gateCookieValue(SITE_PASSWORD), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE_MS
  });
}

export function siteAuthGate(req: Request, res: Response, next: NextFunction): void {
  // Must call next() when inactive. Returning without it leaves the request
  // hanging forever, which looks like the whole server died.
  if (!isProduction || !SITE_PASSWORD) return next();
  if (OPEN_PATHS.has(req.path)) return next();
  if (hasValidGateCookie(req)) return next();

  const header = req.headers.authorization;
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator > -1) {
      const user = decoded.slice(0, separator);
      const pass = decoded.slice(separator + 1);
      if (safeEquals(user, SITE_USERNAME) && safeEquals(pass, SITE_PASSWORD)) {
        grantGateAccess(res);
        return next();
      }
    }
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Rural Help", charset="UTF-8"');
  res.status(401).json({ error: "Authentication required." });
}

/**
 * Browsers only need CORS when the API is served from a different origin than
 * the web app. Serving both from one origin (the production setup) makes this a
 * no-op, but a wildcard is unacceptable for an API holding health data, so the
 * allowlist falls back to same-origin only.
 */
export function corsOriginList(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string): boolean {
  const allowed = corsOriginList();
  return allowed.length === 0 ? false : allowed.includes(origin);
}

/**
 * Generates a strong password, for the operator to place in the host dashboard.
 * Printed on boot only when no password is configured in production, so the
 * first boot does not need a secret in version control.
 */
export function suggestSitePassword(): string {
  return randomBytes(18).toString("base64url");
}