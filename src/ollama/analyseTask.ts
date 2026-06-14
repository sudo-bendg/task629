import { Task } from "../db/models/task";
import { generateTaskAnalysisRequest } from "../promptGenerator"
import { Ollama } from "./ollama";

const analyseTask = async (task: string, ollama: Ollama): Promise<string[]> => {
    let prompt: string = '';

    try {
        prompt = generateTaskAnalysisRequest(task);
    } catch (err) {
        console.log(err)
    }

    const response = await ollama.request(prompt);
    const skills: string[] = response.split(",");

    return skills;
}

const analyseNextTask = async (ollama: Ollama): Promise<void> => {
    const taskToAnalyse = await Task.findOne({status: "NEW"});
    
    if (!taskToAnalyse) {
        console.log("no task found")
        return;
    }

    console.log(`Analysing task: ${taskToAnalyse.description}`)

    const skills: string[] = await analyseTask(taskToAnalyse.description, ollama);

    taskToAnalyse.status = "COMPLETE";
    taskToAnalyse.skills = skills;
    await taskToAnalyse.save();

    console.log(`Finished task analysis of: ${taskToAnalyse.description}`)
}

export { analyseNextTask };