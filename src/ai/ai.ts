import {
  generateTaskAnalysisRequest,
  generateTaskReviewRequest,
  generateGoalAnalysisRequest,
  generateGoalTaskMatchRequest,
} from "../promptGenerator";

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

  async reviewTask(
    task: string,
    skills: string[],
    model?: string,
    otherTasks: { description: string; skills: string[] }[] = [],
  ): Promise<string[]> {
    const prompt = generateTaskReviewRequest(task, skills, otherTasks);
    const response = await this.request(prompt, model);

    return Array.from(
      new Set(
        response
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0),
      ),
    );
  }

  async analyseGoal(goal: string, tasks: string[]): Promise<string[]> {
    let prompt = "";

    try {
      prompt = generateGoalAnalysisRequest(goal, tasks);
    } catch (err) {
      console.log(err);
    }

    const response = await this.request(prompt);
    return Array.from(
      new Set(
        response
          .split("\n")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0),
      ),
    );
  }

  async taskDemonstratesGoal(goal: string, task: string): Promise<boolean> {
    const response = await this.request(
      generateGoalTaskMatchRequest(goal, task),
    );
    const answer = response.trim().toLowerCase();

    if (answer !== "true" && answer !== "false") {
      throw new Error(`Invalid goal match response: ${response}`);
    }

    return answer === "true";
  }
}
