import { generateTaskAnalysisRequest } from "../promptGenerator";
import { Task } from "../db/models/task";
import { AI } from "./ai";

jest.mock("../promptGenerator");
jest.mock("../db/models/task");

class TestAI extends AI {
  request = jest.fn<Promise<string>, [string]>();
}

describe("AI.analyseTask", () => {
  let testAI: TestAI;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    testAI = new TestAI();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates a prompt and returns trimmed unique skills", async () => {
    (generateTaskAnalysisRequest as jest.Mock).mockReturnValue("Mock Prompt");
    testAI.request.mockResolvedValue(
      " TypeScript, Jest , TypeScript, TDD,  Jest , , Communication ",
    );

    await expect(testAI.analyseTask("Build a dashboard")).resolves.toEqual([
      "TypeScript",
      "Jest",
      "TDD",
      "Communication",
    ]);

    expect(generateTaskAnalysisRequest).toHaveBeenCalledWith(
      "Build a dashboard",
    );
    expect(testAI.request).toHaveBeenCalledWith("Mock Prompt");
  });

  it("continues with an empty prompt when prompt generation fails", async () => {
    const testError = new Error("Empty task description");
    (generateTaskAnalysisRequest as jest.Mock).mockImplementation(() => {
      throw testError;
    });
    testAI.request.mockResolvedValue("NoSkills");

    await expect(testAI.analyseTask("")).resolves.toEqual(["NoSkills"]);

    expect(console.log).toHaveBeenCalledWith(testError);
    expect(testAI.request).toHaveBeenCalledWith("");
  });
});

describe("AI.analyseNextTask", () => {
  let testAI: TestAI;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    testAI = new TestAI();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs and returns if no new task is found", async () => {
    (Task.findOne as jest.Mock).mockResolvedValue(null);

    await testAI.analyseNextTask();

    expect(Task.findOne).toHaveBeenCalledWith({ status: "NEW" });
    expect(console.log).toHaveBeenCalledWith("no task found");
  });

  it("analyses, completes, and saves a new task", async () => {
    const mockTask = {
      description: "Write unit tests for the application",
      status: "NEW",
      skills: [] as string[],
      save: jest.fn().mockResolvedValue(undefined),
    };
    (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
    jest
      .spyOn(testAI, "analyseTask")
      .mockResolvedValue(["TypeScript", "Jest", "TDD"]);

    await testAI.analyseNextTask();

    expect(testAI.analyseTask).toHaveBeenCalledWith(mockTask.description);
    expect(mockTask.status).toBe("COMPLETE");
    expect(mockTask.skills).toEqual(["TypeScript", "Jest", "TDD"]);
    expect(mockTask.save).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      `Finished task analysis of: ${mockTask.description}`,
    );
  });
});
