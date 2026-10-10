import { Analysis } from "../db/models/analysis";
import { Task } from "../db/models/task";
import { GoalAnalysisService } from "./goalAnalysisService";
import { Types } from "mongoose";

jest.mock("../db/models/analysis", () => ({
  Analysis: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock("../db/models/task", () => ({
  Task: { find: jest.fn() },
}));

describe("GoalAnalysisService", () => {
  interface MockCandidate {
    description: string;
    id: Types.ObjectId;
    status: "PENDING" | "MATCHED" | "NOT_MATCHED";
  }
  interface MockGoal {
    goal: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETE";
    candidates: MockCandidate[];
    tasks: { description: string; id: Types.ObjectId }[];
  }
  interface MockAnalysis {
    _id: Types.ObjectId;
    status: "IN_PROGRESS" | "COMPLETE";
    goals: MockGoal[];
    retryCount: number;
    nextAttemptAt: Date | null;
    lastError: string | null;
    completedAt: Date | null;
  }

  let taskDemonstratesGoal: jest.Mock;
  let service: GoalAnalysisService;
  let persistedAnalysis: MockAnalysis | undefined;
  let completedTaskId: Types.ObjectId;

  const setNestedValue = (object: object, path: string, value: unknown) => {
    const parts = path.split(".");
    const lastPart = parts.pop();
    let current = object as Record<string, unknown>;
    for (const part of parts) {
      const nested = current[part];
      if (!nested || typeof nested !== "object") {
        throw new Error(`Missing nested value at ${part}`);
      }
      current = nested as Record<string, unknown>;
    }
    if (lastPart) {
      current[lastPart] = value;
    }
  };

  const getNestedValue = (object: object, path: string): unknown => {
    return path.split(".").reduce<unknown>((current, part) => {
      if (!current || typeof current !== "object") {
        throw new Error(`Missing nested value at ${part}`);
      }
      return (current as Record<string, unknown>)[part];
    }, object);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    persistedAnalysis = undefined;
    taskDemonstratesGoal = jest.fn().mockResolvedValue(true);
    service = new GoalAnalysisService({ taskDemonstratesGoal });
    completedTaskId = new Types.ObjectId();
    (Task.find as jest.Mock).mockResolvedValue([
      { description: "Completed task", _id: completedTaskId },
      { description: "Reviewed task", _id: new Types.ObjectId() },
    ]);
    (Analysis.create as jest.Mock).mockImplementation(
      async (analysis: unknown) => {
        persistedAnalysis = {
          _id: new Types.ObjectId(),
          ...(analysis as Omit<MockAnalysis, "_id">),
        };
        return persistedAnalysis;
      },
    );
    (Analysis.findOne as jest.Mock).mockImplementation(async () =>
      persistedAnalysis?.status === "IN_PROGRESS" ? persistedAnalysis : null,
    );
    (Analysis.findById as jest.Mock).mockImplementation(
      async () => persistedAnalysis ?? null,
    );
    (Analysis.updateOne as jest.Mock).mockImplementation(
      async (_filter, update) => {
        if (!persistedAnalysis) {
          throw new Error("No analysis document to update");
        }
        for (const [path, value] of Object.entries(update.$set ?? {})) {
          setNestedValue(persistedAnalysis, path, value);
        }
        for (const [path, value] of Object.entries(update.$push ?? {})) {
          const target = getNestedValue(persistedAnalysis, path);
          if (!Array.isArray(target)) {
            throw new Error(`Expected array at ${path}`);
          }
          target.push(value);
        }
      },
    );
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("evaluates each task separately and persists pair results", async () => {
    taskDemonstratesGoal
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await service.newAnalysis([{ description: "Learn TypeScript" }]);

    await service.analyseNextGoal();

    expect(Task.find).toHaveBeenCalledWith({
      status: { $in: ["COMPLETE", "REVIEWED"] },
    });
    expect(taskDemonstratesGoal).toHaveBeenNthCalledWith(
      1,
      "Learn TypeScript",
      "Completed task",
    );
    expect(taskDemonstratesGoal).toHaveBeenNthCalledWith(
      2,
      "Learn TypeScript",
      "Reviewed task",
    );
    expect(persistedAnalysis).toMatchObject({
      status: "COMPLETE",
      goals: [
        {
          goal: "Learn TypeScript",
          status: "COMPLETE",
          candidates: [
            { status: "MATCHED", id: completedTaskId },
            { status: "NOT_MATCHED" },
          ],
          tasks: [{ description: "Completed task", id: completedTaskId }],
        },
      ],
    });
    expect(service.hasPendingGoals()).toBe(false);
  });

  it("does not start a duplicate request while a slow request is pending", async () => {
    (Task.find as jest.Mock).mockResolvedValueOnce([
      { description: "Completed task", _id: completedTaskId },
    ]);
    let resolveAnalysis!: (matches: boolean) => void;
    taskDemonstratesGoal.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        resolveAnalysis = resolve;
      }),
    );
    await service.newAnalysis([{ description: "Learn TypeScript" }]);

    const firstRequest = service.analyseNextGoal();
    await Promise.resolve();
    await service.analyseNextGoal();

    expect(taskDemonstratesGoal).toHaveBeenCalledTimes(1);

    resolveAnalysis(true);
    await firstRequest;
  });

  it("persists Retry-After and retries the still-pending pair", async () => {
    (Task.find as jest.Mock).mockResolvedValueOnce([
      { description: "Completed task", _id: completedTaskId },
    ]);
    taskDemonstratesGoal
      .mockRejectedValueOnce(
        Object.assign(new Error("Rate limited"), {
          headers: { "retry-after": "45" },
        }),
      )
      .mockResolvedValueOnce(true);
    await service.newAnalysis([{ description: "Learn TypeScript" }]);

    await service.analyseNextGoal();

    expect(service.hasPendingGoals()).toBe(true);
    expect(persistedAnalysis).toMatchObject({
      retryCount: 1,
      lastError: "Rate limited",
      goals: [{ candidates: [{ status: "PENDING" }] }],
    });
    expect(persistedAnalysis?.nextAttemptAt?.getTime()).toBe(
      Date.now() + 45_000,
    );

    await jest.advanceTimersByTimeAsync(45_000);

    expect(taskDemonstratesGoal).toHaveBeenCalledTimes(2);
    expect(service.hasPendingGoals()).toBe(false);
    expect(persistedAnalysis?.status).toBe("COMPLETE");
  });

  it("resumes an unfinished analysis after service recreation", async () => {
    taskDemonstratesGoal.mockRejectedValueOnce(new Error("Unavailable"));
    await service.newAnalysis([{ description: "Learn TypeScript" }]);
    await service.analyseNextGoal();
    jest.clearAllTimers();

    const recoveredEvaluator = jest.fn().mockResolvedValue(true);
    const recoveredService = new GoalAnalysisService({
      taskDemonstratesGoal: recoveredEvaluator,
    });
    await recoveredService.resumePendingAnalysis();

    expect(recoveredEvaluator).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(recoveredEvaluator).toHaveBeenCalledWith(
      "Learn TypeScript",
      "Completed task",
    );
    expect(persistedAnalysis?.status).toBe("COMPLETE");
  });

  it("immediately completes analyses with no eligible tasks", async () => {
    (Task.find as jest.Mock).mockResolvedValueOnce([]);
    await service.newAnalysis([{ description: "Learn TypeScript" }]);

    expect(persistedAnalysis).toMatchObject({
      status: "COMPLETE",
      goals: [{ status: "COMPLETE", candidates: [], tasks: [] }],
    });
    expect(service.hasPendingGoals()).toBe(false);
  });
});
