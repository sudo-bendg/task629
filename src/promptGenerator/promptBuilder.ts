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

export const buildGoalAnalysisPrompt = (
  goal: string,
  tasks: string[],
): string => {
  const safeGoal = validateTaskDescription(goal);

  return `You are a highly conservative evaluator matching completed tasks to a specific goal. Precision is more important than finding matches. When evidence is insufficient, exclude the task.

You will be given a client profile, one goal, and a list of completed task descriptions. Select only tasks whose descriptions provide clear, direct evidence of a capability that is materially useful for achieving the goal.

Client profile:
${clientProfile}

Goal description:
${safeGoal}

Completed tasks:
${tasks.join("\n")}

Strict matching rules:
- Judge every task independently against the specific goal, using the client profile only as context.
- Include a task only when its description itself gives concrete evidence of a capability the goal requires or directly depends on.
- A shared subject, tool, industry, broad theme, or vague transferability is NOT enough to qualify a task.
- Do not infer what the person learned, intended, or achieved beyond what the task description explicitly states.
- Do not include tasks that are merely adjacent, potentially useful, or relevant only through several speculative steps.
- If the connection is uncertain, indirect, or depends on an assumption, exclude the task. It is correct to return no matches.
- Do not lower this threshold to provide a more complete-looking answer.

Return format requirements:
- Return ONLY the exact descriptions of qualifying tasks, copied verbatim from the input.
- Return each qualifying task on its own line, with no explanations, labels, numbering, bullets, or additional text.
- If no task clearly qualifies, return an empty response. Do not write "none" or explain why.
- Do NOT repeat the goal or client profile.

Output example format:
Exact task description A
Exact task description B`;
};
