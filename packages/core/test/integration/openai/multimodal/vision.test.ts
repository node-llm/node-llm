import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Multi-modal Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const chat = LLM.chat("gpt-4o-mini");

    const response = await chat.ask("What's in this image?", {
      files: ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"]
    });

    expect(response.content.toLowerCase()).toMatch(/nature|boardwalk|grass|sky/);
    expect(response.usage.input_tokens).toBeGreaterThan(0);
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should analyze multiple images (Multi-Image Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const chat = LLM.chat("gpt-4o-mini");

    // Two differing images (Base64 1x1 pixels to avoid download errors)
    // Red dot
    const img1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    // Blue dot
    const img2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const response = await chat.ask("Compare these two images. One is red, one is blue.", {
      files: [img1, img2] // using 'files' as alias for images
    });

    const content = response.content.toLowerCase();
    // Expect mention of comparison or description of both
    expect(content.length).toBeGreaterThan(20);
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should transcribe audio", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    
    LLM.configure((config) => {
      config.openaiApiKey = process.env.OPENAI_API_KEY;
    });

    LLM.configure({ 
      provider: "openai",
      defaultTranscriptionModel: "whisper-1",
    });
    
    // Using absolute path resolved from test file location
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const audioPath = path.resolve(__dirname, "../../../../../../examples/audio/sample-0.mp3");

    const transcription = await LLM.transcribe(audioPath);
    
    expect(transcription.text).toBeDefined();
    expect(transcription.segments.length).toBeGreaterThan(0);
    expect(transcription.duration).toBeGreaterThan(0);
  });

  it("should transcribe audio using gpt-4o-transcribe", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const audioPath = path.resolve(__dirname, "../../../../../../examples/audio/sample-0.mp3");

    const transcription = await LLM.transcribe(audioPath, {
      model: "gpt-4o-transcribe"
    });

    expect(transcription.text).toBeDefined();
    expect(transcription.model).toBe("gpt-4o-transcribe");
  });
});
