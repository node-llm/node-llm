import { describe, it, expect, vi } from "vitest";
import { Capabilities } from "../../../../src/providers/deepseek/Capabilities.js";

describe("DeepSeek Capabilities", () => {
    it("should return correct capabilities for deepseek-chat", () => {
        const caps = Capabilities.getCapabilities("deepseek-chat");
        expect(caps).toContain("streaming");
        expect(caps).toContain("function_calling");
        expect(caps).not.toContain("reasoning");
    });

    it("should return correct capabilities for deepseek-reasoner", () => {
        const caps = Capabilities.getCapabilities("deepseek-reasoner");
        expect(caps).toContain("streaming");
        expect(caps).toContain("reasoning");
        // DeepSeek R1 currently doesn't support function calling in our implementation
        expect(caps).not.toContain("function_calling"); 
    });

    it("should correct context window", () => {
        expect(Capabilities.getContextWindow("deepseek-chat")).toBe(128000);
        expect(Capabilities.getContextWindow("deepseek-reasoner")).toBe(128000);
        expect(Capabilities.getContextWindow("unknown-model")).toBe(32768);
    });

    it("should only support tools for chat model", () => {
        expect(Capabilities.supportsTools("deepseek-chat")).toBe(true);
        expect(Capabilities.supportsTools("deepseek-reasoner")).toBe(false);
    });

    it("should support structured output for both", () => {
        expect(Capabilities.supportsStructuredOutput("deepseek-chat")).toBe(true);
        expect(Capabilities.supportsStructuredOutput("deepseek-reasoner")).toBe(true);
    });
});
