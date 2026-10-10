import { Telegraf } from "telegraf";
import { Bot, GoalHandler, TaskHandler, TextMessageContext } from "./bot";

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
  let mockTaskHandler: TaskHandler;
  let mockGoalHandler: GoalHandler;
  let bot: Bot;

  beforeEach(() => {
    mockOn.mockClear();
    mockLaunch.mockClear();
    (Telegraf as unknown as jest.Mock).mockClear();
    mockTaskHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    mockGoalHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
      handleNewGoal: jest.fn().mockResolvedValue(undefined),
      handleRemoveGoal: jest.fn().mockResolvedValue(undefined),
      handleListGoals: jest.fn().mockResolvedValue(undefined),
    };
    bot = new Bot(TOKEN, mockTaskHandler, mockGoalHandler);
  });

  test("initializes and launches the telegram bot", () => {
    expect(Telegraf).toHaveBeenCalledWith(TOKEN);
    expect(mockOn).toHaveBeenCalledWith("text", expect.any(Function));
    expect(mockLaunch).toHaveBeenCalled();
  });

  const createMockContext = (text?: string) =>
    ({
      message: text !== undefined ? { text } : {},
    }) satisfies TextMessageContext;

  test("passes received telegram messages to the task handler", async () => {
    const mockCtx = createMockContext("Write blog post");
    await bot.handleTelegramMessage(mockCtx);
    expect(mockTaskHandler.handle).toHaveBeenCalledWith("Write blog post");
  });

  test("calls the task handler exactly once", async () => {
    const mockCtx = createMockContext("Build API");
    await bot.handleTelegramMessage(mockCtx);
    expect(mockTaskHandler.handle).toHaveBeenCalledTimes(1);
  });

  test("propagates errors from the task handler", async () => {
    mockTaskHandler.handle = jest
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

    expect(mockTaskHandler.handle).not.toHaveBeenCalled();
  });

  test("handles empty string messages", async () => {
    const mockCtx = createMockContext("");

    await bot.handleTelegramMessage(mockCtx);

    expect(mockTaskHandler.handle).not.toHaveBeenCalled();
  });

  test("processes multiple rapid/concurrent messages independently", async () => {
    const mockCtx1 = createMockContext("Task 1");
    const mockCtx2 = createMockContext("Task 2");

    await Promise.all([
      bot.handleTelegramMessage(mockCtx1),
      bot.handleTelegramMessage(mockCtx2),
    ]);

    expect(mockTaskHandler.handle).toHaveBeenCalledTimes(2);
    expect(mockTaskHandler.handle).toHaveBeenCalledWith("Task 1");
    expect(mockTaskHandler.handle).toHaveBeenCalledWith("Task 2");
  });
});

describe("bot goal functionality", () => {
  let mockTaskHandler: TaskHandler;
  let mockGoalHandler: GoalHandler;
  let bot: Bot;

  beforeEach(() => {
    mockOn.mockClear();
    mockLaunch.mockClear();
    (Telegraf as unknown as jest.Mock).mockClear();

    mockTaskHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    mockGoalHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
      handleNewGoal: jest.fn().mockResolvedValue(undefined),
      handleRemoveGoal: jest.fn().mockResolvedValue(undefined),
      handleListGoals: jest.fn().mockResolvedValue(undefined),
    };
    bot = new Bot(TOKEN, mockTaskHandler, mockGoalHandler);
  });

  test("goal handler handles new goal messages", async () => {
    const mockCtx = {
      message: { text: "/goal set Learn TypeScript" },
      reply: jest.fn().mockResolvedValue(undefined),
    };

    await bot.handleTelegramMessage(mockCtx);

    expect(mockGoalHandler.handle).toHaveBeenCalledWith("set Learn TypeScript");
  });

  test("goal handler handles removing goal messages", async () => {
    const mockCtx = {
      message: { text: "/goal remove Learn TypeScript" },
      reply: jest.fn().mockResolvedValue(undefined),
    };

    await bot.handleTelegramMessage(mockCtx);

    expect(mockGoalHandler.handle).toHaveBeenCalledWith(
      "remove Learn TypeScript",
    );
  });

  describe("goal handler handles list goals messages", () => {
    test("goal handler handles list goals messages", async () => {
      const mockCtx = {
        message: { text: "/goal list" },
      };

      await bot.handleTelegramMessage(mockCtx);

      expect(mockGoalHandler.handle).toHaveBeenCalledWith("list");
    });
  });

  test("does not interfere with task handling when processing goal messages", async () => {
    const mockCtx = {
      message: { text: "/goal set Learn TypeScript" },
      reply: jest.fn().mockResolvedValue(undefined),
    };

    await bot.handleTelegramMessage(mockCtx);

    expect(mockTaskHandler.handle).not.toHaveBeenCalled();
  });

  describe("goal handler initiates goal analysis on request", () => {
    test("goal handler handles list goals messages", async () => {
      const mockCtx = {
        message: { text: "/goal analyse" },
      };

      await bot.handleTelegramMessage(mockCtx);

      expect(mockGoalHandler.handle).toHaveBeenCalledWith("analyse");
    });
  });
});
