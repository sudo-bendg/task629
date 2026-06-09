import { Bot, TaskHandler } from './bot';
import dotenv from 'dotenv';

dotenv.config();
const telegramBotKey = process.env.TELEGRAM_BOT_KEY || ''; 

class TaskLogger implements TaskHandler {
    handle(task: string): Promise<void> {
        console.log(`Task revieved: ${task}`)
        return Promise.resolve();
    }
}

const taskLogger = new TaskLogger();
const bot = new Bot(telegramBotKey, taskLogger)