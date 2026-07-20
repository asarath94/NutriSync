import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { RegisterRequestSchema, LoginRequestSchema, type AuthResponse, type Role } from "@nutrisync/shared";
import { UserModel } from "../models/user.model.js";
import { FamilyGroupModel } from "../models/family-group.model.js";
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_MAX_AGE_MS, signAccessToken } from "../lib/jwt.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";

export const authRouter = Router();

// Registration abuse and login brute-forcing aren't the same threat, so each
// route gets its own counter - a burst against one shouldn't eat the other's
// budget. Same threshold for both: no clear reason yet for them to differ.
function createAuthRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

const registerRateLimit = createAuthRateLimit();
const loginRateLimit = createAuthRateLimit();

interface PublicUserSource {
  _id: unknown;
  email: string;
  name: string;
  familyGroupId: unknown;
  role: string;
  createdAt: Date;
}

function toPublicUser(user: PublicUserSource): AuthResponse["user"] {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    familyGroupId: String(user.familyGroupId),
    role: user.role as Role,
    createdAt: user.createdAt.toISOString(),
  };
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

authRouter.post("/register", registerRateLimit, async (req, res) => {
  const parsed = RegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  // role is never read from the request body - it's derived below purely from
  // whether familyGroupId was provided and (if so) resolves to an existing group.
  const { email, password, name, familyGroupId } = parsed.data;

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  let resolvedFamilyGroupId: string;
  let role: Role;
  // Pre-generated so the new group's ownerId can point at it without a
  // second write when the user becomes the owner of a brand new group.
  const newUserId = new mongoose.Types.ObjectId();

  if (familyGroupId) {
    const group = await FamilyGroupModel.findById(familyGroupId).lean();
    if (!group) {
      res.status(404).json({ error: "Family group not found" });
      return;
    }
    resolvedFamilyGroupId = String(group._id);
    role = "member";
  } else {
    const group = await FamilyGroupModel.create({ name: `${name}'s Family`, ownerId: newUserId });
    resolvedFamilyGroupId = String(group._id);
    role = "owner";
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({
    _id: newUserId,
    email,
    passwordHash,
    name,
    familyGroupId: resolvedFamilyGroupId,
    role,
    tokenVersion: 0,
  });

  const token = signAccessToken({ sub: String(user._id), familyGroupId: resolvedFamilyGroupId, tokenVersion: 0 });
  setAuthCookie(res, token);

  const body: AuthResponse = { user: toPublicUser(user) };
  res.status(201).json(body);
});

authRouter.post("/login", loginRateLimit, async (req, res) => {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signAccessToken({
    sub: String(user._id),
    familyGroupId: String(user.familyGroupId),
    tokenVersion: user.tokenVersion,
  });
  setAuthCookie(res, token);

  const body: AuthResponse = { user: toPublicUser(user) };
  res.json(body);
});

authRouter.post("/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
  // Bumping tokenVersion invalidates the cookie being cleared below even if
  // it was already copied elsewhere - logout has real teeth, not just a
  // cleared cookie the client happens to honor.
  await UserModel.findByIdAndUpdate(req.user!.id, { $inc: { tokenVersion: 1 } });
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  res.status(204).send();
});
