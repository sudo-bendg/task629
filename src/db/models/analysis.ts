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
    goals: {
      type: Map,
      of: [AnalysedTaskSchema],
      required: true,
    },
  },
  { timestamps: true },
);

const Analysis = mongoose.model("Analysis", AnalysisSchema);

export { Analysis };
