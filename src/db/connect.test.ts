import mongoose from "mongoose";
import { getConnection } from "./connect";

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

describe("getConnection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should connect to mongoose with the provided connection string and log completion", async () => {
    const connStr = "mongodb://localhost:27017/testdb";
    (mongoose.connect as jest.Mock).mockResolvedValue(undefined);

    await getConnection(connStr);

    expect(mongoose.connect).toHaveBeenCalledWith(connStr);
    expect(console.log).toHaveBeenCalledWith("database connected");
  });

  it("should propagate errors if connection fails", async () => {
    const connStr = "mongodb://invalid-url";
    const testError = new Error("Connection failed");
    (mongoose.connect as jest.Mock).mockRejectedValue(testError);

    await expect(getConnection(connStr)).rejects.toThrow("Connection failed");
    expect(console.log).not.toHaveBeenCalled();
  });
});
