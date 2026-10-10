import mongoose, { Schema } from "mongoose";

const AnalysedTaskSchema = new Schema(
  {
    description: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

const CandidateTaskSchema = new Schema(
  {
    description: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ["PENDING", "MATCHED", "NOT_MATCHED"],
      required: true,
    },
  },
  { _id: false },
);

const AnalysisGoalSchema = new Schema(
  {
    goal: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETE"],
      required: true,
    },
    candidates: [CandidateTaskSchema],
    tasks: [AnalysedTaskSchema],
  },
  { _id: false },
);

const AnalysisSchema = new Schema(
  {
    status: { type: String, enum: ["IN_PROGRESS", "COMPLETE"] },
    goals: [AnalysisGoalSchema],
    retryCount: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AnalysisSchema.index({ status: 1, createdAt: 1 });

const Analysis = mongoose.model("Analysis", AnalysisSchema);

export { Analysis };
