import { Bot, TaskHandler, TextMessageContext } from "./bot";

const TOKEN = "123";

describe("bot", () => {
  let mockHandler: TaskHandler;
  let bot: Bot;

  beforeEach(() => {
    mockHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    bot = new Bot(TOKEN, mockHandler);
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
