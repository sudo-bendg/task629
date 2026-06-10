import { Bot, TaskHandler } from './bot/bot';
import { getConnection } from './db/connect';
import { Task } from './db/models/task';
import dotenv from 'dotenv';

dotenv.config();
const telegramBotKey = process.env.TELEGRAM_BOT_KEY || '';
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING || '';

class TaskLogger implements TaskHandler {
    handle(task: string): Promise<void> {
        console.log(`Task revieved: ${task}`)
        return Promise.resolve();
    }
}

(async () => {
    getConnection(mongoConnectionString);
    const taskLogger = new TaskLogger();
    const bot = new Bot(telegramBotKey, taskLogger);
    const myTask = await Task.create({description: "I did a thing"})
})();