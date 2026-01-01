import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Anthropic Models Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support vision with image input", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    LLM.configure({ provider: "anthropic" });
    const chat = LLM.chat("claude-3-haiku-20240307");

    // A small 1x1 transparent GIF base64
    const base64Image = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    const response = await chat.ask([
        { type: "text", text: "What is this image?" },
        { type: "image_url", image_url: { url: `data:image/gif;base64,${base64Image}` } }
    ]);

    expect(response.content).toBeDefined();
    // Ideally it recognizes it's an image, even if it can't see much in a 1x1 pixel
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("should support PDF document input", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    LLM.configure({ provider: "anthropic" });
    const chat = LLM.chat("claude-3-5-haiku-20241022");

    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pdfPath = path.resolve(__dirname, "../../../../../../examples/documents/simple.pdf");

    const response = await chat.ask("What is this document?", {
        files: [pdfPath]
    });

    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
  });
});
