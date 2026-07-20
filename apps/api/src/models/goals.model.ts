import { Schema, model } from "mongoose";

const goalsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dailyCalories: { type: Number, required: true, min: 0 },
    proteinGrams: { type: Number, required: true, min: 0 },
    carbGrams: { type: Number, required: true, min: 0 },
    fatGrams: { type: Number, required: true, min: 0 },
    isShared: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export const GoalsModel = model("Goals", goalsSchema);
