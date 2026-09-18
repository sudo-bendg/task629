import { Task } from "../db/models/task";

export interface TaskAnalysisServiceDependencies {
  analyseTask: (taskDescription: string) => Promise<string[]>;
}

export class TaskAnalysisService {
  constructor(private readonly dependencies: TaskAnalysisServiceDependencies) {}

  async analyseNextTask(): Promise<void> {
    const taskToAnalyse = await Task.findOne({ status: "NEW" });

    if (!taskToAnalyse) {
      console.log("no task found");
      return;
    }

    console.log(`Analysing task: ${taskToAnalyse.description}`);

    const skills = await this.dependencies.analyseTask(taskToAnalyse.description);

    taskToAnalyse.status = "COMPLETE";
    taskToAnalyse.skills = skills;
    await taskToAnalyse.save();

    console.log(`Finished task analysis of: ${taskToAnalyse.description}`);
  }
}
