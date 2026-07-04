import { TaskHandler } from "./bot";
import { DatabaseStrategy } from "../db/databaseStrategy";

class DefaultTaskHandler implements TaskHandler {
  private db: DatabaseStrategy;

  constructor(db: DatabaseStrategy) {
    this.db = db;
  }

  async handle(task: string): Promise<void> {
    console.log(`Task revieved: ${task}`);
    await this.db.createTask(task);
  }
}

export { DefaultTaskHandler };
