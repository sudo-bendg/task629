import { Bot } from "./bot/bot";
import { MongoDatabaseStrategy } from "./db/mongo/mongoStrategy";
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
  const db = new MongoDatabaseStrategy(mongoConnectionString);
  await db.connect();

  const taskHandler = new DefaultTaskHandler(db);

  const bot = new Bot(telegramBotKey, taskHandler);
  if (!bot) {
    console.log("Issue starting bot");
  }
  const ollama = new Ollama(`${ollamaUrl}/api/generate`, defaultModel);

  await analyseNextTask(ollama, db).catch(console.error);

  setInterval(() => {
    analyseNextTask(ollama, db).catch(console.error);
  }, HOUR);
})();
