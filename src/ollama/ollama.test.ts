import { Ollama } from "./ollama";

describe("Ollama", () => {
    const url = "http://localhost:11434/api/generate";

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("returns the response from Ollama", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({
                response: "Hello from Ollama"
            })
        } as any);

        const ollama = new Ollama(url);

        const result = await ollama.request("Hello", "llama3");

        expect(result).toBe("Hello from Ollama");
    });

    it("calls fetch with the correct payload", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({
                response: "irrelevant"
            })
        } as any);

        const ollama = new Ollama(url);

        await ollama.request("Hello", "llama3");

        expect(global.fetch).toHaveBeenCalledWith(url,
            expect.objectContaining({
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3",
                prompt: "Hello",
                stream: false,
                think: false
            })
        }));
    });
});