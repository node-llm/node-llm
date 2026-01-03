import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Multi-modal Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    NodeLLM.configure({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini",
    });
    const chat = NodeLLM.chat("gemini-2.0-flash");

    // A small 1x1 red PNG dot
    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const response = await chat.ask("What color is this image?", {
      images: [base64Image]
    });

    expect(String(response).toLowerCase()).toContain("red");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should transcribe audio", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    NodeLLM.configure({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini",
    });
    
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const audioPath = path.resolve(__dirname, "../../../../../../examples/audio/sample-0.mp3");
    
    const response = await NodeLLM.transcribe(audioPath, { model: "gemini-2.0-flash" });

    expect(response.text).toBeDefined();
    expect(response.text.length).toBeGreaterThan(0);
    expect(response.model).toBe("gemini-2.0-flash");
  });
});
