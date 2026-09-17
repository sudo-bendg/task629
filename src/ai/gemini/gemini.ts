import { AI } from "../ai";
import { GoogleGenAI } from "@google/genai";

export class Gemini extends AI {
  client: GoogleGenAI;

  constructor(
    private apiKey: string,
    private defaultModel?: string,
  ) {
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

    this.defaultModel = defaultModel || "gemini-3.8-flash";
  }

  async request(prompt: string, model?: string): Promise<string> {
    const modelName = model || this.defaultModel || "gemini-3.8-flash";
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
