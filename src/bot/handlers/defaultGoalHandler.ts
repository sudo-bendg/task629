import { GoalHandler } from "../bot";
import { Goal } from "../../db/models/goal";

class DefaultGoalHandler implements GoalHandler {
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