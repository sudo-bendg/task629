import { generateTaskAnalysisRequest } from "../promptGenerator";
import { Task } from "../db/models/task";

export abstract class AI {
  abstract request(prompt: string, model?: string): Promise<string>;

  async analyseTask(task: string): Promise<string[]> {
    let prompt = "";

    try {
      prompt = generateTaskAnalysisRequest(task);
    } catch (err) {
      console.log(err);
    }

    const response = await this.request(prompt);
    return Array.from(
      new Set(
        response
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0),
      ),
    );
  }

  async analyseNextTask(): Promise<void> {
    const taskToAnalyse = await Task.findOne({ status: "NEW" });

    if (!taskToAnalyse) {
      console.log("no task found");
      return;
    }

    console.log(`Analysing task: ${taskToAnalyse.description}`);

    const skills = await this.analyseTask(taskToAnalyse.description);

    taskToAnalyse.status = "COMPLETE";
    taskToAnalyse.skills = skills;
    await taskToAnalyse.save();

    console.log(`Finished task analysis of: ${taskToAnalyse.description}`);
  }
}
