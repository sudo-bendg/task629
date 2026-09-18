import { clientProfile } from "./clientProfile";

export const validateTaskDescription = (task: string): string => {
  if (task === "") {
    throw new Error("Task is empty");
  }

  return task;
};

export const buildTaskAnalysisPrompt = (task: string): string => {
  const safeTask = validateTaskDescription(task);

  return `You are a professional growth and development expert specialising in identifying transferable and technical skills from real-world tasks.

You will be given a client profile and a completed task description.

Client profile:
${clientProfile}

Completed task:
${safeTask}

Your job is to:
- Analyse the task in the context of the client profile
- Identify all relevant skills demonstrated by the client while completing the task
- Include only skills which are clearly demonstrated in the task itself. DO NOT MAKE ASSUMPTIONS.
- Focus on both technical and soft skills where appropriate
- Ensure skills are aligned with the experience level, role, and goals described in the client profile

Return format requirements:
- Return ONLY a plain text response
- The response must be a single comma-separated string of skills
- Do NOT include explanations, numbering, bullet points, or any additional text
- Do NOT repeat the task or profile

Output example format:
Skill A, Skill B, Skill C`;
};

export const buildTaskReviewPrompt = (
  task: string,
  skills: string[],
  otherTasks: { description: string; skills: string[] }[] = [],
): string => {
  const safeTask = validateTaskDescription(task);
  const otherTaskDetails = otherTasks
    .map(
      (otherTask) =>
        `Task: ${otherTask.description}\nSkills: ${otherTask.skills.join(", ")}`,
    )
    .join("\n\n");

  return `You are a professional growth and development expert reviewing an existing task analysis.

Use the other task analyses below as consistency context. They are examples only; review the target task based on its own evidence.

Other task analyses:
${otherTaskDetails || "None provided"}

Target completed task:
${safeTask}

Target existing skills:
${skills.join(", ")}

Review the existing skills against the completed task. Correct, remove, or add skills so the final list contains only skills clearly demonstrated by the task.

Return format requirements:
- Return ONLY a plain text response
- The response must be a single comma-separated string of the complete corrected skills list
- Do NOT include explanations, numbering, bullet points, or any additional text

Output example format:
Skill A, Skill B, Skill C`;
};
