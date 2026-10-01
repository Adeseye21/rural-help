import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
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

export function siteAuthGate(req: Request, res: Response, next: NextFunction): void {
  // Must call next() when inactive. Returning without it leaves the request
  // hanging forever, which looks like the whole server died.
  if (!isProduction || !SITE_PASSWORD) return next();
  if (OPEN_PATHS.has(req.path)) return next();

  const header = req.headers.authorization;
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator > -1) {
      const user = decoded.slice(0, separator);
      const pass = decoded.slice(separator + 1);
      if (safeEquals(user, SITE_USERNAME) && safeEquals(pass, SITE_PASSWORD)) {
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