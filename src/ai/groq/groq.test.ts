import { GroqClass } from "./groq";

describe("GroqClass", () => {
  const apiKey = "test-api-key";
  const defaultModel = "groq-default";

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("returns the response from Groq using the specified model", async () => {
    const groq = new GroqClass(apiKey, defaultModel);
    const create = jest.spyOn(groq.client.chat.completions, "create").mockResolvedValue({
      choices: [
        {
          message: {
            content: "Hello from Groq with specified model",
          },
        },
      ],
    } as never);

    const result = await groq.request("Hello", "custom-model");

    expect(result).toBe("Hello from Groq with specified model");
    expect(create).toHaveBeenCalledWith({
      model: "custom-model",
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("uses the default model when no model is specified", async () => {
    const groq = new GroqClass(apiKey, defaultModel);
    const create = jest.spyOn(groq.client.chat.completions, "create").mockResolvedValue({
      choices: [
        {
          message: {
            content: "Hello with default model",
          },
        },
      ],
    } as never);

    const result = await groq.request("Hello");

    expect(result).toBe("Hello with default model");
    expect(create).toHaveBeenCalledWith({
      model: defaultModel,
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("throws when Groq returns no choices", async () => {
    const groq = new GroqClass(apiKey, defaultModel);
    jest.spyOn(groq.client.chat.completions, "create").mockResolvedValue({} as never);

    await expect(groq.request("Hello")).rejects.toThrow(
      "No choices returned from Groq",
    );
  });

  it("throws when Groq returns no choice", async () => {
    const groq = new GroqClass(apiKey, defaultModel);
    jest.spyOn(groq.client.chat.completions, "create").mockResolvedValue({
      choices: [],
    } as never);

    await expect(groq.request("Hello")).rejects.toThrow(
      "No choices returned from Groq",
    );
  });

  it("throws when Groq returns no text", async () => {
    const groq = new GroqClass(apiKey, defaultModel);
    jest.spyOn(groq.client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: {} }],
    } as never);

    await expect(groq.request("Hello")).rejects.toThrow(
      "No text returned from Groq",
    );
  });

  it("throws when no API key is provided", () => {
    expect(() => new GroqClass("", defaultModel)).toThrow(
      "Groq API key is required",
    );
  });
});
