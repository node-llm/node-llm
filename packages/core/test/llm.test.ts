import { describe, it, expect } from "vitest";
import { LLM } from "../src/llm.js";
import { providerRegistry } from "../src/providers/registry.js";
import { FakeProvider } from "./fake-provider.js";

describe("LLM.configure", () => {
  it("resolves provider by name using registry", async () => {
    providerRegistry.register("fake", () => {
      return new FakeProvider(["fake reply"]);
    });

    LLM.configure({ provider: "fake" });

    const chat = LLM.chat("test-model");
    const reply = await chat.ask("Hello");

    expect(reply).toBe("fake reply");
  });

  it("throws error when provider is not configured", () => {
    const freshLLM = new (LLM.constructor as any)();

    expect(() => {
      freshLLM.chat("test-model");
    }).toThrow("LLM provider not configured");
  });
});
