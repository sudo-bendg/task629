import { DefaultTaskHandler } from "./defaultTaskHandler";
import { DatabaseStrategy } from "../db/databaseStrategy";

describe("DefaultTaskHandler", () => {
  let handler: DefaultTaskHandler;
  let mockDb: jest.Mocked<DatabaseStrategy>;

  beforeEach(() => {
    mockDb = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      createTask: jest.fn(),
      getNextTaskToAnalyse: jest.fn(),
      saveTask: jest.fn(),
    } as unknown as jest.Mocked<DatabaseStrategy>;

    handler = new DefaultTaskHandler(mockDb);

    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs the incoming task", async () => {
    const task = "Test task";

    await handler.handle(task);

    expect(console.log).toHaveBeenCalledWith(`Task revieved: ${task}`);
  });

  it("creates a task with correct description", async () => {
    const task = "Write unit tests";

    await handler.handle(task);

    expect(mockDb.createTask).toHaveBeenCalledWith(task);
  });

  it("resolves without throwing", async () => {
    await expect(handler.handle("anything")).resolves.toBeUndefined();
  });
});
