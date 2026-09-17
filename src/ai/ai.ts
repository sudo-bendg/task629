export abstract class AI {
  abstract request(prompt: string, model?: string): Promise<string>;
}