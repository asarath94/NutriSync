import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false - never returned by a default query, must opt in with .select("+passwordHash")
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    familyGroupId: { type: Schema.Types.ObjectId, ref: "FamilyGroup", required: true },
    role: { type: String, enum: ["owner", "member"], required: true },
    // Bumped to invalidate every JWT issued before the bump (logout, "log out everywhere").
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = model("User", userSchema);
