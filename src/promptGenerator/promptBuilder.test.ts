import {
  buildTaskAnalysisPrompt,
  buildGoalAnalysisPrompt,
  buildGoalTaskMatchPrompt,
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

describe("buildGoalAnalysisPrompt", () => {
  it("requires direct evidence and excludes uncertain or indirect matches", () => {
    const prompt = buildGoalAnalysisPrompt("Become a backend engineer", [
      "Build a REST API",
      "Plan a birthday party",
    ]);

    expect(prompt).toContain(
      "Precision is more important than finding matches",
    );
    expect(prompt).toContain("clear, direct evidence");
    expect(prompt).toContain("If the connection is uncertain, indirect");
    expect(prompt).toContain("Build a REST API");
    expect(prompt).toContain("Plan a birthday party");
  });

  it("requires exact task descriptions and an empty response when there are no matches", () => {
    const prompt = buildGoalAnalysisPrompt("Become a backend engineer", []);

    expect(prompt).toContain("copied verbatim from the input");
    expect(prompt).toContain("return an empty response");
    expect(prompt).toContain('Do not write "none"');
  });
});

describe("buildGoalTaskMatchPrompt", () => {
  it("asks for a conservative binary decision using one goal and one task", () => {
    const prompt = buildGoalTaskMatchPrompt(
      "Become a backend engineer",
      "Build a REST API",
    );

    expect(prompt).toContain("Goal: Become a backend engineer");
    expect(prompt).toContain("Task: Build a REST API");
    expect(prompt).toContain("only TRUE or FALSE");
    expect(prompt).not.toContain(clientProfile);
  });

  it("rejects empty goal or task descriptions", () => {
    expect(() => buildGoalTaskMatchPrompt("", "Build an API")).toThrow(
      "Task is empty",
    );
    expect(() => buildGoalTaskMatchPrompt("Learn TypeScript", " ")).toThrow(
      "Task is empty",
    );
  });
});
