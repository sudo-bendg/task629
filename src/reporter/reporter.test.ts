import { Analysis } from "../db/models/analysis";
import { generateReport } from "./reporter";

jest.mock("../db/models/analysis", () => ({
  Analysis: {
    findOne: jest.fn(),
  },
}));

describe("generateReport", () => {
  it("renders goals and matched tasks as escaped HTML", async () => {
    const lean = jest.fn().mockResolvedValue({
      goals: [
        {
          goal: "Learn <TypeScript>",
          status: "IN_PROGRESS",
          candidates: [
            { description: "Build & test", status: "MATCHED" },
            { description: "Skip this", status: "NOT_MATCHED" },
          ],
        },
        {
          goal: "Ship the project",
          status: "COMPLETE",
          candidates: [],
        },
      ],
    });
    const sort = jest.fn().mockReturnValue({ lean });
    (Analysis.findOne as jest.Mock).mockReturnValueOnce({ sort });

    const report = await generateReport();

    expect(Analysis.findOne).toHaveBeenCalledTimes(1);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(report).toContain("<h2>Learn &lt;TypeScript&gt;</h2>");
    expect(report).toContain("<summary>Matched tasks (1)</summary>");
    expect(report).toContain("<summary>Matched tasks (0)</summary>");
    expect(report).toContain("<details>");
    expect(report).toContain("<li>Build &amp; test</li>");
    expect(report).toContain("No tasks matched this goal yet.");
    expect(report).not.toContain("Skip this");
  });

  it("reports when there is no saved analysis", async () => {
    const lean = jest.fn().mockResolvedValue(null);
    const sort = jest.fn().mockReturnValue({ lean });
    (Analysis.findOne as jest.Mock).mockReturnValueOnce({ sort });

    await expect(generateReport()).rejects.toThrow("No analysis found");
  });
});
