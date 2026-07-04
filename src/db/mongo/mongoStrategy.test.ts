import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoDatabaseStrategy } from "./mongoStrategy";
import { Task } from "./models/task";

describe("MongoDatabaseStrategy", () => {
  let mongoServer: MongoMemoryServer;
  let strategy: MongoDatabaseStrategy;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(() => {
    strategy = new MongoDatabaseStrategy(mongoServer.getUri());
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await strategy.disconnect();
    }
    jest.restoreAllMocks();
  });

  it("should connect, log, and disconnect successfully", async () => {
    await strategy.connect();
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    expect(console.log).toHaveBeenCalledWith("database connected");

    await strategy.disconnect();
    expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
  });

  describe("when connected", () => {
    beforeEach(async () => {
      await strategy.connect();
      await Task.deleteMany({});
    });

    it("should create and retrieve a task", async () => {
      const created = await strategy.createTask("Test strategy creation");
      expect(created.id).toBeDefined();
      expect(created.description).toBe("Test strategy creation");
      expect(created.status).toBe("NEW");
      expect(created.skills).toEqual([]);

      const next = await strategy.getNextTaskToAnalyse();
      expect(next).not.toBeNull();
      expect(next?.id).toBe(created.id);
    });

    it("should return null if there are no new tasks to analyze", async () => {
      const next = await strategy.getNextTaskToAnalyse();
      expect(next).toBeNull();
    });

    it("should update and save task modifications", async () => {
      const created = await strategy.createTask("Test update");
      created.status = "COMPLETE";
      created.skills = ["Node.js", "Jest"];

      const saved = await strategy.saveTask(created);
      expect(saved.id).toBe(created.id);
      expect(saved.status).toBe("COMPLETE");
      expect(saved.skills).toEqual(["Node.js", "Jest"]);

      const lookup = await Task.findById(created.id);
      expect(lookup?.status).toBe("COMPLETE");
      expect(lookup?.skills).toEqual(["Node.js", "Jest"]);
    });

    it("should throw error when updating a non-existent task", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        strategy.saveTask({
          id: fakeId,
          description: "Fake",
          skills: [],
          status: "NEW",
        })
      ).rejects.toThrow(`Task with id ${fakeId} not found`);
    });
  });
});
