import mongoose, { Schema } from "mongoose";

const GoalSchema = new Schema(
  {
    title: { type: String, required: true },
  },
  { timestamps: true },
);

const Goal = mongoose.model("Goal", GoalSchema);

export { Goal };
