import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["dist/*", "node_modules/*"],
};
export default config;
