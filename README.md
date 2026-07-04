# Task Skill Analyzer Bot

A Telegram bot and background analyzer service designed to track professional development tasks and automatically extract transferable and technical skills using a local Ollama LLM.

## Table of Contents
- [Overview](#overview)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Docker Setup](#docker-setup)
- [CI/CD Workflow](#cicd-workflow)
- [Testing](#testing)

---

## Overview

This project helps early-career software engineers track their professional growth. It provides:
1. **A Telegram Bot Interface**: Allows users to quickly submit text messages describing real-world tasks they have completed.
2. **AI-Powered Skill Extraction**: Integrates with a local instance of [Ollama](https://ollama.com/) to analyze the completed task description against a client profile and extract soft/technical skills.
3. **Database Integration**: Saves tasks, skill sets, and completion statuses in a MongoDB database.

---

## How It Works

```
                        +----------------------------+
                        |  Telegram User (Developer) |
                        +--------------+-------------+
                                       |
                                       | Sends completed task description
                                       v
                        +--------------+-------------+
                        |     Telegraf Bot API       |
                        +--------------+-------------+
                                       |
                                       | Saves Task (status: "NEW")
                                       v
                        +--------------+-------------+
                        |       MongoDB Database     |
                        +--------------+-------------+
                                       ^
                                       |
    Hourly Cron Job / Loop             | Reads and updates tasks
    "analyseNextTask()"                |
                                       v
                        +--------------+-------------+
                        |    Ollama Prompt Engine    |
                        +--------------+-------------+
                                       |
                                       | Sends prompt with client profile & task
                                       v
                        +--------------+-------------+
                        |      Local Ollama API      |
                        +----------------------------+
```

1. **Ingestion**: The user sends a text message describing a completed task to the Telegram Bot. The message is handled by the `DefaultTaskHandler` and stored in MongoDB with the status `"NEW"`.
2. **Analysis Cycle**:
   - The application runs an initial check upon startup and then repeats a check every hour (`setInterval`).
   - It queries MongoDB for the oldest task with status `"NEW"`.
   - It constructs a prompt using a specialized **Client Profile** (focused on early-career software engineering growth) and the task description.
   - It sends the request to the local Ollama instance.
   - Ollama replies with a comma-separated list of technical/transferable skills demonstrated in the task.
   - The task's status is updated to `"COMPLETE"`, the skills list is saved to the record, and changes are stored back in MongoDB.

---

## Tech Stack

* **Runtime**: Node.js (v22)
* **Language**: TypeScript
* **Telegram Framework**: [Telegraf](https://github.com/telegraf/telegraf)
* **ODM / Database**: [Mongoose](https://mongoosejs.com/) & MongoDB
* **LLM Engine**: [Ollama](https://ollama.com/)
* **Test Suite**: [Jest](https://jestjs.io/) with `ts-jest`
* **Containerization**: Docker (Multi-stage builds)

---

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── docker.yaml        # CI/CD pipeline for tests, linting, and Docker Hub push
├── src/
│   ├── Errors/                # (Placeholder for error-handling utilities)
│   ├── bot/
│   │   ├── bot.ts             # Telegraf bot configuration & listener
│   │   ├── bot.test.ts
│   │   ├── defaultTaskHandler.ts # Handler to save Telegram tasks to MongoDB
│   │   └── defaultTaskHandler.test.ts
│   ├── db/
│   │   ├── connect.ts         # MongoDB Mongoose connection utility
│   │   ├── connect.test.ts
│   │   └── models/
│   │       ├── task.ts        # Mongoose schema for Task documents
│   │       └── task.test.ts
│   ├── ollama/
│   │   ├── ollama.ts          # API Client for Ollama service requests
│   │   ├── ollama.test.ts
│   │   ├── analyseTask.ts     # Orchestrator for analyzing new tasks
│   │   └── analyseTask.test.ts
│   ├── promptGenerator/
│   │   ├── index.ts           # System prompt generator for skill analysis
│   │   ├── index.test.ts
│   │   └── clientProfile.ts   # Early-career developer profile definition
│   ├── reporter/              # (Placeholder for report generation/analytics)
│   └── index.ts               # Application entrypoint
├── dockerfile                 # Multi-stage production build definition
├── eslint.config.mjs          # Linting rules configuration
├── jest.config.ts             # Jest environment settings
└── tsconfig.json              # TypeScript compilation options
```

---

## Getting Started

### Prerequisites

* Node.js v22+
* npm v10+
* MongoDB instance (running locally or remotely)
* Ollama instance (running locally or remotely) with your model of choice

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
TELEGRAM_BOT_KEY="your-telegram-bot-token"
MONGO_CONNECTION_STRING="mongodb://localhost:27017/task629"
DEFAULT_MODEL="llama3.2:3b"
OLLAMA_URL="http://localhost:11434"
```

### Installation

```bash
npm install
```

### Available Scripts

* **Start the App**: Runs the transpiled code from `/dist`
  ```bash
  npm run start
  ```
* **Run Tests**: Executes Jest tests
  ```bash
  npm test
  ```
* **Linting**: Lints source code using ESLint
  ```bash
  npm run lint
  ```
* **Formatting Check**: Checks files using Prettier
  ```bash
  npm run format:check
  ```
* **Type-checking**: Assures TS types are valid without building
  ```bash
  npm run typecheck
  ```

---

## Docker Setup

A multi-stage `dockerfile` is provided for containerizing the application.

### Build the Image
```bash
docker build -t task-skill-analyzer .
```

### Run the Container
```bash
docker run -d --name task-skill-analyzer --env-file .env task-skill-analyzer
```

---

## CI/CD Workflow

The `.github/workflows/docker.yaml` workflow automatically validates code changes on every pull request and push to the `main` branch:

1. **Code Quality**: Runs formatting checks, ESLint, and TypeScript type verification.
2. **Testing**: Executes all unit tests.
3. **Version Check** *(PRs only)*: Verifies that the `version` field in `package.json` has been bumped compared to the target branch.
4. **Publishing** *(Pushes to `main` only)*: Builds the multi-platform Docker image (supporting `amd64`, `arm64`, and `arm/v7`) and publishes it to Docker Hub as `benjamingodfrey/task629` with both the updated version tag and the `latest` tag.
