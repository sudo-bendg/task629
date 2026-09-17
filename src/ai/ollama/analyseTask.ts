import { Task } from "../../db/models/task";
import { generateTaskAnalysisRequest } from "../../promptGenerator";
import { AI } from "../ai";

const analyseTask = async (task: string, ai: AI): Promise<string[]> => {
  let prompt = "";

  try {
    prompt = generateTaskAnalysisRequest(task);
  } catch (err) {
    console.log(err);
  }

  const response = await ai.request(prompt);
  const skills: string[] = response.split(",");

  return skills;
};

const analyseNextTask = async (ai: AI): Promise<void> => {
  const taskToAnalyse = await Task.findOne({ status: "NEW" });

  if (!taskToAnalyse) {
    console.log("no task found");
    return;
  }

  console.log(`Analysing task: ${taskToAnalyse.description}`);

  const skills: string[] = await analyseTask(taskToAnalyse.description, ai);

  taskToAnalyse.status = "COMPLETE";
  taskToAnalyse.skills = skills;
  await taskToAnalyse.save();

  console.log(`Finished task analysis of: ${taskToAnalyse.description}`);
};

export { analyseNextTask };
