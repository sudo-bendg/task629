import { AI } from "../ai";

export class Ollama extends AI {
  url: string;
  defaultModel: string;

  constructor(ollamaUrl: string, model: string) {
    super();

    if (!ollamaUrl.trim()) {
      throw new Error("Ollama URL is required");
    }

    try {
      const parsedUrl = new URL(ollamaUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Ollama URL must use HTTP or HTTPS");
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Ollama URL must use HTTP or HTTPS"
      ) {
        throw error;
      }

      throw new Error("Invalid Ollama URL", { cause: error });
    }

    if (!model.trim()) {
      throw new Error("Ollama model is required");
    }

    this.url = ollamaUrl;
    this.defaultModel = model;
  }

  async request(prompt: string, model?: string): Promise<string> {
    const requestBody = {
      model: model || this.defaultModel,
      prompt: prompt,
      stream: false,
      think: false,
    };

    const controller = new AbortController();

    const timeout = setTimeout(
      () => {
        controller.abort();
      },
      15 * 60 * 1000,
    );

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const modelResponse = await response.json();
    return modelResponse.response;
  }
}
