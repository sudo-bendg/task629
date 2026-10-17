# Task629

Task629 is a personal skill tracker. It takes descriptions of tasks worked on through a day and analyses these to identify skills demonstrated. The motivation behind this project is to make the tracking of personal development easier by cutting out the mental load of identifying which of your daily tasks demonstrated which skills.

## Installation

Task629 is available as a [Docker image](https://hub.docker.com/repository/docker/benjamingodfrey/task629):

```bash
docker pull benjamingodfrey/task629
```

## Setup

Some environment variables are required in the container. These are documented below:

- `OLLAMA_URL` - the url of an Ollama instance
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `DEFAULT_MODEL` - a model to handle standard tasks, such as the analysis of new tasks (required)
- `STRONGER_MODEL` - a model to handle larger tasks, such as reviewing analyses
- `MONGO_CONNECTION_STRING` (required)
- `TELEGRAM_BOT_KEY` (required)

Of the above, only one of `OLLAMA_URL`, `GROQ_API_KEY`, and `GEMINI_API_KEY` is required.

Create a `.env` file with your configuration, then start the container:

```env
TELEGRAM_BOT_KEY=your-telegram-bot-token
MONGO_CONNECTION_STRING=your-mongodb-connection-string
GEMINI_API_KEY=your-gemini-api-key
DEFAULT_MODEL=your-default-model
```

Choose one AI provider. Replace the Gemini key above with `OLLAMA_URL` or `GROQ_API_KEY` if using a different provider. Then run:

```bash
docker run -d --name task629 --restart unless-stopped --env-file .env benjamingodfrey/task629
```

## Telegram Messages

- `/config set profile <text>` updates the client profile.
- Messages beginning with `/goal` are sent to goal handling; `/goal report` generates a report.
- Any other text message is treated as a task for analysis.

## Contributions

Contributions are welcome, feel free to raise a PR!

## License

[MIT](https://choosealicense.com/licenses/mit/)