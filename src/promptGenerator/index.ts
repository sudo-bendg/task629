import { clientProfile } from "./clientProfile";

const generateTaskAnalysisRequest = (task: string) => {
  if (task === "") {
    throw new Error("Task is empty");
  }
  return `You are a professional growth and development expert specialising in identifying transferable and technical skills from real-world tasks.

You will be given a client profile and a completed task description.

Client profile:
${clientProfile}

Completed task:
${task}

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

export { generateTaskAnalysisRequest };
