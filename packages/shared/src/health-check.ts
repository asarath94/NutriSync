import { z } from "zod";

/**
 * Placeholder schema shared across apps/api, apps/web, and apps/mobile.
 * Used today by the api's `/health` route; more schemas will live
 * alongside this one as real domain logic is added.
 */
export const HealthCheckSchema = z.object({
  status: z.enum(["ok", "error"]),
  uptime: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;
