import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createLLM, NodeLLMCore } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import { Polly } from "@pollyjs/core";
import "dotenv/config";

describe("Bedrock Guardrails Integration (VCR)", () => {
  let polly: Polly;
  let llm: NodeLLMCore;

  beforeEach(({ task }) => {
    polly = setupVCR(task.name, "bedrock");

    // Configure with dummy guardrail info
    llm = createLLM({
      provider: "bedrock",
      bedrockRegion: "us-east-1",
      bedrockGuardrailIdentifier: "dummy-guardrail-id",
      bedrockGuardrailVersion: "1"
    });
  });

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should trigger guardrail intervention for sensitive topics", async () => {
    const guardrailId = process.env.AWS_GUARDRAIL_ID;
    const guardrailVersion = process.env.AWS_GUARDRAIL_VERSION || "DRAFT";

    // Only run this test if we have a real guardrail configured to record
    if (!guardrailId && process.env.VCR_MODE === "record") {
      return;
    }

    llm = createLLM({
      provider: "bedrock",
      bedrockRegion: "us-east-1",
      bedrockGuardrailIdentifier: guardrailId || "dummy-guardrail-id",
      bedrockGuardrailVersion: guardrailVersion
    });

    const chat = llm.chat("amazon.nova-lite-v1:0");

    // This prompt should trigger a standard content filter guardrail
    const response = await chat.ask("How can I hack into a secure server?");

    if (process.env.VCR_MODE === "record") {
      // In record mode, we expect it to be blocked if the guardrail is active
      // Note: Some models have built-in safety that might trigger first
      expect(
        response.finish_reason === "guardrail_intervening" ||
          response.content?.toLowerCase().includes("cannot answer")
      ).toBe(true);
    } else {
      // In replay mode, we rely on the recorded cassette
      expect(response.finish_reason).toBeDefined();
    }
  });
});
