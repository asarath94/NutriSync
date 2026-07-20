import { z } from "zod";

export const RoleSchema = z.enum(["owner", "member"]);
export type Role = z.infer<typeof RoleSchema>;

/**
 * Public-safe shape of a User — never carries the password hash.
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  familyGroupId: z.string(),
  role: RoleSchema,
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;
