import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../src/index.js";
import { setupVCR } from "../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name);

    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");

    const response = await chat.ask("What is the capital of France?");

    expect(String(response)).toContain("Paris");
    expect(response.total_tokens).toBeGreaterThan(0);
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name);

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
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name);

    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");

    const response = await chat.ask("What's in this image?", {
      files: ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"]
    });

    expect(response.content.toLowerCase()).toMatch(/nature|boardwalk|grass|sky/);
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should generate images (Paint)", async ({ task }) => {
    polly = setupVCR(task.name);

    LLM.configure({ provider: "openai" });
    const image = await LLM.paint("a cute robot", { model: "dall-e-3" });

    expect(String(image)).toContain("https://");
    expect(image.revisedPrompt).toBeDefined();
  });

  it("should track total token usage", async ({ task }) => {
    polly = setupVCR(task.name);

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
    polly = setupVCR(task.name);

    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("Stream Test");
  });

  it("should transcribe audio", async ({ task }) => {
    polly = setupVCR(task.name);

    LLM.configure({ 
      provider: "openai",
      defaultTranscriptionModel: "whisper-1"
    });
    
    // Relative to packages/core where tests run
    const transcription = await LLM.transcribe("../../examples/audio/sample-0.mp3");

    expect(transcription.text).toBeDefined();
    expect(transcription.segments.length).toBeGreaterThan(0);
    expect(transcription.duration).toBeGreaterThan(0);
  });
});
