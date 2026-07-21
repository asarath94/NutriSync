import dns from "node:dns";
import mongoose from "mongoose";

// Works around a Node/Windows bug where mongodb+srv:// SRV lookups fail via
// Node's own resolver even though the OS resolver works fine - not a sign of
// anything wrong with the app or the connection string.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

/**
 * Connects to MongoDB using MONGODB_URI from the environment.
 * Skeleton only: no retry/backoff logic yet.
 */
export async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and set it.");
  }

  await mongoose.connect(uri);
  console.log("[db] connected to MongoDB");
}
