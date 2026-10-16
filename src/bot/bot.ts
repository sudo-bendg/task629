import { Input, Telegraf } from "telegraf";
import { message } from "telegraf/filters";

export interface TaskHandler {
  handle(task: string): Promise<void>;
}

export interface GoalHandler {
  handle(
    message: string,
    sendReport?: (html: string) => Promise<void>,
  ): Promise<void>;
  handleNewGoal(goal: string): Promise<void>;
  handleRemoveGoal(goal: string): Promise<void>;
  handleListGoals(): Promise<void>;
}

export interface ConfigHandler {
  handle(operation: string, attribute: string, value: string): Promise<void>;
}

export interface TextMessageContext {
  message: { text?: string };
  replyWithDocument?: (
    document: ReturnType<typeof Input.fromBuffer>,
  ) => Promise<unknown>;
}

export class Bot {
  bot: Telegraf;
  taskHandler: TaskHandler;
  goalHandler: GoalHandler;
  configHandler: ConfigHandler;

  constructor(
    botToken: string,
    taskHandler: TaskHandler,
    goalHandler: GoalHandler,
    configHandler: ConfigHandler,
  ) {
    this.bot = new Telegraf(botToken);
    this.taskHandler = taskHandler;
    this.goalHandler = goalHandler;
    this.configHandler = configHandler;

    this.bot.on(message("text"), this.handleTelegramMessage.bind(this));

    this.bot.launch();
  }

  async handleTelegramMessage(ctx: TextMessageContext): Promise<void> {
    const text = ctx.message.text;

    if (!text) {
      console.log("Received a message with no text.");
      return;
    }

    if (/^\/config(?:\s|$)/.test(text)) {
      const command = text
        .trim()
        .match(/^\/config\s+(\S+)\s+(\S+)(?:\s+([\s\S]*))?$/);
      if (!command) {
        console.log(`Invalid config command: ${text}`);
        return;
      }

      const operation = command[1];
      const attribute = command[2];
      if (!operation || !attribute) {
        console.log(`Invalid config command: ${text}`);
        return;
      }

      const value = command[3] ?? "";
      await this.configHandler.handle(operation, attribute, value.trim());
    } else if (text.startsWith("/goal")) {
      const message = text.substring("/goal ".length).trim();
      if (message === "report") {
        await this.goalHandler.handle(message, async (html) => {
          if (!ctx.replyWithDocument) {
            throw new Error(
              "Cannot send the report without a Telegram reply context",
            );
          }
          await ctx.replyWithDocument(
            Input.fromBuffer(Buffer.from(html, "utf8"), "goal-report.html"),
          );
        });
      } else {
        await this.goalHandler.handle(message);
      }
    } else {
      await this.taskHandler.handle(text);
    }
  }
}
