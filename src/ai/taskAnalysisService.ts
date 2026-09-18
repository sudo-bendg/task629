import { Task } from "../db/models/task";

export interface TaskAnalysisServiceDependencies {
  analyseTask: (taskDescription: string) => Promise<string[]>;
  reviewTask: (
    taskDescription: string,
    skills: string[],
    otherTasks: { description: string; skills: string[] }[],
  ) => Promise<string[]>;
}

export class TaskAnalysisService {
  constructor(private readonly dependencies: TaskAnalysisServiceDependencies) {}

  async analyseNextTask(): Promise<void> {
    const taskToAnalyse = await Task.findOne({ status: "NEW" });

    if (!taskToAnalyse) {
      await this.reviewCompletedTasks();
      return;
    }

    console.log(`Analysing task: ${taskToAnalyse.description}`);

    const skills = await this.dependencies.analyseTask(
      taskToAnalyse.description,
    );

    taskToAnalyse.status = "COMPLETE";
    taskToAnalyse.skills = skills;
    await taskToAnalyse.save();

    console.log(`Finished task analysis of: ${taskToAnalyse.description}`);
  }

  private async reviewCompletedTasks(): Promise<void> {
    const tasksToReview = await Task.find({ status: "COMPLETE" })
      .sort({ createdAt: 1 })
      .limit(10)
      .exec();

    if (tasksToReview.length === 0) {
      console.log("no task found");
      return;
    }

    const reviewContext = tasksToReview.map((task) => ({
      description: task.description,
      skills: [...task.skills],
    }));

    for (const [taskIndex, task] of tasksToReview.entries()) {
      console.log(`Reviewing task: ${task.description}`);

      task.skills = await this.dependencies.reviewTask(
        task.description,
        task.skills,
        reviewContext.filter((_, contextIndex) => contextIndex !== taskIndex),
      );
      task.status = "REVIEWED";
      await task.save();

      console.log(`Finished task review of: ${task.description}`);
    }
  }
}
