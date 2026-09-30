import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const DEV_SECRET = "rural-help-dev-secret";
const JWT_SECRET = process.env.JWT_SECRET ?? DEV_SECRET;

if (JWT_SECRET === DEV_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set to a unique value in production.");
  }
  console.warn(
    "[auth] JWT_SECRET is not set. Using the development secret. Never do this in production."
  );
}

const secret = new TextEncoder().encode(JWT_SECRET);

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

export type AccessTokenPayload = {
  sub: string;
  role: string;
};

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  if (!payload.sub) {
    throw new Error("token missing subject");
  }
  return { sub: payload.sub, role: String(payload.role ?? "") };
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}