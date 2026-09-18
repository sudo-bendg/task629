import { Task } from "../db/models/task";
import { TaskAnalysisService } from "./taskAnalysisService";

jest.mock("../db/models/task");

describe("TaskAnalysisService", () => {
  const reviewTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs and returns when no task is available", async () => {
    const logSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const analyseTask = jest.fn();
    (Task.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });
    (Task.findOne as jest.Mock).mockResolvedValue(null);

    const service = new TaskAnalysisService({ analyseTask, reviewTask });
    await service.analyseNextTask();

    expect(Task.findOne).toHaveBeenCalledWith({ status: "NEW" });
    expect(Task.find).toHaveBeenCalledWith({ status: "COMPLETE" });
    expect(logSpy).toHaveBeenCalledWith("no task found");
    expect(analyseTask).not.toHaveBeenCalled();
  });

  it("analyses, completes, and saves the next task", async () => {
    const logSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const mockTask = {
      description: "Write unit tests for the application",
      status: "NEW",
      skills: [] as string[],
      save: jest.fn().mockResolvedValue(undefined),
    };
    const analyseTask = jest
      .fn()
      .mockResolvedValue(["TypeScript", "Jest", "TDD"]);
    (Task.findOne as jest.Mock).mockResolvedValue(mockTask);

    const service = new TaskAnalysisService({ analyseTask, reviewTask });
    await service.analyseNextTask();

    expect(analyseTask).toHaveBeenCalledWith(mockTask.description);
    expect(mockTask.status).toBe("COMPLETE");
    expect(mockTask.skills).toEqual(["TypeScript", "Jest", "TDD"]);
    expect(mockTask.save).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      `Finished task analysis of: ${mockTask.description}`,
    );
    expect(reviewTask).not.toHaveBeenCalled();
  });

  it("reviews the ten oldest complete tasks when no new task is available", async () => {
    const tasks = Array.from({ length: 10 }, (_, index) => ({
      description: `Task ${index}`,
      status: "COMPLETE",
      skills: [`Original ${index}`],
      save: jest.fn().mockResolvedValue(undefined),
    }));
    const sort = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const exec = jest.fn().mockResolvedValue(tasks);
    (Task.findOne as jest.Mock).mockResolvedValue(null);
    (Task.find as jest.Mock).mockReturnValue({ sort, limit, exec });
    reviewTask.mockImplementation(async (description: string) => [
      `Reviewed ${description}`,
    ]);

    const service = new TaskAnalysisService({
      analyseTask: jest.fn(),
      reviewTask,
    });
    await service.analyseNextTask();

    expect(Task.find).toHaveBeenCalledWith({ status: "COMPLETE" });
    expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(limit).toHaveBeenCalledWith(10);
    expect(exec).toHaveBeenCalled();
    expect(reviewTask).toHaveBeenCalledTimes(10);
    expect(reviewTask.mock.calls[0]?.[2]).toEqual(
      Array.from({ length: 9 }, (_, index) => ({
        description: `Task ${index + 1}`,
        skills: [`Original ${index + 1}`],
      })),
    );
    expect(tasks.every((task) => task.status === "REVIEWED")).toBe(true);
    expect(tasks.every((task) => task.save.mock.calls.length === 1)).toBe(true);
    const firstTask = tasks[0];
    expect(firstTask?.skills).toEqual(["Reviewed Task 0"]);
  });

  it("reviews fewer than ten complete tasks when fewer are available", async () => {
    const task = {
      description: "Task to review",
      status: "COMPLETE",
      skills: ["Existing skill"],
      save: jest.fn().mockResolvedValue(undefined),
    };
    (Task.findOne as jest.Mock).mockResolvedValue(null);
    (Task.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([task]),
    });
    reviewTask.mockResolvedValue(["Corrected skill"]);

    const service = new TaskAnalysisService({
      analyseTask: jest.fn(),
      reviewTask,
    });
    await service.analyseNextTask();

    expect(reviewTask).toHaveBeenCalledWith(
      task.description,
      ["Existing skill"],
      [],
    );
    expect(task.skills).toEqual(["Corrected skill"]);
    expect(task.status).toBe("REVIEWED");
  });

  it("leaves a task complete when review fails", async () => {
    const task = {
      description: "Task to review",
      status: "COMPLETE",
      skills: ["Existing skill"],
      save: jest.fn(),
    };
    (Task.findOne as jest.Mock).mockResolvedValue(null);
    (Task.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([task]),
    });
    reviewTask.mockRejectedValue(new Error("Review failed"));

    const service = new TaskAnalysisService({
      analyseTask: jest.fn(),
      reviewTask,
    });

    await expect(service.analyseNextTask()).rejects.toThrow("Review failed");
    expect(task.status).toBe("COMPLETE");
    expect(task.save).not.toHaveBeenCalled();
  });
});
