import { resolveModelName } from "./providerUtils";

describe("resolveModelName", () => {
  it("prefers the explicit model override", () => {
    expect(resolveModelName("fallback-model", "custom-model")).toBe(
      "custom-model",
    );
  });

  it("falls back to the configured default model", () => {
    expect(resolveModelName("fallback-model", undefined)).toBe(
      "fallback-model",
    );
  });

  it("uses the provider fallback when neither override nor default exists", () => {
    expect(resolveModelName(undefined, undefined)).toBe("fallback-model");
  });
});
