import { DefaultTaskHandler } from "./defaultTaskHandler";
import { Task } from "../db/models/task";

jest.mock("../db/models/task", () => ({
  Task: {
    create: jest.fn(),
  },
}));

describe("DefaultTaskHandler", () => {
  let handler: DefaultTaskHandler;

  beforeEach(() => {
    handler = new DefaultTaskHandler();

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

    expect(Task.create).toHaveBeenCalledWith({
      description: task,
    });
  });

  it("resolves without throwing", async () => {
    await expect(handler.handle("anything")).resolves.toBeUndefined();
  });
});
