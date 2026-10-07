import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Goal } from "./goal";

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
