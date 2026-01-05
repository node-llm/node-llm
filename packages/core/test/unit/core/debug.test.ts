import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NodeLLM } from "../../../src/llm.js";
import { config } from "../../../src/config.js";

describe("Debug Mode Configuration", () => {
  const originalDebugEnv = process.env.NODELLM_DEBUG;
  
  beforeEach(() => {
    delete process.env.NODELLM_DEBUG;
    config.debug = false;
  });

  afterEach(() => {
    if (originalDebugEnv !== undefined) {
      process.env.NODELLM_DEBUG = originalDebugEnv;
    } else {
      delete process.env.NODELLM_DEBUG;
    }
    config.debug = false;
  });

  it("should enable debug mode via configure()", () => {
    expect(config.debug).toBe(false);
    
    NodeLLM.configure({ debug: true });
    
    expect(config.debug).toBe(true);
  });

  it("should disable debug mode via configure()", () => {
    config.debug = true;
    
    NodeLLM.configure({ debug: false });
    
    expect(config.debug).toBe(false);
  });

  it("should support debug in scoped provider config", () => {
    config.debug = false;
    config.anthropicApiKey = "test-key";
    
    const scoped = NodeLLM.withProvider("anthropic", { debug: true });
    
    expect(scoped.config.debug).toBe(true);
    expect(config.debug).toBe(false);
  });

  it("should allow callback-style configuration", () => {
    NodeLLM.configure((cfg) => {
      cfg.debug = true;
    });
    
    expect(config.debug).toBe(true);
  });
});
