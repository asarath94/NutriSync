import { Router } from "express";
import mongoose from "mongoose";
import {
  GoalsCreateRequestSchema,
  GoalsUpdateRequestSchema,
  type GoalsListResponse,
  type GoalsResponse,
} from "@nutrisync/shared";
import { GoalsModel } from "../models/goals.model.js";
import { UserModel } from "../models/user.model.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/require-auth.js";

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

interface GoalsSource {
  _id: unknown;
  userId: unknown;
  dailyCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicGoals(goals: GoalsSource): GoalsResponse["goals"] {
  return {
    id: String(goals._id),
    userId: String(goals.userId),
    dailyCalories: goals.dailyCalories,
    proteinGrams: goals.proteinGrams,
    carbGrams: goals.carbGrams,
    fatGrams: goals.fatGrams,
    isShared: goals.isShared,
    createdAt: goals.createdAt.toISOString(),
    updatedAt: goals.updatedAt.toISOString(),
  };
}

// A malformed :id is indistinguishable from "not found" to the caller -
// same 404, no leak of which reason applied.
async function findGoalsById(id: string) {
  try {
    return await GoalsModel.findById(id);
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) return null;
    throw err;
  }
}

// Owner-only lookup - used by PATCH/DELETE. isShared only ever grants read
// access, so mutation stays gated on ownership regardless of its value.
async function findOwnGoals(id: string, userId: string) {
  const goals = await findGoalsById(id);
  if (!goals || String(goals.userId) !== userId) return null;
  return goals;
}

// Read visibility: the owner always, or a same-family-group member when the
// owner has toggled isShared on.
async function findVisibleGoals(id: string, requester: { id: string; familyGroupId: string }) {
  const goals = await findGoalsById(id);
  if (!goals) return null;

  if (String(goals.userId) === requester.id) {
    return { goals, isOwner: true };
  }

  if (goals.isShared) {
    const owner = await UserModel.findById(goals.userId).select("familyGroupId").lean();
    if (owner && String(owner.familyGroupId) === requester.familyGroupId) {
      return { goals, isOwner: false };
    }
  }

  return null;
}

goalsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const { id, familyGroupId } = req.user!;

  const familyMembers = await UserModel.find({ familyGroupId, _id: { $ne: id } })
    .select("_id")
    .lean();

  const [own, shared] = await Promise.all([
    GoalsModel.findOne({ userId: id }),
    GoalsModel.find({ userId: { $in: familyMembers.map((m) => m._id) }, isShared: true }),
  ]);

  const goals: GoalsListResponse["goals"] = [];
  if (own) goals.push({ ...toPublicGoals(own), isOwner: true });
  for (const g of shared) goals.push({ ...toPublicGoals(g), isOwner: false });

  const body: GoalsListResponse = { goals };
  res.json(body);
});

goalsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const parsed = GoalsCreateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const existing = await GoalsModel.findOne({ userId: req.user!.id }).lean();
  if (existing) {
    res.status(409).json({ error: "Goals already exist for this user" });
    return;
  }

  const goals = await GoalsModel.create({ userId: req.user!.id, ...parsed.data });
  const body: GoalsResponse = { goals: toPublicGoals(goals) };
  res.status(201).json(body);
});

goalsRouter.get("/:id", async (req: AuthenticatedRequest, res) => {
  const visible = await findVisibleGoals(String(req.params.id), req.user!);
  if (!visible) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const body: GoalsResponse = { goals: toPublicGoals(visible.goals) };
  res.json(body);
});

goalsRouter.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const parsed = GoalsUpdateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const goals = await findOwnGoals(String(req.params.id), req.user!.id);
  if (!goals) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  Object.assign(goals, parsed.data);
  await goals.save();
  const body: GoalsResponse = { goals: toPublicGoals(goals) };
  res.json(body);
});

goalsRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const goals = await findOwnGoals(String(req.params.id), req.user!.id);
  if (!goals) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await goals.deleteOne();
  res.status(204).send();
});
