import { DefaultConfigHandler } from "./defaultConfigHandler";
import { buildTaskAnalysisPrompt } from "../../promptGenerator/promptBuilder";
import {
  clientProfile,
  setClientProfile,
} from "../../promptGenerator/clientProfile";

describe("DefaultConfigHandler", () => {
  const originalProfile = clientProfile;
  const handler = new DefaultConfigHandler();

  afterEach(() => {
    setClientProfile(originalProfile);
  });

  it("updates the profile used by subsequent prompts", async () => {
    const profile = "An experienced software engineer";

    await handler.handle("set", "profile", profile);

    expect(buildTaskAnalysisPrompt("Build an API")).toContain(
      `Client profile:\n${profile}`,
    );
  });

  it("rejects an empty profile", async () => {
    await expect(handler.handle("set", "profile", "  ")).rejects.toThrow(
      "Client profile cannot be empty",
    );
  });
});
