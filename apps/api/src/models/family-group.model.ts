import { Schema, model } from "mongoose";

const familyGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const FamilyGroupModel = model("FamilyGroup", familyGroupSchema);
