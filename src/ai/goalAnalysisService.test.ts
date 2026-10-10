import { Analysis } from "../db/models/analysis";
import { Task } from "../db/models/task";
import { GoalAnalysisService } from "./goalAnalysisService";
import { Types } from "mongoose";

jest.mock("../db/models/analysis", () => ({
  Analysis: { create: jest.fn() },
}));

jest.mock("../db/models/task", () => ({
  Task: { find: jest.fn() },
}));

describe("GoalAnalysisService", () => {
  let analyseGoal: jest.Mock;
  let service: GoalAnalysisService;
  let completedTaskId: Types.ObjectId;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    analyseGoal = jest.fn().mockResolvedValue(["Completed task"]);
    service = new GoalAnalysisService({ analyseGoal });
    completedTaskId = new Types.ObjectId();
    (Task.find as jest.Mock).mockResolvedValue([
      { description: "Completed task", _id: completedTaskId },
      { description: "Reviewed task", _id: new Types.ObjectId() },
    ]);
    (Analysis.create as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("analyzes only complete or reviewed tasks and saves the finished analysis", async () => {
    service.newAnalysis([{ description: "Learn TypeScript" }]);

    await service.analyseNextGoal();

    expect(Task.find).toHaveBeenCalledWith({
      status: { $in: ["COMPLETE", "REVIEWED"] },
    });
    expect(analyseGoal).toHaveBeenCalledWith("Learn TypeScript", [
      "Completed task",
      "Reviewed task",
    ]);
    expect(Analysis.create).toHaveBeenCalledWith({
      goals: [
        {
          goal: "Learn TypeScript",
          tasks: [{ description: "Completed task", id: completedTaskId }],
        },
      ],
    });
    expect(service.hasPendingGoals()).toBe(false);
  });

  it("does not start a duplicate request while a slow request is pending", async () => {
    let resolveAnalysis!: (skills: string[]) => void;
    analyseGoal.mockReturnValueOnce(
      new Promise<string[]>((resolve) => {
        resolveAnalysis = resolve;
      }),
    );
    service.newAnalysis([{ description: "Learn TypeScript" }]);

    const firstRequest = service.analyseNextGoal();
    await Promise.resolve();
    await service.analyseNextGoal();

    expect(analyseGoal).toHaveBeenCalledTimes(1);

    resolveAnalysis(["Completed task"]);
    await firstRequest;
  });

  it("keeps failed goals pending and retries them after backoff", async () => {
    analyseGoal
      .mockRejectedValueOnce(new Error("Provider unavailable"))
      .mockResolvedValueOnce(["Completed task"]);
    service.newAnalysis([{ description: "Learn TypeScript" }]);

    await service.analyseNextGoal();

    expect(service.hasPendingGoals()).toBe(true);
    expect(Analysis.create).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(30_000);

    expect(analyseGoal).toHaveBeenCalledTimes(2);
    expect(Analysis.create).toHaveBeenCalledTimes(1);
    expect(service.hasPendingGoals()).toBe(false);
  });
});
