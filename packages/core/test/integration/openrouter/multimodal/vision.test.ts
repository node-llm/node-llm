import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

describe("OpenRouter Multi-modal Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");

    NodeLLM.configure({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter",
    });
    // Use a vision-capable model
    const chat = NodeLLM.chat("google/gemini-2.0-flash-exp:free");

    const response = await chat.ask("What's in this image?", {
      files: ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"]
    });

    const content = response.content.toLowerCase();
    expect(content).toMatch(/nature|boardwalk|grass|sky|path|landscape/);
    expect(response.usage?.total_tokens).toBeGreaterThan(0);
  });
});
