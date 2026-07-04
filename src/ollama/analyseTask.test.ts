import { analyseNextTask } from "./analyseTask";
import { generateTaskAnalysisRequest } from "../promptGenerator";
import { Ollama } from "./ollama";
import { DatabaseStrategy, ITask } from "../db/databaseStrategy";

jest.mock("../promptGenerator");
jest.mock("./ollama");

describe("analyseNextTask", () => {
  let mockOllama: jest.Mocked<Ollama>;
  let mockDb: jest.Mocked<DatabaseStrategy>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    mockOllama = new Ollama("http://dummy", "model") as jest.Mocked<Ollama>;
    mockOllama.request = jest.fn();

    mockDb = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      createTask: jest.fn(),
      getNextTaskToAnalyse: jest.fn(),
      saveTask: jest.fn(),
    } as unknown as jest.Mocked<DatabaseStrategy>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log and return if no task is found with status NEW", async () => {
    mockDb.getNextTaskToAnalyse.mockResolvedValue(null);

    await analyseNextTask(mockOllama, mockDb);

    expect(mockDb.getNextTaskToAnalyse).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("no task found");
    expect(mockOllama.request).not.toHaveBeenCalled();
  });

  it("should analyze the task, update its skills/status, and save it when task is found", async () => {
    const mockTask: ITask = {
      id: "123",
      description: "Write unit tests for the application",
      status: "NEW",
      skills: [] as string[],
    };
    mockDb.getNextTaskToAnalyse.mockResolvedValue(mockTask);
    (generateTaskAnalysisRequest as jest.Mock).mockReturnValue("Mock Prompt");
    mockOllama.request.mockResolvedValue("TypeScript,Jest,TDD");
    mockDb.saveTask.mockResolvedValue({
      ...mockTask,
      status: "COMPLETE",
      skills: ["TypeScript", "Jest", "TDD"],
    });

    await analyseNextTask(mockOllama, mockDb);

    expect(mockDb.getNextTaskToAnalyse).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      `Analysing task: ${mockTask.description}`,
    );
    expect(generateTaskAnalysisRequest).toHaveBeenCalledWith(
      mockTask.description,
    );
    expect(mockOllama.request).toHaveBeenCalledWith("Mock Prompt");

    expect(mockTask.status).toBe("COMPLETE");
    expect(mockTask.skills).toEqual(["TypeScript", "Jest", "TDD"]);
    expect(mockDb.saveTask).toHaveBeenCalledWith(mockTask);
    expect(console.log).toHaveBeenCalledWith(
      `Finished task analysis of: ${mockTask.description}`,
    );
  });

  it("should handle error in generateTaskAnalysisRequest, log it, and continue with empty prompt", async () => {
    const mockTask: ITask = {
      id: "123",
      description: "",
      status: "NEW",
      skills: [] as string[],
    };
    mockDb.getNextTaskToAnalyse.mockResolvedValue(mockTask);
    const testError = new Error("Empty task description");
    (generateTaskAnalysisRequest as jest.Mock).mockImplementation(() => {
      throw testError;
    });
    mockOllama.request.mockResolvedValue("NoSkills");
    mockDb.saveTask.mockResolvedValue({
      ...mockTask,
      status: "COMPLETE",
      skills: ["NoSkills"],
    });

    await analyseNextTask(mockOllama, mockDb);

    expect(console.log).toHaveBeenCalledWith(testError);
    expect(mockOllama.request).toHaveBeenCalledWith("");
    expect(mockTask.status).toBe("COMPLETE");
    expect(mockTask.skills).toEqual(["NoSkills"]);
    expect(mockDb.saveTask).toHaveBeenCalledWith(mockTask);
  });
});
