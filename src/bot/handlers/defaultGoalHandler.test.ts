import { Goal } from "../../db/models/goal";
import { GoalAnalysisService } from "../../ai/goalAnalysisService";
import { DefaultGoalHandler } from "./defaultGoalHandler";

jest.mock("../../db/models/goal", () => ({
  Goal: {
    create: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
  },
}));

describe("DefaultGoalHandler", () => {
  let handler: DefaultGoalHandler;
  let goalAnalysisService: GoalAnalysisService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    goalAnalysisService = new GoalAnalysisService({
      taskDemonstratesGoal: jest.fn().mockResolvedValue(false),
    });
    handler = new DefaultGoalHandler(goalAnalysisService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs and creates a goal with the supplied title", async () => {
    await handler.handleNewGoal("Learn TypeScript");

    expect(console.log).toHaveBeenCalledWith("Goal created: Learn TypeScript");
    expect(Goal.create).toHaveBeenCalledWith({ title: "Learn TypeScript" });
  });

  it("awaits goal creation and propagates persistence errors", async () => {
    (Goal.create as jest.Mock).mockRejectedValueOnce(
      new Error("Database write failed"),
    );

    await expect(handler.handleNewGoal("Learn TypeScript")).rejects.toThrow(
      "Database write failed",
    );
  });

  it("logs and deletes a goal by its title", async () => {
    await handler.handleRemoveGoal("Learn TypeScript");

    expect(console.log).toHaveBeenCalledWith("Goal removed: Learn TypeScript");
    expect(Goal.deleteOne).toHaveBeenCalledWith({ title: "Learn TypeScript" });
  });

  it("awaits goal deletion and propagates persistence errors", async () => {
    (Goal.deleteOne as jest.Mock).mockRejectedValueOnce(
      new Error("Database delete failed"),
    );

    await expect(handler.handleRemoveGoal("Learn TypeScript")).rejects.toThrow(
      "Database delete failed",
    );
  });

  it("loads and logs every goal title", async () => {
    (Goal.find as jest.Mock).mockResolvedValueOnce([
      { title: "Learn TypeScript" },
      { title: "Ship the project" },
    ]);

    await handler.handleListGoals();

    expect(Goal.find).toHaveBeenCalledWith({});
    expect(console.log).toHaveBeenNthCalledWith(1, "Current goals:");
    expect(console.log).toHaveBeenNthCalledWith(2, "- Learn TypeScript");
    expect(console.log).toHaveBeenNthCalledWith(3, "- Ship the project");
  });

  it("propagates errors when loading goals", async () => {
    (Goal.find as jest.Mock).mockRejectedValueOnce(
      new Error("Database read failed"),
    );

    await expect(handler.handleListGoals()).rejects.toThrow(
      "Database read failed",
    );
  });
});

describe("DefaultGoalHandler analysis", () => {
  let handler: DefaultGoalHandler;
  let goalAnalysisService: GoalAnalysisService;

  beforeEach(() => {
    goalAnalysisService = new GoalAnalysisService({
      taskDemonstratesGoal: jest.fn().mockResolvedValue(false),
    });
    handler = new DefaultGoalHandler(goalAnalysisService);
  });

  it("should have a handleAnalysis method", () => {
    expect(typeof handler.handleAnalysis).toBe("function");
  });

  it("should create a list of all goals in the database when handleAnalysis is called", async () => {
    (Goal.find as jest.Mock).mockResolvedValueOnce([
      { title: "Learn TypeScript" },
      { title: "Ship the project" },
    ]);
    const newAnalysis = jest
      .spyOn(goalAnalysisService, "newAnalysis")
      .mockResolvedValue(undefined);
    jest
      .spyOn(goalAnalysisService, "analyseNextGoal")
      .mockResolvedValue(undefined);

    await handler.handleAnalysis();

    expect(Goal.find).toHaveBeenCalledWith({});
    expect(newAnalysis).toHaveBeenCalledWith([
      { description: "Learn TypeScript" },
      { description: "Ship the project" },
    ]);
  });

  it("starts analysis without waiting for the AI response", async () => {
    (Goal.find as jest.Mock).mockResolvedValueOnce([
      { title: "Learn TypeScript" },
    ]);
    const analyseNextGoal = jest
      .spyOn(goalAnalysisService, "analyseNextGoal")
      .mockResolvedValue(undefined);
    jest.spyOn(goalAnalysisService, "newAnalysis").mockResolvedValue(undefined);

    await handler.handle("analyse");

    expect(analyseNextGoal).toHaveBeenCalledTimes(1);
  });
});
