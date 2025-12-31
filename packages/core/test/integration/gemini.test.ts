import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../src/index.js";
import { setupVCR } from "../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    LLM.configure({ provider: "gemini" });
    const chat = LLM.chat("gemini-2.0-flash");

    const response = await chat.ask("What is the capital of Japan?");

    expect(String(response)).toContain("Tokyo");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    LLM.configure({ provider: "gemini" });

    const weatherTool = {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather',
        parameters: { type: 'object', properties: { location: { type: 'string' } } }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 18, condition: "Cloudy" });
      }
    };

    const chat = LLM.chat("gemini-2.0-flash").withTool(weatherTool);
    const response = await chat.ask("What is the weather in Berlin?");

    expect(String(response)).toContain("18");
    expect(String(response)).toContain("Berlin");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    LLM.configure({ provider: "gemini" });
    const chat = LLM.chat("gemini-2.0-flash");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("Stream Test");
  });

  it("should list available models", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    LLM.configure({ provider: "gemini" });
    const models = await LLM.listModels();

    expect(models.length).toBeGreaterThan(0);
    const flash = models.find(m => m.id.includes("flash"));
    expect(flash).toBeDefined();
    expect(flash?.provider).toBe("gemini");
    expect(flash?.capabilities).toContain("streaming");
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    LLM.configure({ provider: "gemini" });
    const chat = LLM.chat("gemini-2.0-flash");

    // A small 1x1 red PNG dot
    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const response = await chat.ask("What color is this image?", {
      images: [base64Image]
    });

    expect(String(response).toLowerCase()).toContain("red");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should generate an image (Paint)", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    LLM.configure({ provider: "gemini" });
    const response = await LLM.paint("A sunset over the mountains", { 
      model: "imagen-4.0-generate-001" 
    });

    expect(response.data).toBeDefined();
    expect(response.mimeType).toBe("image/png");
  });
});
