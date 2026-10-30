import { describe, it, expect } from "vitest";
import { ModelRegistry } from "../../../src/models/ModelRegistry.js";
import { Model } from "../../../src/models/types.js";

const model = (id: string, metadata?: Record<string, unknown>): Model =>
  ({
    id,
    name: id,
    provider: "temperature-test",
    family: "test",
    context_window: 8192,
    max_output_tokens: 1024,
    capabilities: ["chat"],
    modalities: { input: ["text"], output: ["text"] },
    pricing: {},
    metadata
  }) as unknown as Model;

describe("ModelRegistry.supportsTemperature", () => {
  ModelRegistry.save([
    model("rejects-temperature", { temperature: false }),
    model("accepts-temperature", { temperature: true }),
    model("no-temperature-data")
  ]);

  it("is false for a model the registry marks as rejecting a temperature", () => {
    expect(ModelRegistry.supportsTemperature("rejects-temperature", "temperature-test")).toBe(
      false
    );
  });

  it("is true for a model the registry marks as accepting one", () => {
    expect(ModelRegistry.supportsTemperature("accepts-temperature", "temperature-test")).toBe(true);
  });

  it("is true when the registry has no temperature data or no such model", () => {
    expect(ModelRegistry.supportsTemperature("no-temperature-data", "temperature-test")).toBe(true);
    expect(ModelRegistry.supportsTemperature("unknown-model-xyz", "temperature-test")).toBe(true);
  });
});
