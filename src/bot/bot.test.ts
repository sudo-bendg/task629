import { Telegraf } from "telegraf";
import { Bot, TaskHandler, TextMessageContext } from "./bot";

const mockOn = jest.fn();
const mockLaunch = jest.fn().mockResolvedValue(undefined);

jest.mock("telegraf", () => {
  return {
    Telegraf: jest.fn().mockImplementation(() => {
      return {
        on: mockOn,
        launch: mockLaunch,
      };
    }),
  };
});

jest.mock("telegraf/filters", () => {
  return {
    message: jest.fn().mockImplementation((type) => type),
  };
});

const TOKEN = "123";

describe("bot", () => {
  let mockHandler: TaskHandler;
  let bot: Bot;

  beforeEach(() => {
    mockOn.mockClear();
    mockLaunch.mockClear();
    (Telegraf as unknown as jest.Mock).mockClear();
    mockHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    bot = new Bot(TOKEN, mockHandler);
  });

  test("initializes and launches the telegram bot", () => {
    expect(Telegraf).toHaveBeenCalledWith(TOKEN);
    expect(mockOn).toHaveBeenCalledWith("text", expect.any(Function));
    expect(mockLaunch).toHaveBeenCalled();
  });

  const createMockContext = (text?: string) =>
    ({
      message: text !== undefined ? { text } : {},
    }) as TextMessageContext;

  test("passes received telegram messages to the task handler", async () => {
    const mockCtx = createMockContext("Write blog post");
    await bot.handleTelegramMessage(mockCtx);
    expect(mockHandler.handle).toHaveBeenCalledWith("Write blog post");
  });

  test("calls the task handler exactly once", async () => {
    const mockCtx = createMockContext("Build API");
    await bot.handleTelegramMessage(mockCtx);
    expect(mockHandler.handle).toHaveBeenCalledTimes(1);
  });

  test("propagates errors from the task handler", async () => {
    mockHandler.handle = jest
      .fn()
      .mockRejectedValue(new Error("Database unavailable"));
    const mockCtx = createMockContext("Build API");
    await expect(bot.handleTelegramMessage(mockCtx)).rejects.toThrow(
      "Database unavailable",
    );
  });

  test("handles non-text messages gracefully (e.g., photos or stickers)", async () => {
    const mockCtx = createMockContext(undefined);

    await bot.handleTelegramMessage(mockCtx);

    expect(mockHandler.handle).toHaveBeenCalledWith(undefined);
  });

  test("handles empty string messages", async () => {
    const mockCtx = createMockContext("");

    await bot.handleTelegramMessage(mockCtx);

    expect(mockHandler.handle).toHaveBeenCalledWith("");
  });

  test("processes multiple rapid/concurrent messages independently", async () => {
    const mockCtx1 = createMockContext("Task 1");
    const mockCtx2 = createMockContext("Task 2");

    await Promise.all([
      bot.handleTelegramMessage(mockCtx1),
      bot.handleTelegramMessage(mockCtx2),
    ]);

    expect(mockHandler.handle).toHaveBeenCalledTimes(2);
    expect(mockHandler.handle).toHaveBeenCalledWith("Task 1");
    expect(mockHandler.handle).toHaveBeenCalledWith("Task 2");
  });
});

describe("bot goal functionality", () => {
  let mockTaskHandler: TaskHandler;
  let mockGoalHandler: GoalHandler;
  let bot: Bot;

  beforeEach(() => {
    mockTaskHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    mockGoalHandler = {
      handleNewGoal: jest.fn().mockResolvedValue(undefined),
      handleRemoveGoal: jest.fn().mockResolvedValue(undefined),
      handleListGoals: jest.fn().mockResolvedValue(undefined),
    };
    bot = new Bot(TOKEN, mockTaskHandler);
  });

  test("goal handler handles new goal messages", async () => {
    const mockCtx = {
      message: { text: "/setgoal Learn TypeScript" },
    } as TextMessageContext;

    await bot.handleTelegramMessage(mockCtx);

    expect(mockGoalHandler.handleNewGoal).toHaveBeenCalledWith("Learn TypeScript");
  });

  test("goal handler handles removing goal messages", async () => {
    const mockCtx = {
      message: { text: "/removegoal Learn TypeScript" },
    } as TextMessageContext;
    
    await bot.handleTelegramMessage(mockCtx);

    expect(mockGoalHandler.handleRemoveGoal).toHaveBeenCalledWith("Learn TypeScript");
  });

  describe("goal handler handles list goals messages", () => {
    test("goal handler handles list goals messages", async () => {
      const mockCtx = {
        message: { text: "/listgoals" },
      } as TextMessageContext;

      await bot.handleTelegramMessage(mockCtx);

      expect(mockGoalHandler.handleListGoals).toHaveBeenCalled();
    });
  });

  test("does not interfere with task handling when processing goal messages", async () => {
    const mockCtx = {
      message: { text: "/setgoal Learn TypeScript" },
    } as TextMessageContext;

    await bot.handleTelegramMessage(mockCtx);

    expect(mockTaskHandler.handle).not.toHaveBeenCalled();
  });
});