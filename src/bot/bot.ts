import { Telegraf, Context } from "telegraf";
import { message } from "telegraf/filters";

export interface TaskHandler {
  handle(task: string): Promise<void>;
}

export interface GoalHandler {
  handleNewGoal(goal: string): Promise<void>;
  handleRemoveGoal(goal: string): Promise<void>;
  handleListGoals(): Promise<void>;
}

export type TextMessageContext = Context & { message: { text: string }, reply: (text: string) => Promise<void> };

export class Bot {
  bot: Telegraf;
  taskHandler: TaskHandler;
  goalHandler: GoalHandler;

  constructor(botToken: string, taskHandler: TaskHandler, goalHandler: GoalHandler) {
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

    if (text.startsWith("/setgoal ")) {
      const goalTitle = text.substring("/setgoal ".length).trim();
      await this.goalHandler.handleNewGoal(goalTitle);
      ctx.reply(`Goal set: ${goalTitle}`);
    }
    else if (text.startsWith("/removegoal ")) {
      const goalTitle = text.substring("/removegoal ".length).trim();
      await this.goalHandler.handleRemoveGoal(goalTitle);
    }
    else if (text === "/listgoals") {
      await this.goalHandler.handleListGoals();
    }
    else {
      await this.taskHandler.handle(ctx.message.text);
    }
  }
}
