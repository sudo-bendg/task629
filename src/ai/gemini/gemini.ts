import { AI } from "../ai";
import { resolveModelName } from "../providerUtils";
import { GoogleGenAI } from "@google/genai";

const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash";

export class Gemini extends AI {
  client: GoogleGenAI;

  constructor(
    private apiKey: string,
    private defaultModel?: string,
  ) {
    console.log(
      "Let me know if this works, I haven't been able to test it lol",
    );

    super();

    if (!this.apiKey.trim()) {
      throw new Error("Gemini API key is required");
    }

    try {
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
      });
    } catch (error) {
      throw new Error("Failed to create Gemini client", { cause: error });
    }

    this.defaultModel = defaultModel || GEMINI_DEFAULT_MODEL;
  }

  async request(prompt: string, model?: string): Promise<string> {
    const modelName = resolveModelName(
      this.defaultModel,
      model,
      GEMINI_DEFAULT_MODEL,
    );
    const response = await this.client.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
    });

    if (response.text) {
      return response.text;
    }

    throw new Error("No text returned from Gemini");
  }
}
