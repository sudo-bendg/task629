import {
  generateTaskAnalysisRequest,
  generateTaskReviewRequest,
} from "../promptGenerator";
import { AI } from "./ai";

jest.mock("../promptGenerator");

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

describe("AI.reviewTask", () => {
  let testAI: TestAI;

  beforeEach(() => {
    jest.clearAllMocks();
    testAI = new TestAI();
  });

  it("reviews skills with the requested model and normalizes the result", async () => {
    (generateTaskReviewRequest as jest.Mock).mockReturnValue("Review Prompt");
    testAI.request.mockResolvedValue(" Jest, TypeScript, Jest ");

    await expect(
      testAI.reviewTask("Build a dashboard", ["Jest"], "strong-model"),
    ).resolves.toEqual(["Jest", "TypeScript"]);

    expect(generateTaskReviewRequest).toHaveBeenCalledWith(
      "Build a dashboard",
      ["Jest"],
      [],
    );
    expect(testAI.request).toHaveBeenCalledWith(
      "Review Prompt",
      "strong-model",
    );
  });
});
