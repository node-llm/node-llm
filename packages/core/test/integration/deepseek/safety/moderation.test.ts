import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Safety Integration (VCR)", { timeout: 30000 }, () => {
    let polly: any;

    afterEach(async () => {
        if (polly) {
            await polly.stop();
        }
    });

    it("should throw error for moderation", async ({ task }) => {
        polly = setupVCR(task.name, "deepseek");
        
        LLM.configure({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek",
    });
        await expect(LLM.moderate({ input: "test" })).rejects.toThrow(/does not support moderate/i);
    });
});
