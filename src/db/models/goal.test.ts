import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Goal } from "./goal";
import { GoalAnalysisService } from "../../ai/goalAnalysisService";
import { DefaultGoalHandler } from "../../bot/handlers/defaultGoalHandler";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Goal.deleteMany({});
});

describe("Goal Model Test", () => {
  it("should create & save a goal successfully with defaults", async () => {
    const validGoal = new Goal({ title: "Get better at programming" });
    const savedGoal = await validGoal.save();

    expect(savedGoal._id).toBeDefined();
    expect(savedGoal.createdAt).toBeDefined();
  });

  it("should read a created goal after write", async () => {
    const validGoal = new Goal({ title: "Get better at programming" });
    await validGoal.save();

    const foundGoal = await Goal.find({}).exec();

    console.log(`found goal: ${foundGoal}`);

    expect(foundGoal).not.toHaveLength(0);
  });

  it("should fail if a required field is missing", async () => {
    const goalWithoutTitle = new Goal({});

    let err: unknown;

    try {
      await goalWithoutTitle.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });
});

describe("DefaultGoalHandler integration", () => {
  let handler: DefaultGoalHandler;

  beforeEach(() => {
    handler = new DefaultGoalHandler(
      new GoalAnalysisService({ analyseGoal: jest.fn().mockResolvedValue([]) }),
    );
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a goal that can be read from the database", async () => {
    await handler.handleNewGoal("Learn TypeScript");

    await expect(
      Goal.findOne({ title: "Learn TypeScript" }),
    ).resolves.toMatchObject({
      title: "Learn TypeScript",
    });
  });

  it("removes only the goal matching the supplied title", async () => {
    await Goal.create([
      { title: "Learn TypeScript" },
      { title: "Ship the project" },
    ]);

    await handler.handleRemoveGoal("Learn TypeScript");

    await expect(Goal.find({}).select("title -_id").lean()).resolves.toEqual([
      { title: "Ship the project" },
    ]);
  });

  it("lists titles returned from the database", async () => {
    await Goal.create([
      { title: "Learn TypeScript" },
      { title: "Ship the project" },
    ]);

    await handler.handleListGoals();

    expect(console.log).toHaveBeenCalledWith("Current goals:");
    expect(console.log).toHaveBeenCalledWith("- Learn TypeScript");
    expect(console.log).toHaveBeenCalledWith("- Ship the project");
  });
});
