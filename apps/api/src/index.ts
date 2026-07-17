import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import { HealthCheckSchema } from "@nutrisync/shared";
import { connectToDatabase } from "./db.js";

// Load the repo-root .env regardless of whether this runs from src (tsx)
// or dist (node) — both live exactly two levels below the repo root.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.get("/health", (_req, res) => {
  const body = HealthCheckSchema.parse({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });

  res.json(body);
});

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

// Connecting to MongoDB is best-effort at startup so the API stays usable
// (e.g. /health) even before a database is configured locally.
connectToDatabase().catch((err) => {
  console.warn(`[db] failed to connect: ${(err as Error).message}`);
});
