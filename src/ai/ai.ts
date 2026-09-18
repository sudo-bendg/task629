import { generateTaskAnalysisRequest } from "../promptGenerator";

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
}
