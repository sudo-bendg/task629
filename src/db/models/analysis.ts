import mongoose, { Schema } from "mongoose";

const AnalysedTaskSchema = new Schema(
  {
    description: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

const AnalysisSchema = new Schema(
  {
    goals: [
      {
        goal: { type: String, required: true },
        tasks: [AnalysedTaskSchema],
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

const Analysis = mongoose.model("Analysis", AnalysisSchema);

export { Analysis };
