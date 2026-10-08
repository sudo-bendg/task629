import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

export interface TaskHandler {
  handle(task: string): Promise<void>;
}

export interface GoalHandler {
  handle(message: string): Promise<void>;
  handleNewGoal(goal: string): Promise<void>;
  handleRemoveGoal(goal: string): Promise<void>;
  handleListGoals(): Promise<void>;
}

export interface TextMessageContext {
  message: { text?: string };
}

export class Bot {
  bot: Telegraf;
  taskHandler: TaskHandler;
  goalHandler: GoalHandler;

  constructor(
    botToken: string,
    taskHandler: TaskHandler,
    goalHandler: GoalHandler,
  ) {
    this.bot = new Telegraf(botToken);
    this.taskHandler = taskHandler;
    this.goalHandler = goalHandler;

    this.bot.on(message("text"), this.handleTelegramMessage.bind(this));

    this.bot.launch();
  }

  async handleTelegramMessage(ctx: TextMessageContext): Promise<void> {
    const text = ctx.message.text;

    if (!text) {
      console.log("Received a message with no text.");
      return;
    }

    if (text.startsWith("/goal")) {
      const message = text.substring("/goal ".length).trim();
      await this.goalHandler.handle(message);
    } else {
      await this.taskHandler.handle(text);
    }
  }
}
