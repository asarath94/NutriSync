import { z } from "zod";
import { UserSchema } from "./user.js";

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  // Omitted -> caller becomes owner of a newly created FamilyGroup.
  // Provided -> caller joins that existing FamilyGroup as a member.
  familyGroupId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid familyGroupId")
    .optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
