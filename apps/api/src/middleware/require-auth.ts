import type { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/user.model.js";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "../lib/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; familyGroupId: string; role: "owner" | "member" };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = (req.cookies as Record<string, string | undefined> | undefined)?.[ACCESS_TOKEN_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await UserModel.findById(payload.sub).select("familyGroupId role tokenVersion").lean();

  // tokenVersion mismatch means this token was issued before a logout (or
  // future "log out everywhere") bumped it - treat it as unauthenticated.
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  req.user = {
    id: String(user._id),
    familyGroupId: String(user.familyGroupId),
    role: user.role as "owner" | "member",
  };
  next();
}
