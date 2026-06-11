import { Bot, TaskHandler } from './bot/bot';
import { getConnection } from './db/connect';
import { Task } from './db/models/task';
import dotenv from 'dotenv';
import { Ollama } from './ollama/ollama';
import { DefaultTaskHandler } from './bot/defaultTaskHandler';

dotenv.config();
const telegramBotKey = process.env.TELEGRAM_BOT_KEY || '';
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING || '';

(async () => {
    getConnection(mongoConnectionString);
    const taskHandler = new DefaultTaskHandler();
    
    const bot = new Bot(telegramBotKey, taskHandler);
    const ollama = new Ollama('http://192.168.1.124:11434/api/generate')
})();