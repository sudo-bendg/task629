import { Analysis } from "../db/models/analysis";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const generateReport = async (): Promise<string> => {
  const analysis = await Analysis.findOne().sort({ createdAt: -1 }).lean();
  if (!analysis) {
    throw new Error("No analysis found");
  }

  const goalsHtml = analysis.goals
    .map((goal) => {
      const matchedTasks = goal.candidates.filter(
        (candidate) => candidate.status === "MATCHED",
      );
      const tasksHtml = matchedTasks.length
        ? `<ul>
            ${matchedTasks
              .map((task) => `<li>${escapeHtml(task.description)}</li>`)
              .join("")}
          </ul>`
        : "<p>No tasks matched this goal yet.</p>";

      return `<section>
        <h2>${escapeHtml(goal.goal)}</h2>
        <p>Status: ${escapeHtml(goal.status)}</p>
        <details>
          <summary>Matched tasks (${matchedTasks.length})</summary>
          ${tasksHtml}
        </details>
      </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Goal progress report</title>
    <style>
      body { font-family: sans-serif; line-height: 1.5; margin: 2rem auto; max-width: 48rem; padding: 0 1rem; }
      section { border-top: 1px solid #ccc; margin-top: 1.5rem; padding-top: 1rem; }
      summary { cursor: pointer; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>Goal progress report</h1>
    ${goalsHtml}
  </body>
</html>`;
};
