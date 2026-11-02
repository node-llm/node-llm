import { describe, it, expect, afterEach } from "vitest";
import { setupVCR } from "../../../helpers/vcr.js";
import { azure } from "../helpers.js";
import "dotenv/config";

describe("Azure Models Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list each model the resource can deploy once", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const models = await azure("deployment").listModels();
    const ids = models.map((model) => model.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.some((id) => id.startsWith("gpt-4o"))).toBe(true);
    expect(models.every((model) => model.provider === "azure")).toBe(true);
  });
});
