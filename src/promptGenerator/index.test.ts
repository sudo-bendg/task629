import {
  generateTaskAnalysisRequest,
  generateTaskReviewRequest,
} from "./index";
import { clientProfile } from "./clientProfile";

describe("generateTaskAnalysisRequest", () => {
  it("should generate a prompt containing the client profile and the task", () => {
    const task = "Implement OAuth2 login flow";
    const prompt = generateTaskAnalysisRequest(task);

    expect(prompt).toContain(
      "You are a professional growth and development expert",
    );
    expect(prompt).toContain(clientProfile);
    expect(prompt).toContain(task);
  });

  it("should throw an error if the task is an empty string", () => {
    expect(() => generateTaskAnalysisRequest("")).toThrow("Task is empty");
  });
});

describe("generateTaskReviewRequest", () => {
  it("generates a prompt containing the task and existing skills", () => {
    const prompt = generateTaskReviewRequest("Implement OAuth2 login flow", [
      "TypeScript",
      "Testing",
    ]);

    expect(prompt).toContain("Implement OAuth2 login flow");
    expect(prompt).toContain("TypeScript, Testing");
    expect(prompt).toContain("complete corrected skills list");
  });

  it("rejects an empty task description", () => {
    expect(() => generateTaskReviewRequest("", [])).toThrow("Task is empty");
  });
});
