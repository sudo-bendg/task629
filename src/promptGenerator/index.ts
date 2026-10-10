import {
  buildTaskAnalysisPrompt,
  buildTaskReviewPrompt,
  buildGoalAnalysisPrompt,
} from "./promptBuilder";

const generateTaskAnalysisRequest = (task: string) => {
  return buildTaskAnalysisPrompt(task);
};

const generateGoalAnalysisRequest = (goal: string, tasks: string[]) => {
  return buildGoalAnalysisPrompt(goal, tasks);
};

const generateTaskReviewRequest = (
  task: string,
  skills: string[],
  otherTasks: { description: string; skills: string[] }[] = [],
) => {
  return buildTaskReviewPrompt(task, skills, otherTasks);
};

export {
  generateTaskAnalysisRequest,
  generateGoalAnalysisRequest,
  generateTaskReviewRequest,
};
