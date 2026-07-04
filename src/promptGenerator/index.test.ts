import { generateTaskAnalysisRequest } from "./index";
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
