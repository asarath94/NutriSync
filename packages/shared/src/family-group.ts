import { z } from "zod";

export const FamilyGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  ownerId: z.string(),
  createdAt: z.string().datetime(),
});
export type FamilyGroup = z.infer<typeof FamilyGroupSchema>;
