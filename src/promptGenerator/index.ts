import {
  buildTaskAnalysisPrompt,
  buildTaskReviewPrompt,
} from "./promptBuilder";

const generateTaskAnalysisRequest = (task: string) => {
  return buildTaskAnalysisPrompt(task);
};

const generateTaskReviewRequest = (
  task: string,
  skills: string[],
  otherTasks: { description: string; skills: string[] }[] = [],
) => {
  return buildTaskReviewPrompt(task, skills, otherTasks);
};

export { generateTaskAnalysisRequest, generateTaskReviewRequest };
