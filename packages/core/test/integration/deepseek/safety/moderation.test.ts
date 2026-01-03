import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
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
        
        NodeLLM.configure({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek",
    });
        await expect(NodeLLM.moderate({ input: "test" })).rejects.toThrow(/does not support moderate/i);
    });
});
