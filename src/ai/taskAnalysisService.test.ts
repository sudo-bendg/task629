import { Task } from "../db/models/task";
import { TaskAnalysisService } from "./taskAnalysisService";

jest.mock("../db/models/task");

describe("TaskAnalysisService", () => {
  it("logs and returns when no task is available", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const analyseTask = jest.fn();
    (Task.findOne as jest.Mock).mockResolvedValue(null);

    const service = new TaskAnalysisService({ analyseTask });
    await service.analyseNextTask();

    expect(Task.findOne).toHaveBeenCalledWith({ status: "NEW" });
    expect(logSpy).toHaveBeenCalledWith("no task found");
    expect(analyseTask).not.toHaveBeenCalled();
  });

  it("analyses, completes, and saves the next task", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const mockTask = {
      description: "Write unit tests for the application",
      status: "NEW",
      skills: [] as string[],
      save: jest.fn().mockResolvedValue(undefined),
    };
    const analyseTask = jest.fn().mockResolvedValue(["TypeScript", "Jest", "TDD"]);
    (Task.findOne as jest.Mock).mockResolvedValue(mockTask);

    const service = new TaskAnalysisService({ analyseTask });
    await service.analyseNextTask();

    expect(analyseTask).toHaveBeenCalledWith(mockTask.description);
    expect(mockTask.status).toBe("COMPLETE");
    expect(mockTask.skills).toEqual(["TypeScript", "Jest", "TDD"]);
    expect(mockTask.save).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      `Finished task analysis of: ${mockTask.description}`,
    );
  });
});
