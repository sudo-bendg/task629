import { Ollama } from "./ollama";

describe("Ollama", () => {
  const url = "http://localhost:11434/api/generate";

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns the response from Ollama", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        response: "Hello from Ollama",
      }),
    });

    const ollama = new Ollama(url, "model");

    const result = await ollama.request("Hello", "llama3");

    expect(result).toBe("Hello from Ollama");
  });
});
