import { describe, it, expect, vi, beforeEach } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";

class MockVisionProvider implements Provider {
  public lastRequest: ChatRequest | undefined;

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.lastRequest = { ...request, messages: [...request.messages] };
    return { content: "I see a cat in the image." };
  }
}

describe("Chat Vision Support", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
      headers: { get: () => "image/jpeg" }
    })));
  });

  it("should format image requests correctly", async () => {
    const provider = new MockVisionProvider();
    const chat = new Chat(provider, "gpt-4-vision-preview");

    await chat.ask("Describe this image", {
      files: ["https://example.com/cat.jpg"],
    });

    // We captured a copy of messages in MockVisionProvider, so at(-1) is the user message sent to the provider.
    const lastMessage = provider.lastRequest?.messages.at(-1);
    expect(lastMessage?.role).toBe("user");
    
    const content = lastMessage?.content;
    expect(Array.isArray(content)).toBe(true);
    
    if (Array.isArray(content)) {
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({ type: "text", text: "Describe this image" });
      const imgPart = content[1] as any;
      expect(imgPart.type).toBe("image_url");
      expect(imgPart.image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    }
  });

  it("should handle multiple images", async () => {
    const provider = new MockVisionProvider();
    const chat = new Chat(provider, "gpt-4-vision-preview");

    await chat.ask("Compare these", {
      files: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
    });

    const content = provider.lastRequest?.messages.at(-1)?.content;
    
    if (Array.isArray(content)) {
      expect(content).toHaveLength(3); // 1 text + 2 images
      const imgPart1 = content[1] as any;
      const imgPart2 = content[2] as any;
      expect(imgPart1.type).toBe("image_url");
      expect(imgPart1.image_url.url).toMatch(/^data:image\/jpeg;base64,/);
      expect(imgPart2.type).toBe("image_url");
      expect(imgPart2.image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    }
  });

  it("should handle local image files", async () => {
    const provider = new MockVisionProvider();
    const chat = new Chat(provider, "gpt-4-vision-preview");
    
    // Create a dummy file
    const fs = await import("fs/promises");
    const dummyPath = "test-image.jpg";
    await fs.writeFile(dummyPath, Buffer.from("fake-image-data"));

    try {
      await chat.ask("Describe this local image", {
        images: [dummyPath],
      });

      // Look at the user message
      const content = provider.lastRequest?.messages.at(-1)?.content;
      
      if (Array.isArray(content)) {
        expect(content).toHaveLength(2);
        const imgPart = content[1] as any;
        expect(imgPart.type).toBe("image_url");
        // Should be converted to data URI
        expect(imgPart.image_url.url).toMatch(/^data:image\/jpeg;base64,/);
      }
    } finally {
      await fs.unlink(dummyPath);
    }
  });

});
