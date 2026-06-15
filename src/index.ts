import { Bot } from "./bot/bot";
import { getConnection } from "./db/connect";
import dotenv from "dotenv";
import { Ollama } from "./ollama/ollama";
import { DefaultTaskHandler } from "./bot/defaultTaskHandler";
import { analyseNextTask } from "./ollama/analyseTask";

dotenv.config();
const telegramBotKey = process.env.TELEGRAM_BOT_KEY || "";
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING || "";
const defaultModel = process.env.DEFAULT_MODEL || "";
const ollamaUrl = process.env.OLLAMA_URL || "";

const HOUR = 60 * 60 * 1000;

(async () => {
  getConnection(mongoConnectionString);
  const taskHandler = new DefaultTaskHandler();

  const bot = new Bot(telegramBotKey, taskHandler);
  if (!bot) {
    console.log("Issue starting bot");
  }
  const ollama = new Ollama(`${ollamaUrl}/api/generate`, defaultModel);

  await analyseNextTask(ollama).catch(console.error);

  setInterval(() => {
    analyseNextTask(ollama).catch(console.error);
  }, HOUR);
})();
