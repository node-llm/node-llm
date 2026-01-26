import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { setupVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR Feature 1: Native Record & Replay", () => {
  const CASSETTE_NAME = "feature-1-vcr";
  const CASSETTE_PATH = path.join(process.cwd(), "test/cassettes", `${CASSETTE_NAME}.json`);
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
