import { Types } from "mongoose";
import { Analysis } from "../db/models/analysis";
import { Task } from "../db/models/task";

export interface GoalAnalysisServiceDependencies {
  analyseGoal: (goalDescription: string, tasks: string[]) => Promise<string[]>;
}

interface AnalysedTask {
  description: string;
  id: Types.ObjectId;
}

export class GoalAnalysisService {
  private goalsToAnalyse: { description: string }[] = [];
  private analysisObject: Record<string, AnalysedTask[]> = {};
  private analysisNeedsSaving = false;
  private isProcessing = false;
  private retryTimer: NodeJS.Timeout | undefined;
  private retryCount = 0;

  constructor(private readonly dependencies: GoalAnalysisServiceDependencies) {}

  async analyseNextGoal(): Promise<void> {
    if (this.isProcessing || this.retryTimer) {
      return;
    }

    const currentGoal = this.goalsToAnalyse[0];
    if (!currentGoal && !this.analysisNeedsSaving) {
      return;
    }

    this.isProcessing = true;
    try {
      if (currentGoal) {
        const tasks = await Task.find({
          status: { $in: ["COMPLETE", "REVIEWED"] },
        });
        const analysis = await this.dependencies.analyseGoal(
          currentGoal.description,
          tasks.map((task) => task.description),
        );
        const matchedDescriptions = new Set(analysis);
        this.analysisObject[currentGoal.description] = tasks
          .filter((task) => matchedDescriptions.has(task.description))
          .map((task) => ({ description: task.description, id: task._id }));
        this.goalsToAnalyse.shift();
        this.analysisNeedsSaving = true;
      }

      if (this.goalsToAnalyse.length === 0 && this.analysisNeedsSaving) {
        await this.saveAnalysis();
        this.analysisNeedsSaving = false;
        console.log("All goals have been analysed.");
      }

      this.retryCount = 0;
    } catch (error) {
      console.error("Error analysing goals:", error);
      this.scheduleRetry();
    } finally {
      this.isProcessing = false;
      if (this.hasPendingGoals() && !this.retryTimer) {
        void this.analyseNextGoal();
      }
    }
  }

  newAnalysis(initialGoals: { description: string }[] = []): void {
    if (this.isProcessing || this.hasPendingGoals()) {
      throw new Error("A goal analysis is already in progress");
    }

    this.goalsToAnalyse = [...initialGoals];
    this.analysisObject = {};
    this.analysisNeedsSaving = false;
    this.retryCount = 0;
  }

  async saveAnalysis(): Promise<void> {
    await Analysis.create({ goals: this.analysisObject });
  }

  hasPendingGoals(): boolean {
    return this.goalsToAnalyse.length > 0 || this.analysisNeedsSaving;
  }

  private scheduleRetry(): void {
    const delayMs = Math.min(30_000 * 2 ** this.retryCount, 15 * 60_000);
    this.retryCount += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.analyseNextGoal();
    }, delayMs);
    this.retryTimer.unref();
  }
}
