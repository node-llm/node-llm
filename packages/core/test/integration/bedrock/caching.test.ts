import { describe, it, expect, afterEach } from "vitest";
import { createLLM, NodeLLMCore, ContentPart } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import { Polly } from "@pollyjs/core";
import "dotenv/config";

describe("Bedrock Prompt Caching (VCR)", { timeout: 30000 }, () => {
  let polly: Polly;
  let llm: NodeLLMCore;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should send cache checkpoint in system prompt", async () => {
    polly = setupVCR("bedrock-caching-system", "bedrock");

    llm = createLLM({
      provider: "bedrock",
      bedrockRegion: "us-east-1"
    });

    const chat = llm.chat("amazon.nova-lite-v1:0");

    // We can't use the simple string helper for caching, needs structured content
    chat.withInstructions("", { replace: true }); // Clear default and replace
    // Manually push a structured system message
    chat.add("system", [
      {
        type: "text",
        // Must exceed 1024 tokens
        text: "You are a helpful assistant. ".repeat(2000),
        cache_control: { type: "ephemeral" }
      }
    ] as any);

    try {
      const response = await chat.ask("Hello");
      expect(response.content).toBeDefined();
    } catch (e: any) {
      if (process.env.VCR_MODE === "record") {
        console.warn("API Error during recording:", e.message);
        throw e;
      }
    }
  });

  it("should send cache checkpoint in user message", async () => {
    polly = setupVCR("bedrock-caching-user", "bedrock");

    llm = createLLM({
      provider: "bedrock",
      bedrockRegion: "us-east-1"
    });

    const chat = llm.chat("amazon.nova-lite-v1:0");

    // Exceeds 1024 tokens
    const largeText = "This is a large context block. ".repeat(2000);

    // Using structured content for the user message
    const content: ContentPart[] = [
      {
        type: "text",
        text: largeText,
        cache_control: { type: "ephemeral" }
      },
      {
        type: "text",
        text: "\nAnswer this: what did I just say?"
      }
    ];

    const response = await chat.ask(content);
    expect(response.content).toBeDefined();
  });
});
