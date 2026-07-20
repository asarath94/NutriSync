import { z } from "zod";

/**
 * Basic fields only — no calculation engine yet, that's a later phase.
 */
export const GoalsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dailyCalories: z.number().nonnegative(),
  proteinGrams: z.number().nonnegative(),
  carbGrams: z.number().nonnegative(),
  fatGrams: z.number().nonnegative(),
  // Owner-controlled: when true, visible (read-only) to other members of the
  // owner's family group. Toggling it stays owner-only.
  isShared: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Goals = z.infer<typeof GoalsSchema>;

const GoalsMutableFieldsSchema = GoalsSchema.pick({
  dailyCalories: true,
  proteinGrams: true,
  carbGrams: true,
  fatGrams: true,
});

export const GoalsCreateRequestSchema = GoalsMutableFieldsSchema.extend({
  isShared: z.boolean().optional().default(false),
});
export type GoalsCreateRequest = z.infer<typeof GoalsCreateRequestSchema>;

export const GoalsUpdateRequestSchema = GoalsMutableFieldsSchema.extend({
  isShared: z.boolean().optional(),
}).partial();
export type GoalsUpdateRequest = z.infer<typeof GoalsUpdateRequestSchema>;

export const GoalsResponseSchema = z.object({
  goals: GoalsSchema,
});
export type GoalsResponse = z.infer<typeof GoalsResponseSchema>;

// List endpoint mixes the caller's own goals with shared goals from family
// members - isOwner distinguishes which is which per item.
export const GoalsListResponseSchema = z.object({
  goals: z.array(GoalsSchema.extend({ isOwner: z.boolean() })),
});
export type GoalsListResponse = z.infer<typeof GoalsListResponseSchema>;
