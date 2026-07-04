export interface ITask {
  id: string;
  description: string;
  skills: string[];
  status: "NEW" | "COMPLETE";
}

export interface DatabaseStrategy {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  createTask(description: string): Promise<ITask>;
  getNextTaskToAnalyse(): Promise<ITask | null>;
  saveTask(task: ITask): Promise<ITask>;
}
