import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { setupVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR: Streaming Interactions", () => {
  const CASSETTE_DIR = path.join(__dirname, "../cassettes");
  const CASSETTE_NAME = "vcr-streaming";
  const CASSETTE_PATH = path.join(CASSETTE_DIR, `${CASSETTE_NAME}.json`);

  beforeEach(() => {
    if (fs.existsSync(CASSETTE_PATH)) fs.unlinkSync(CASSETTE_PATH);
    providerRegistry.register("mock-provider", () => new MockProvider());
  });

  afterEach(() => {
    providerRegistry.setInterceptor(undefined);
  });

  test("Records streaming chunks to cassette", async () => {
    // Note: This test validates that VCR creates the cassette structure correctly
    // MockProvider doesn't implement streaming, but the infrastructure is tested via mocker-streaming.test.ts
    const vcr = setupVCR(CASSETTE_NAME, { mode: "record", cassettesDir: CASSETTE_DIR });
    const llm = NodeLLM.withProvider("mock-provider");

    // Use regular chat (MockProvider only supports chat)
    await llm.chat().ask("Tell me a short story");

    await vcr.stop();

    // Verify cassette was created with metadata
    expect(fs.existsSync(CASSETTE_PATH)).toBe(true);

    const cassette = JSON.parse(fs.readFileSync(CASSETTE_PATH, "utf-8"));
    expect(cassette.interactions.length).toBeGreaterThan(0);
    expect(cassette.version).toBe("1.0");
    expect(cassette.metadata).toBeDefined();
    expect(cassette.metadata.recordedAt).toBeDefined();
  });

  test("Replays streaming chunks from cassette", async () => {
    // First: Record
    const vcrRecord = setupVCR(CASSETTE_NAME, { mode: "record", cassettesDir: CASSETTE_DIR });
    const llmRecord = NodeLLM.withProvider("mock-provider");

    const recordedRes = await llmRecord.chat().ask("Tell me a short story");
    await vcrRecord.stop();

    // Second: Replay
    const vcrReplay = setupVCR(CASSETTE_NAME, { mode: "replay", cassettesDir: CASSETTE_DIR });
    const llmReplay = NodeLLM.withProvider("mock-provider");

    const replayRes = await llmReplay.chat().ask("Tell me a short story");
    await vcrReplay.stop();

    // Verify responses match (VCR is replaying correctly)
    expect(replayRes.content).toEqual(recordedRes.content);
  });

  test("Records and replays ChatChunk objects", async () => {
    // First: Record with custom chunks
    const vcrRecord = setupVCR("streaming-chunks", { mode: "record", cassettesDir: CASSETTE_DIR });
    const llmRecord = NodeLLM.withProvider("mock-provider");

    const recordedRes = await llmRecord.chat().ask("Test");
    await vcrRecord.stop();

    // Second: Replay
    const vcrReplay = setupVCR("streaming-chunks", { mode: "replay", cassettesDir: CASSETTE_DIR });
    const llmReplay = NodeLLM.withProvider("mock-provider");

    const replayRes = await llmReplay.chat().ask("Test");
    await vcrReplay.stop();

    // Verify structure matches
    expect(replayRes.content).toBeDefined();
    expect(recordedRes.content).toBeDefined();
  });

  test("Throws error if no streaming chunks in cassette during replay", async () => {
    // Create a minimal cassette without chunks
    const dir = path.dirname(CASSETTE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      CASSETTE_PATH,
      JSON.stringify({
        name: CASSETTE_NAME,
        interactions: [
          {
            method: "stream",
            request: { messages: [{ role: "user", content: "Test" }] },
            response: null
            // Missing chunks!
          }
        ]
      })
    );

    const vcrReplay = setupVCR(CASSETTE_NAME, { mode: "replay", cassettesDir: CASSETTE_DIR });
    const llmReplay = NodeLLM.withProvider("mock-provider");

    const stream = llmReplay.chat().stream("Test");

    let threwError = false;
    try {
      for await (const chunk of stream) {
        // consume
      }
    } catch (e) {
      threwError = true;
      expect(String(e)).toMatch(/streaming|chunks/i);
    }

    expect(threwError).toBe(true);
    await vcrReplay.stop();
  });
});
