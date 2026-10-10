import { Types } from "mongoose";
import { Analysis } from "../db/models/analysis";
import { Task } from "../db/models/task";

export interface GoalAnalysisServiceDependencies {
  taskDemonstratesGoal: (goal: string, task: string) => Promise<boolean>;
}

interface CandidateTask {
  description: string;
  id: Types.ObjectId;
  status: "PENDING" | "MATCHED" | "NOT_MATCHED";
}

interface AnalysedTask {
  description: string;
  id: Types.ObjectId;
}

interface AnalysisGoal {
  goal: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETE";
  candidates: CandidateTask[];
  tasks: AnalysedTask[];
}

interface PersistedAnalysis {
  _id: Types.ObjectId;
  status: "IN_PROGRESS" | "COMPLETE";
  goals: AnalysisGoal[];
  retryCount: number;
  nextAttemptAt: Date | null;
}

const BASE_RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;

const getRetryAfterMs = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const errorRecord = error as Record<string, unknown>;
  const headers = errorRecord.headers as
    | { get?: (name: string) => string | null }
    | Record<string, unknown>
    | undefined;
  let retryAfter: unknown;

  if (headers && typeof headers.get === "function") {
    retryAfter = headers.get("retry-after");
  } else if (headers) {
    const headerRecord = headers as Record<string, unknown>;
    retryAfter = headerRecord["retry-after"] ?? headerRecord["Retry-After"];
  }

  if (typeof retryAfter === "number" && Number.isFinite(retryAfter)) {
    return Math.max(0, retryAfter * 1000);
  }

  if (typeof retryAfter === "string" && retryAfter.trim()) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.max(0, seconds * 1000);
    }

    const retryDate = Date.parse(retryAfter);
    if (!Number.isNaN(retryDate)) {
      return Math.max(0, retryDate - Date.now());
    }
  }

  return undefined;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class GoalAnalysisService {
  private analysisId: Types.ObjectId | undefined;
  private isProcessing = false;
  private retryTimer: NodeJS.Timeout | undefined;

  constructor(private readonly dependencies: GoalAnalysisServiceDependencies) {}

  async newAnalysis(
    initialGoals: { description: string }[] = [],
  ): Promise<void> {
    if (this.isProcessing || this.analysisId) {
      throw new Error("A goal analysis is already in progress");
    }

    const activeAnalysis = await Analysis.findOne({ status: "IN_PROGRESS" });
    if (activeAnalysis) {
      throw new Error("A goal analysis is already in progress");
    }

    const tasks = await Task.find({
      status: { $in: ["COMPLETE", "REVIEWED"] },
    });
    const goals: AnalysisGoal[] = initialGoals.map(({ description }) => {
      const candidates = tasks.map((task) => ({
        description: task.description,
        id: task._id,
        status: "PENDING" as const,
      }));

      return {
        goal: description,
        status: candidates.length ? "PENDING" : "COMPLETE",
        candidates,
        tasks: [],
      };
    });
    const hasCandidates = goals.some((goal) => goal.candidates.length > 0);
    const createdAnalysis = (await Analysis.create({
      status: hasCandidates ? "IN_PROGRESS" : "COMPLETE",
      goals,
      retryCount: 0,
      nextAttemptAt: null,
      lastError: null,
      completedAt: hasCandidates ? null : new Date(),
    })) as unknown as PersistedAnalysis;

    this.analysisId = hasCandidates ? createdAnalysis._id : undefined;
  }

  async resumePendingAnalysis(): Promise<void> {
    if (this.isProcessing || this.analysisId) {
      return;
    }

    const analysis = (await Analysis.findOne({
      status: "IN_PROGRESS",
    })) as unknown as PersistedAnalysis | null;
    if (!analysis) {
      return;
    }

    this.analysisId = analysis._id;
    const retryAt = analysis.nextAttemptAt?.getTime();
    const delay = retryAt ? Math.max(0, retryAt - Date.now()) : 0;

    if (delay > 0) {
      this.scheduleTimer(delay);
      return;
    }

    void this.analyseNextGoal().catch(console.error);
  }

  async analyseNextGoal(): Promise<void> {
    if (this.isProcessing || this.retryTimer || !this.analysisId) {
      return;
    }

    this.isProcessing = true;
    try {
      while (this.analysisId) {
        const analysis = (await Analysis.findById(
          this.analysisId,
        )) as unknown as PersistedAnalysis | null;
        if (!analysis || analysis.status !== "IN_PROGRESS") {
          this.analysisId = undefined;
          return;
        }

        const goalIndex = analysis.goals.findIndex((goal) =>
          goal.candidates.some((candidate) => candidate.status === "PENDING"),
        );
        if (goalIndex === -1) {
          await Analysis.updateOne(
            { _id: this.analysisId },
            {
              $set: {
                status: "COMPLETE",
                nextAttemptAt: null,
                lastError: null,
                completedAt: new Date(),
              },
            },
          );
          this.analysisId = undefined;
          console.log("All goals have been analysed.");
          return;
        }

        const goal = analysis.goals[goalIndex];
        if (!goal) {
          throw new Error("Analysis goal could not be loaded");
        }
        const taskIndex = goal.candidates.findIndex(
          (candidate) => candidate.status === "PENDING",
        );
        const candidate = goal.candidates[taskIndex];
        if (!candidate) {
          throw new Error("Pending analysis task could not be loaded");
        }

        const matches = await this.dependencies.taskDemonstratesGoal(
          goal.goal,
          candidate.description,
        );
        const remainingInGoal = goal.candidates.some(
          (item, index) => index !== taskIndex && item.status === "PENDING",
        );
        const remainingInAnalysis = analysis.goals.some((item, index) =>
          item.candidates.some(
            (task, candidateIndex) =>
              task.status === "PENDING" &&
              (index !== goalIndex || candidateIndex !== taskIndex),
          ),
        );
        const set: Record<string, unknown> = {
          [`goals.${goalIndex}.candidates.${taskIndex}.status`]: matches
            ? "MATCHED"
            : "NOT_MATCHED",
          [`goals.${goalIndex}.status`]: remainingInGoal
            ? "IN_PROGRESS"
            : "COMPLETE",
          retryCount: 0,
          nextAttemptAt: null,
          lastError: null,
        };
        if (!remainingInAnalysis) {
          set.status = "COMPLETE";
          set.completedAt = new Date();
        }

        await Analysis.updateOne(
          { _id: this.analysisId },
          {
            $set: set,
            ...(matches
              ? {
                  $push: {
                    [`goals.${goalIndex}.tasks`]: {
                      description: candidate.description,
                      id: candidate.id,
                    },
                  },
                }
              : {}),
          },
        );

        if (!remainingInAnalysis) {
          this.analysisId = undefined;
          console.log("All goals have been analysed.");
          return;
        }
      }
    } catch (error) {
      console.error("Error analysing goals:", error);
      await this.scheduleRetry(error);
    } finally {
      this.isProcessing = false;
    }
  }

  hasPendingGoals(): boolean {
    return this.analysisId !== undefined;
  }

  private async scheduleRetry(error: unknown): Promise<void> {
    if (!this.analysisId) {
      return;
    }

    const analysis = (await Analysis.findById(
      this.analysisId,
    )) as unknown as PersistedAnalysis | null;
    if (!analysis || analysis.status !== "IN_PROGRESS") {
      this.analysisId = undefined;
      return;
    }

    const backoff = Math.min(
      BASE_RETRY_DELAY_MS * 2 ** Math.min(analysis.retryCount, 20),
      MAX_RETRY_DELAY_MS,
    );
    const delay = Math.max(getRetryAfterMs(error) ?? 0, backoff);
    await Analysis.updateOne(
      { _id: this.analysisId },
      {
        $set: {
          retryCount: analysis.retryCount + 1,
          nextAttemptAt: new Date(Date.now() + delay),
          lastError: getErrorMessage(error),
        },
      },
    );
    this.scheduleTimer(delay);
  }

  private scheduleTimer(delay: number): void {
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.analyseNextGoal().catch(console.error);
    }, delay);
    this.retryTimer.unref();
  }
}
