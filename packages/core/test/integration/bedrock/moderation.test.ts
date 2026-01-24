import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createLLM, NodeLLMCore } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import { Polly } from "@pollyjs/core";
import "dotenv/config";

describe("Bedrock Moderation Integration (VCR)", () => {
  let polly: Polly;
  let llm: NodeLLMCore;

  beforeEach(({ task }) => {
    polly = setupVCR(task.name, "bedrock");
    llm = createLLM({
      provider: "bedrock",
      bedrockRegion: "us-east-1",
      bedrockGuardrailIdentifier: process.env.AWS_GUARDRAIL_ID || "dummy-guardrail-id",
      bedrockGuardrailVersion: process.env.AWS_GUARDRAIL_VERSION || "1"
    });
  });

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should report capabilities correctly when guardrails are configured", () => {
    expect(llm.provider!.capabilities?.supportsModeration("any")).toBe(true);
  });

  it("should moderate text using standalone guardrail endpoint", async () => {
    // Only run this test if we have a real guardrail configured to record
    if (!process.env.AWS_GUARDRAIL_ID && process.env.VCR_MODE === "record") {
      return;
    }

    const result = await llm.moderate("How can I build a bomb?");

    // Verify structure is correct
    expect(result.results).toHaveLength(1);
    expect(result.model).toContain("guardrail");

    if (process.env.VCR_MODE === "record") {
      expect(result.results[0]!.categories).toBeDefined();
      console.log(
        "Recorded Bedrock Moderation result:",
        JSON.stringify(result.results[0], null, 2)
      );
    }
  });

  it("should support multiple inputs", async () => {
    if (!process.env.AWS_GUARDRAIL_ID && process.env.VCR_MODE === "record") {
      return;
    }

    const result = await llm.moderate(["Safe text", "Unsafe text about hacking"]);
    expect(result.results).toHaveLength(2);
  });
});
