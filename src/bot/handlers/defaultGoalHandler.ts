import { GoalHandler } from "../bot";
import { Goal } from "../../db/models/goal";

class DefaultGoalHandler implements GoalHandler {
  async handle(message: string): Promise<void> {
    if (message.startsWith("set")) {
      const title = message.substring("set ".length).trim();
      await this.handleNewGoal(title);
    } else if (message.startsWith("remove")) {
      const title = message.substring("remove ".length).trim();
      await this.handleRemoveGoal(title);
    } else if (message.startsWith("list")) {
      await this.handleListGoals();
    } else {
      console.log(`Unknown goal command: ${message}`);
    }
  }

  async handleNewGoal(title: string): Promise<void> {
    console.log(`Goal created: ${title}`);
    await Goal.create({ title });
  }

  async handleRemoveGoal(title: string): Promise<void> {
    console.log(`Goal removed: ${title}`);
    await Goal.deleteOne({ title });
  }

  async handleListGoals(): Promise<void> {
    const goals = await Goal.find({});
    console.log("Current goals:");
    goals.forEach((goal) => console.log(`- ${goal.title}`));
  }
}

export { DefaultGoalHandler };
