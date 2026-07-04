import mongoose from "mongoose";
import { DatabaseStrategy, ITask } from "../databaseStrategy";
import { Task } from "./models/task";

export class MongoDatabaseStrategy implements DatabaseStrategy {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    await mongoose.connect(this.connectionString);
    console.log("database connected");
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }

  async createTask(description: string): Promise<ITask> {
    const task = await Task.create({ description });
    return {
      id: task._id.toString(),
      description: task.description,
      skills: task.skills || [],
      status: task.status as "NEW" | "COMPLETE",
    };
  }

  async getNextTaskToAnalyse(): Promise<ITask | null> {
    const task = await Task.findOne({ status: "NEW" });
    if (!task) return null;
    return {
      id: task._id.toString(),
      description: task.description,
      skills: task.skills || [],
      status: task.status as "NEW" | "COMPLETE",
    };
  }

  async saveTask(task: ITask): Promise<ITask> {
    const doc = await Task.findById(task.id);
    if (!doc) {
      throw new Error(`Task with id ${task.id} not found`);
    }
    doc.description = task.description;
    doc.skills = task.skills;
    doc.status = task.status;
    const saved = await doc.save();
    return {
      id: saved._id.toString(),
      description: saved.description,
      skills: saved.skills || [],
      status: saved.status as "NEW" | "COMPLETE",
    };
  }
}
