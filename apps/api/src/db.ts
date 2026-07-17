import mongoose from "mongoose";

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
