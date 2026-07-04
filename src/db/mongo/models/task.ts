import mongoose, { Schema } from "mongoose";

const TaskSchema = new Schema(
  {
    description: { type: String, required: true },
    skills: [{ type: String }],
    status: { type: String, enum: ["NEW", "COMPLETE"], default: "NEW" },
  },
  { timestamps: true },
);

const Task = mongoose.model("Task", TaskSchema);

export { Task };
