import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { HealthCheckSchema, type AuthResponse } from "@nutrisync/shared";
import { connectToDatabase } from "./db.js";
import { assertJwtSecretConfigured } from "./lib/jwt.js";
import { authRouter } from "./routes/auth.routes.js";
import { goalsRouter } from "./routes/goals.routes.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/require-auth.js";
import { UserModel } from "./models/user.model.js";

// Load the repo-root .env regardless of whether this runs from src (tsx)
// or dist (node) — both live exactly two levels below the repo root.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Fail fast: signing/verifying JWTs with an undefined secret is worse than
// starting up and silently minting untrustworthy tokens.
assertJwtSecretConfigured();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

// Pure JSON API today, no server-rendered HTML/assets — helmet's strict
// default CSP is fine as-is. Revisit if apps/api ever serves HTML directly.
app.use(helmet());

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header (curl, server-to-server, health checks) - allow.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    // apps/web sends the httpOnly auth cookie via credentials:'include' -
    // without this, the browser drops the Set-Cookie/cookie header entirely.
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  const body = HealthCheckSchema.parse({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });

  res.json(body);
});

app.use("/api/auth", authRouter);
app.use("/api/goals", goalsRouter);

app.get("/api/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await UserModel.findById(req.user!.id);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const body: AuthResponse = {
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      familyGroupId: String(user.familyGroupId),
      role: user.role as "owner" | "member",
      createdAt: user.createdAt.toISOString(),
    },
  };
  res.json(body);
});

// Centralized error handler - must be registered last, after all routes.
// Express recognizes it as error-handling middleware by its 4-argument arity.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[api] unhandled error:", err);

  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

// Connecting to MongoDB is best-effort at startup so the API stays usable
// (e.g. /health) even before a database is configured locally.
connectToDatabase().catch((err) => {
  console.warn(`[db] failed to connect: ${(err as Error).message}`);
});
