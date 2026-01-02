import { describe, it, expect, afterEach } from "vitest";
import { LLM, z } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Chat Structured Output Integration (VCR)", { timeout: 30000 }, () => {
    let polly: any;

    afterEach(async () => {
        if (polly) {
            await polly.stop();
        }
    });

    it("should support structured output with Zod", async ({ task }) => {
        polly = setupVCR(task.name, "deepseek");
        LLM.configure({ provider: "deepseek" });
        const chat = LLM.chat("deepseek-chat");

        const recipeSchema = z.object({
            name: z.string(),
            ingredients: z.array(z.string()),
            prep_time: z.number()
        });

        const response = await chat
            .withSchema(recipeSchema)
            .ask("Give me a recipe for toast.");

        expect(response.parsed).toBeDefined();
        expect(response.parsed.name).toBeDefined();
        expect(Array.isArray(response.parsed.ingredients)).toBe(true);
        expect(typeof response.parsed.prep_time).toBe("number");
    });
});
