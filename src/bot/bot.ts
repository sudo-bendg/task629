import { Input, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { generateHelpMessage } from "../promptGenerator";

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
  reply?: (text: string) => Promise<unknown>;
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

    if (text.startsWith("/help")) {
      const helpMessage = generateHelpMessage();
      if (ctx.reply) {
        await ctx.reply(helpMessage);
      } else {
        console.log("Cannot send the help message without a Telegram reply context");
      }
    } else if (text.startsWith("/config")) {
      const command = text.substring("/config ".length).trim();
      if (!command) {
        console.log(`Invalid config command: ${text}`);
        return;
      }

      const [operation, attribute, ...valueParts] = command.split(/\s+/);
      if (!operation || !attribute || valueParts.length === 0) {
        console.log(`Invalid config command: ${text}`);
        return;
      }

      const value = valueParts.join(" ");
      await this.configHandler.handle(operation, attribute, value);
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
      // add tick sticker reaction to indicate task has been received and is being processed

    }
  }
}
