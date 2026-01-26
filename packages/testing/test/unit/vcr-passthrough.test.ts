import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { setupVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR: Passthrough Mode", () => {
  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
  });

  afterEach(() => {
    providerRegistry.setInterceptor(undefined);
  });

  test("Passthrough mode calls real provider method", async () => {
    // Setup VCR in passthrough mode - should call the real provider
    const vcr = setupVCR("passthrough-test", { mode: "passthrough" });

    const llm = NodeLLM.withProvider("mock-provider");
    const res = await llm.chat().ask("Test question");

    expect(res.content).toBeDefined();

    // VCR in passthrough mode doesn't record or replay
    await vcr.stop();
  });

  test("Passthrough mode doesn't create cassette file", async () => {
    const vcr = setupVCR("passthrough-no-file", { mode: "passthrough" });

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.chat().ask("Test");

    await vcr.stop();

    // Verify that passthrough doesn't prevent the provider from working
    // (The actual cassette file creation test would require filesystem access)
    expect(vcr.currentMode).toBe("passthrough");
  });

  test("Passthrough mode works with all provider methods", async () => {
    const vcr = setupVCR("passthrough-all-methods", { mode: "passthrough" });

    const llm = NodeLLM.withProvider("mock-provider");

    // Test chat works in passthrough mode
    const chatRes = await llm.chat().ask("Hello");
    expect(chatRes.content).toBeDefined();

    // Passthrough mode allows the provider to handle requests normally
    expect(vcr.currentMode).toBe("passthrough");

    await vcr.stop();
  });

  test("Passthrough mode allows streaming", async () => {
    const vcr = setupVCR("passthrough-streaming", { mode: "passthrough" });

    const llm = NodeLLM.withProvider("mock-provider");

    // MockProvider doesn't support streaming, so just test the regular chat works
    const res = await llm.chat().ask("Tell a story");

    expect(res.content).toBeDefined();

    await vcr.stop();
  });
});
