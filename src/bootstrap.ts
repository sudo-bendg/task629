import { AI } from "./ai/ai";
import { TaskAnalysisService } from "./ai/taskAnalysisService";
import { Gemini } from "./ai/gemini/gemini";
import { GroqClass } from "./ai/groq/groq";
import { Ollama } from "./ai/ollama/ollama";
import { Bot } from "./bot/bot";
import { DefaultTaskHandler } from "./bot/defaultTaskHandler";
import { getConnection } from "./db/connect";

export const HOUR_IN_MS = 60 * 60 * 1000;

export interface AppConfig {
  telegramBotKey: string;
  mongoConnectionString: string;
  defaultModel: string;
  strongerModel: string;
  ollamaUrl: string;
  geminiApiKey: string;
  groqApiKey: string;
}

export const getAppConfig = (
  env: NodeJS.ProcessEnv = process.env,
): AppConfig => ({
  telegramBotKey: env.TELEGRAM_BOT_KEY || "",
  mongoConnectionString: env.MONGO_CONNECTION_STRING || "",
  defaultModel: env.DEFAULT_MODEL || "",
  strongerModel: env.STRONGER_MODEL || env.DEFAULT_MODEL || "",
  ollamaUrl: env.OLLAMA_URL || "",
  geminiApiKey: env.GEMINI_API_KEY || "",
  groqApiKey: env.GROQ_API_KEY || "",
});

export const resolveAIProvider = (config: AppConfig): AI => {
  if (config.geminiApiKey) {
    return new Gemini(config.geminiApiKey, config.defaultModel);
  }

  if (config.ollamaUrl) {
    return new Ollama(config.ollamaUrl, config.defaultModel);
  }

  if (config.groqApiKey) {
    return new GroqClass(config.groqApiKey, config.defaultModel);
  }

  throw new Error("No AI provider is configured");
};

export const startAnalysisLoop = (
  service: Pick<TaskAnalysisService, "analyseNextTask">,
  intervalMs: number = HOUR_IN_MS,
): NodeJS.Timeout => {
  const runOnce = () => {
    void service.analyseNextTask().catch(console.error);
  };

  runOnce();

  return setInterval(runOnce, intervalMs);
};

export const bootstrapApp = async (
  config: AppConfig = getAppConfig(),
): Promise<void> => {
  await getConnection(config.mongoConnectionString);

  const taskHandler = new DefaultTaskHandler();
  const bot = new Bot(config.telegramBotKey, taskHandler);

  if (!bot) {
    console.log("Issue starting bot");
  }

  const ai = resolveAIProvider(config);
  const taskAnalysisService = new TaskAnalysisService({
    analyseTask: (taskDescription) => ai.analyseTask(taskDescription),
    reviewTask: (taskDescription, skills, otherTasks) =>
      ai.reviewTask(taskDescription, skills, config.strongerModel, otherTasks),
  });

  await taskAnalysisService.analyseNextTask().catch(console.error);
  startAnalysisLoop(taskAnalysisService);
};
