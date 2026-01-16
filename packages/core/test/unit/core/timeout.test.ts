import { describe, it, expect } from "vitest";
import { createLLM } from "../../../src/llm.js";

describe("Request Timeout Configuration", () => {
  it("should have default timeout of 30 seconds", () => {
    const llm = createLLM();
    // Default is from configuration class, check what it is there or expected behavior.
    // Assuming 30000 is default in Configuration class.
    // Note: If using mock config it might be different, but createLLM() creates fresh Config instance if none passed.
    expect(llm.config.requestTimeout).toBe(30000);
  });

  it("should accept requestTimeout in global config", () => {
    const llm = createLLM({ requestTimeout: 60000 });
    expect(llm.config.requestTimeout).toBe(60000);
  });

  it("should allow per-chat timeout configuration", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key"
    });
    const chat = llm.chat("gpt-4o", { requestTimeout: 45000 });

    // The timeout should be stored in chat options
    expect((chat as unknown as { options: { requestTimeout: number } }).options.requestTimeout).toBe(
      45000
    );
  });
});
