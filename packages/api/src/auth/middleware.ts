import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./tokens.js";

export type AuthedUser = {
  id: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing access token" });
    return;
  }
  try {
    const payload = await verifyAccessToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired access token" });
  }
}