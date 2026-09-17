import { Gemini } from "./gemini";

describe("Gemini", () => {
  const apiKey = "test-api-key";
  const defaultModel = "gemini-default";

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("returns the response from Gemini using specified model", async () => {
    const gemini = new Gemini(apiKey, defaultModel);
    const generateContent = jest
      .spyOn(gemini.client.models, "generateContent")
      .mockResolvedValue({
        text: "Hello from Gemini with specified model",
      } as never);
    const result = await gemini.request("Hello", "custom-model");

    expect(result).toBe("Hello from Gemini with specified model");
    expect(generateContent).toHaveBeenCalledWith({
      model: "custom-model",
      contents: [{ parts: [{ text: "Hello" }] }],
    });
  });

  it("uses default model when no model is specified", async () => {
    const gemini = new Gemini(apiKey, defaultModel);
    const generateContent = jest
      .spyOn(gemini.client.models, "generateContent")
      .mockResolvedValue({ text: "Hello with default model" } as never);
    const result = await gemini.request("Hello");

    expect(result).toBe("Hello with default model");
    expect(generateContent).toHaveBeenCalledWith({
      model: defaultModel,
      contents: [{ parts: [{ text: "Hello" }] }],
    });
  });

  it("throws when Gemini returns no text", async () => {
    const gemini = new Gemini(apiKey, defaultModel);
    jest
      .spyOn(gemini.client.models, "generateContent")
      .mockResolvedValue({} as never);

    await expect(gemini.request("Hello")).rejects.toThrow(
      "No text returned from Gemini",
    );
  });

  it("throws when no API key is provided", () => {
    expect(() => new Gemini("", defaultModel)).toThrow(
      "Gemini API key is required",
    );
  });
});
