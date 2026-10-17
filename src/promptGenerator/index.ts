import {
  buildTaskAnalysisPrompt,
  buildTaskReviewPrompt,
  buildGoalAnalysisPrompt,
  buildGoalTaskMatchPrompt,
} from "./promptBuilder";

const generateTaskAnalysisRequest = (task: string) => {
  return buildTaskAnalysisPrompt(task);
};

const generateGoalAnalysisRequest = (goal: string, tasks: string[]) => {
  return buildGoalAnalysisPrompt(goal, tasks);
};

const generateGoalTaskMatchRequest = (goal: string, task: string) => {
  return buildGoalTaskMatchPrompt(goal, task);
};

const generateTaskReviewRequest = (
  task: string,
  skills: string[],
  otherTasks: { description: string; skills: string[] }[] = [],
) => {
  return buildTaskReviewPrompt(task, skills, otherTasks);
};

const generateHelpMessage = () => {
  return `
Available commands:

/help - Show this help message
/goal set <goal> - Set a new goal
/goal remove <goal> - Remove an existing goal
/goal list - List all current goals
/goal analyse - Analyse all current goals
/goal report - Generate a report of the current goals and their analysis
/config set profile <profile> - Set the client profile for prompt generation

Alternatively, you can send any other message to the bot, and it will attempt to process it as a task.
`;
}

export {
  generateTaskAnalysisRequest,
  generateGoalAnalysisRequest,
  generateGoalTaskMatchRequest,
  generateTaskReviewRequest,
  generateHelpMessage
};
