import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { HealthCheckSchema } from "@nutrisync/shared";
import { connectToDatabase } from "./db.js";

// Load the repo-root .env regardless of whether this runs from src (tsx)
// or dist (node) — both live exactly two levels below the repo root.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

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
  }),
);

app.get("/health", (_req, res) => {
  const body = HealthCheckSchema.parse({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });

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
