import { analyseNextTask } from "./analyseTask";
import { Task } from "../../db/models/task";
import { generateTaskAnalysisRequest } from "../../promptGenerator";
import { Ollama } from "./ollama";

jest.mock("../../db/models/task");
jest.mock("../../promptGenerator");
jest.mock("./ollama");

describe("analyseNextTask", () => {
  let mockOllama: jest.Mocked<Ollama>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    mockOllama = new Ollama("http://dummy", "model") as jest.Mocked<Ollama>;
    mockOllama.request = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log and return if no task is found with status NEW", async () => {
    (Task.findOne as jest.Mock).mockResolvedValue(null);

    await analyseNextTask(mockOllama);

    expect(Task.findOne).toHaveBeenCalledWith({ status: "NEW" });
    expect(console.log).toHaveBeenCalledWith("no task found");
    expect(mockOllama.request).not.toHaveBeenCalled();
  });

  it("should analyze the task, update its skills/status, and save it when task is found", async () => {
    const mockTask = {
      description: "Write unit tests for the application",
      status: "NEW",
      skills: [] as string[],
      save: jest.fn().mockResolvedValue(undefined),
    };
    (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
    (generateTaskAnalysisRequest as jest.Mock).mockReturnValue("Mock Prompt");
    mockOllama.request.mockResolvedValue("TypeScript,Jest,TDD");

    await analyseNextTask(mockOllama);

    expect(Task.findOne).toHaveBeenCalledWith({ status: "NEW" });
    expect(console.log).toHaveBeenCalledWith(
      `Analysing task: ${mockTask.description}`,
    );
    expect(generateTaskAnalysisRequest).toHaveBeenCalledWith(
      mockTask.description,
    );
    expect(mockOllama.request).toHaveBeenCalledWith("Mock Prompt");

    expect(mockTask.status).toBe("COMPLETE");
    expect(mockTask.skills).toEqual(["TypeScript", "Jest", "TDD"]);
    expect(mockTask.save).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      `Finished task analysis of: ${mockTask.description}`,
    );
  });

  it("should handle error in generateTaskAnalysisRequest, log it, and continue with empty prompt", async () => {
    const mockTask = {
      description: "",
      status: "NEW",
      skills: [] as string[],
      save: jest.fn().mockResolvedValue(undefined),
    };
    (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
    const testError = new Error("Empty task description");
    (generateTaskAnalysisRequest as jest.Mock).mockImplementation(() => {
      throw testError;
    });
    mockOllama.request.mockResolvedValue("NoSkills");

    await analyseNextTask(mockOllama);

    expect(console.log).toHaveBeenCalledWith(testError);
    expect(mockOllama.request).toHaveBeenCalledWith("");
    expect(mockTask.status).toBe("COMPLETE");
    expect(mockTask.skills).toEqual(["NoSkills"]);
    expect(mockTask.save).toHaveBeenCalled();
  });
});
