export class Ollama {
    url: string;

    constructor(ollamaUrl: string) {
        this.url = ollamaUrl;
    }

    async request(prompt: string, model: string) {
        const requestBody = {
            model: model,
            prompt: prompt,
            stream: false,
            think: false
        }

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 15 * 60 * 1000);

        const response = await fetch(this.url,{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        })

        clearTimeout(timeout);

        const modelResponse = await response.json();
        return modelResponse.response;
    }
}