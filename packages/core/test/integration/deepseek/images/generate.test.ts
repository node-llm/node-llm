import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Images Integration (VCR)", { timeout: 30000 }, () => {
    let polly: any;

    afterEach(async () => {
        if (polly) {
            await polly.stop();
        }
    });

    it("should throw error for image generation", async ({ task }) => {
        polly = setupVCR(task.name, "deepseek");
        LLM.configure({ provider: "deepseek" });
        await expect(LLM.paint({ prompt: "test" })).rejects.toThrow(/does not support paint/i);
    });
});
