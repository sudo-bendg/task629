import { buildTaskAnalysisPrompt } from "./promptBuilder";

const generateTaskAnalysisRequest = (task: string) => {
  return buildTaskAnalysisPrompt(task);
};

export { generateTaskAnalysisRequest };
