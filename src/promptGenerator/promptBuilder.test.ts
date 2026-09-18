import {
  buildTaskAnalysisPrompt,
  buildTaskReviewPrompt,
  validateTaskDescription,
} from "./promptBuilder";
import { clientProfile } from "./clientProfile";

describe("validateTaskDescription", () => {
  it("accepts a non-empty task description", () => {
    expect(validateTaskDescription("Implement OAuth2 login flow")).toBe(
      "Implement OAuth2 login flow",
    );
  });

  it("rejects an empty task description", () => {
    expect(() => validateTaskDescription("")).toThrow("Task is empty");
  });
});

describe("buildTaskAnalysisPrompt", () => {
  it("builds a prompt containing the client profile and task details", () => {
    const task = "Implement OAuth2 login flow";
    const prompt = buildTaskAnalysisPrompt(task);

    expect(prompt).toContain(
      "You are a professional growth and development expert",
    );
    expect(prompt).toContain(clientProfile);
    expect(prompt).toContain(task);
  });
});

describe("buildTaskReviewPrompt", () => {
  it("builds a prompt containing the task and existing skills", () => {
    const prompt = buildTaskReviewPrompt("Implement OAuth2 login flow", [
      "TypeScript",
      "Testing",
    ]);

    expect(prompt).toContain("Implement OAuth2 login flow");
    expect(prompt).toContain("TypeScript, Testing");
    expect(prompt).toContain("complete corrected skills list");
  });

  it("includes other task analyses as consistency context", () => {
    const prompt = buildTaskReviewPrompt(
      "Implement OAuth2 login flow",
      ["TypeScript"],
      [
        {
          description: "Write authentication tests",
          skills: ["Testing", "Security"],
        },
      ],
    );

    expect(prompt).toContain("Write authentication tests");
    expect(prompt).toContain("Testing, Security");
    expect(prompt).toContain("consistency context");
  });
});
