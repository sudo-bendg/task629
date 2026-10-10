import { Ollama } from "./ollama";

describe("Ollama", () => {
  const url = "http://localhost:11434/api/generate";
  const defaultModel = "llama3-default";

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("throws when the URL is invalid", () => {
    expect(() => new Ollama("not-a-url", defaultModel)).toThrow(
      "Invalid Ollama URL",
    );
  });

  it("throws when no model is provided", () => {
    expect(() => new Ollama(url, "")).toThrow("Ollama model is required");
  });

  it("returns the response from Ollama using specified model", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        response: "Hello from Ollama with specified model",
      }),
    });
    global.fetch = mockFetch;

    const ollama = new Ollama(url, defaultModel);
    const result = await ollama.request("Hello", "custom-model");

    expect(result).toBe("Hello from Ollama with specified model");
    expect(mockFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "custom-model",
          prompt: "Hello",
          stream: false,
          think: false,
        }),
      }),
    );
  });

  it("uses default model when no model is specified", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        response: "Hello with default model",
      }),
    });
    global.fetch = mockFetch;

    const ollama = new Ollama(url, defaultModel);
    const result = await ollama.request("Hello");

    expect(result).toBe("Hello with default model");
    expect(mockFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        body: JSON.stringify({
          model: defaultModel,
          prompt: "Hello",
          stream: false,
          think: false,
        }),
      }),
    );
  });

  it("sets up a timeout that aborts the request after 15 minutes", async () => {
    jest.useFakeTimers();
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");

    let signalPassed: AbortSignal | undefined;
    global.fetch = jest.fn().mockImplementation((_url, options) => {
      signalPassed = options.signal;
      return new Promise<void>(() => {
        // never resolves
      });
    });

    const ollama = new Ollama(url, defaultModel);
    ollama.request("Hello");

    jest.advanceTimersByTime(15 * 60 * 1000);

    expect(abortSpy).toHaveBeenCalled();
    expect(signalPassed?.aborted).toBe(true);

    jest.useRealTimers();
  });

  it("clears the timeout if request completes successfully", async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        response: "Success",
      }),
    });

    const ollama = new Ollama(url, defaultModel);
    await ollama.request("Hello");

    expect(clearTimeoutSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("clears the timeout if the request rejects", async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network unavailable"));

    const ollama = new Ollama(url, defaultModel);
    await expect(ollama.request("Hello")).rejects.toThrow(
      "Network unavailable",
    );

    expect(clearTimeoutSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("includes retry headers when Ollama returns an HTTP error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "retry-after": "60" }),
    });

    const ollama = new Ollama(url, defaultModel);
    await expect(ollama.request("Hello")).rejects.toMatchObject({
      status: 429,
      headers: expect.any(Headers),
    });
  });
});
