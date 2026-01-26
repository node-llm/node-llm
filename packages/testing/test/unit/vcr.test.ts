import { test, expect, describe, beforeEach, afterEach, vi } from "vitest";
import { setupVCR } from "../../src/vcr.js";
import {
  NodeLLM,
  BaseProvider,
  ChatRequest,
  ChatResponse,
  providerRegistry,
  ProviderCapabilities
} from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";

class MockProvider extends BaseProvider {
  get id() {
    return "mock-provider";
  }
  apiBase() {
    return "http://mock";
  }
  headers() {
    return {};
  }
  protected providerName() {
    return "mock-provider";
  }

  capabilities: ProviderCapabilities = {
    supportsVision: () => true,
    supportsTools: () => true,
    supportsStructuredOutput: () => true,
    supportsEmbeddings: () => true,
    supportsImageGeneration: () => true,
    supportsTranscription: () => true,
    supportsModeration: () => true,
    supportsReasoning: () => true,
    supportsDeveloperRole: () => true,
    getContextWindow: () => 128000
  };

  chat = vi.fn(async (req: ChatRequest): Promise<ChatResponse> => {
    return {
      content: `Response to ${req.messages[0].content}`,
      usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
    };
  });
}

describe("VCR Feature 1: Native Record & Replay", () => {
  const CASSETTE_NAME = "feature-1-vcr";
  const CASSETTE_PATH = path.join(process.cwd(), ".llm-cassettes", `${CASSETTE_NAME}.json`);
  let mock: MockProvider;

  beforeEach(() => {
    if (fs.existsSync(CASSETTE_PATH)) fs.unlinkSync(CASSETTE_PATH);
    mock = new MockProvider();
    providerRegistry.register("mock-provider", () => mock);
  });

  afterEach(() => {
    providerRegistry.setInterceptor(undefined);
  });

  test("Records and replays interactions correctly", async () => {
    // 1. RECORD PHASE
    const vcrRecord = setupVCR(CASSETTE_NAME, { mode: "record" });

    const llmRecord = NodeLLM.withProvider("mock-provider");
    // Removed unused res1 assignment to fix lint
    await llmRecord.chat().ask("Record me");

    await vcrRecord.stop();

    expect(fs.existsSync(CASSETTE_PATH)).toBe(true);
    expect(mock.chat).toHaveBeenCalledTimes(1);

    // 2. REPLAY PHASE
    mock.chat.mockClear();
    const vcrReplay = setupVCR(CASSETTE_NAME, { mode: "replay" });

    const llmReplay = NodeLLM.withProvider("mock-provider");
    const res2 = await llmReplay.chat().ask("Record me");

    expect(res2.content).toBe("Response to Record me");
    expect(mock.chat).toHaveBeenCalledTimes(0); // MOCKED BY VCR!

    await vcrReplay.stop();
  });
});
