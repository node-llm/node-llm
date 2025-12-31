import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../src/index.js";
import { setupVCR } from "../helpers/vcr.js";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioPath = path.resolve(__dirname, "../../../../examples/audio/sample-0.mp3");

describe("OpenAI Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");

    const response = await chat.ask("What is the capital of France?");

    expect(String(response)).toContain("Paris");
    expect(response.total_tokens).toBeGreaterThan(0);
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });

    const weatherTool = {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather',
        parameters: { type: 'object', properties: { location: { type: 'string' } } }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 22, condition: "Sunny" });
      }
    };

    const chat = LLM.chat("gpt-4o-mini").withTool(weatherTool);
    const response = await chat.ask("What is the weather in London?");

    expect(String(response)).toContain("22");
    expect(String(response)).toContain("London");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should handle parallel tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });

    const weatherTool = {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather',
        parameters: { type: 'object', properties: { location: { type: 'string' } } }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 22 });
      }
    };

    const chat = LLM.chat("gpt-4o-mini").withTool(weatherTool);
    // Requesting weather for multiple locations triggers parallel calls
    const response = await chat.ask("What is the weather in Paris and London?");

    const Paris = String(response).includes("Paris");
    const London = String(response).includes("London");
    // Expect both locations to be mentioned in the final response
    expect(Paris && London).toBe(true);
    // Verify that tool calls happened (we can inspect history for more granular checks if needed)
    const toolCalls = chat.history.filter(m => m.role === "tool");
    expect(toolCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("should respect max_tokens parameter", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");

    const response = await chat.ask("Write a long poem about the sea.", {
      maxTokens: 5
    });

    // The output tokens should be <= 5 (or slightly more if provider is fuzzy, but usually exact)
    expect(response.usage.output_tokens).toBeLessThanOrEqual(5);
    // The content should be short
    expect(response.content.split(" ").length).toBeLessThan(10);
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
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

    LLM.configure({ provider: "openai" });
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

  it("should generate images (Paint)", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const image = await LLM.paint("a cute robot", { model: "dall-e-3" });

    expect(String(image)).toContain("https://");
    expect(image.revisedPrompt).toBeDefined();
  });

  it("should track total token usage", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");

    await chat.ask("Hello");
    await chat.ask("How are you?");

    const total = chat.totalUsage;
    expect(total.input_tokens).toBeGreaterThan(0);
    expect(total.output_tokens).toBeGreaterThan(0);
    expect(total.total_tokens).toBe(total.input_tokens + total.output_tokens);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("Stream Test");
  });

  it("should transcribe audio", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ 
      provider: "openai",
      defaultTranscriptionModel: "whisper-1"
    });
    
    // Using absolute path resolved from test file location
    const transcription = await LLM.transcribe(audioPath);
    
    expect(transcription.text).toBeDefined();
    expect(transcription.segments.length).toBeGreaterThan(0);
    expect(transcription.duration).toBeGreaterThan(0);
  });

  it("should transcribe audio using gpt-4o-transcribe", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const transcription = await LLM.transcribe(audioPath, {
      model: "gpt-4o-transcribe"
    });

    expect(transcription.text).toBeDefined();
    expect(transcription.model).toBe("gpt-4o-transcribe");
  });

  it("should moderate content", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const result = await LLM.moderate("This is a safe message about coding.");

    expect(result.flagged).toBe(false);
    expect(result.model).toBeDefined();
    expect(result.id).toBeDefined();
  });
});
