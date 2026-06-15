import { Telegraf, Context } from "telegraf";
import { message } from "telegraf/filters";

export interface TaskHandler {
  handle(task: string): Promise<void>;
}

export type TextMessageContext = Context & { message: { text: string } };

export class Bot {
  bot: Telegraf;
  taskHandler: TaskHandler;

  constructor(botToken: string, taskHandler: TaskHandler) {
    this.bot = new Telegraf(botToken);
    this.taskHandler = taskHandler;

    this.bot.on(message("text"), this.handleTelegramMessage.bind(this));

    this.bot.launch();
  }

  async handleTelegramMessage(ctx: TextMessageContext): Promise<void> {
    await this.taskHandler.handle(ctx.message.text);
  }
}
