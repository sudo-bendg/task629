import { AI } from "../ai";
import { resolveModelName } from "../providerUtils";
import Groq from "groq-sdk";

const GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b";

export class GroqClass extends AI {
  client: Groq;

  constructor(
    private apiKey: string,
    private defaultModel?: string,
  ) {
    super();

    if (!this.apiKey.trim()) {
      throw new Error("Groq API key is required");
    }

    try {
      this.client = new Groq({
        apiKey: this.apiKey,
      });
    } catch (error) {
      throw new Error("Failed to create Groq client", { cause: error });
    }

    this.defaultModel = defaultModel || GROQ_DEFAULT_MODEL;
  }

  async request(prompt: string, model?: string): Promise<string> {
    const modelName = resolveModelName(
      this.defaultModel,
      model,
      GROQ_DEFAULT_MODEL,
    );
    const response = await this.client.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
    });

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("No choices returned from Groq");
    }

    const choice = response.choices[0];
    if (!choice) {
      throw new Error("No choice returned from Groq");
    }

    if (choice.message) {
      const messageContent = choice.message.content;

      if (
        typeof messageContent === "string" &&
        messageContent.trim().length > 0
      ) {
        return messageContent;
      }

      if (Array.isArray(messageContent)) {
        const textContent = messageContent
          .map((part) => (typeof part === "string" ? part : ""))
          .join("")
          .trim();

        if (textContent.length > 0) {
          return textContent;
        }
      }

      throw new Error("No text returned from Groq");
    }

    throw new Error("No text returned from Groq");
  }
}
