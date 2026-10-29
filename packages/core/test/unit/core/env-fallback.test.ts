import { describe, it, expect, vi, afterEach } from "vitest";
import { createLLM } from "../../../src/llm.js";

describe("envFallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("never uses a key from the environment when it is false", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-from-the-machine");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    expect(() => createLLM({ provider: "openai", envFallback: false })).toThrow(
      /openaiApiKey is not set/
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses the key passed in code", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-from-the-machine");

    const llm = createLLM({ provider: "openai", envFallback: false, openaiApiKey: "sk-customer" });

    expect(llm.config.openaiApiKey).toBe("sk-customer");
  });

  it("still reads the environment by default", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-from-the-machine");

    expect(createLLM({ provider: "openai" }).config.openaiApiKey).toBe("sk-from-the-machine");
  });
});
