import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Task } from "./task";

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
  await Task.deleteMany({});
});

describe("Task Model Test", () => {
  it("should create & save a task successfully with defaults", async () => {
    const validTask = new Task({ description: "Fix the leaky faucet" });
    const savedTask = await validTask.save();

    expect(savedTask._id).toBeDefined();
    expect(savedTask.status).toBe("NEW");
    expect(savedTask.createdAt).toBeDefined();
  });

  it("should read a created task after write", async () => {
    const validTask = new Task({ description: "Fix the leaky faucet" });
    await validTask.save();

    const foundTask = await Task.find({}).exec();

    console.log(`found task: ${foundTask}`);

    expect(foundTask).not.toHaveLength(0);
  });

  it("should fail if a required field is missing", async () => {
    const taskWithoutDescription = new Task({ skills: ["Plumbing"] });

    let err: unknown;

    try {
      await taskWithoutDescription.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);

    if (!(err instanceof mongoose.Error.ValidationError)) {
      throw new Error("Expected ValidationError");
    }

    expect(err.errors.description).toBeDefined();
  });

  it("should fail if status is not in the enum", async () => {
    const invalidTask = new Task({
      description: "Valid description",
      status: "IN_PROGRESS",
    });

    let err: unknown;

    try {
      await invalidTask.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);

    if (!(err instanceof mongoose.Error.ValidationError)) {
      throw new Error("Expected ValidationError");
    }

    expect(err.errors.status).toBeDefined();
  });
});
