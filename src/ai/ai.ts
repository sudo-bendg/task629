export interface AI {
  request(prompt: string, model?: string): Promise<string>;
}