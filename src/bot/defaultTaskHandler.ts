import { TaskHandler } from './bot';
import { Task } from '../db/models/task';

class DefaultTaskHandler implements TaskHandler {
    async handle(task: string): Promise<void> {
        console.log(`Task revieved: ${task}`)
        const newTask = Task.create({description: task})
    }
}

export { DefaultTaskHandler };