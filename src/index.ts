import { Bot } from "./bot/bot";
import { getConnection } from "./db/connect";
import dotenv from "dotenv";
import { AI } from "./ai/ai";
import { Gemini } from "./ai/gemini/gemini";
import { Ollama } from "./ai/ollama/ollama";
import { DefaultTaskHandler } from "./bot/defaultTaskHandler";
import { analyseNextTask } from "./ai/ollama/analyseTask";
import { GroqClass } from "./ai/groq/groq";

dotenv.config();
const telegramBotKey = process.env.TELEGRAM_BOT_KEY || "";
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING || "";
const defaultModel = process.env.DEFAULT_MODEL || "";
const ollamaUrl = process.env.OLLAMA_URL || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";

const HOUR = 60 * 60 * 1000;

(async () => {
  getConnection(mongoConnectionString);
  const taskHandler = new DefaultTaskHandler();

  const bot = new Bot(telegramBotKey, taskHandler);
  if (!bot) {
    console.log("Issue starting bot");
  }
  let ai: AI;
  if (geminiApiKey) {
    ai = new Gemini(geminiApiKey, defaultModel);
  } else if (ollamaUrl) {
    ai = new Ollama(ollamaUrl, defaultModel);
  } else if (process.env.GROQ_API_KEY) {
    ai = new GroqClass(process.env.GROQ_API_KEY, defaultModel);
  } else {
    throw new Error("No AI provider is configured");
  }

  await analyseNextTask(ai).catch(console.error);

  setInterval(() => {
    analyseNextTask(ai).catch(console.error);
  }, HOUR);
})();
