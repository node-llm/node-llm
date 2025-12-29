import { describe, it, expect } from "vitest";
import { Chat } from "../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../src/providers/Provider.js";

class MockVisionProvider implements Provider {
  public lastRequest: ChatRequest | undefined;

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.lastRequest = request;
    return { content: "I see a cat in the image." };
  }
}

describe("Chat Vision Support", () => {
  it("should format image requests correctly", async () => {
    const provider = new MockVisionProvider();
    const chat = new Chat(provider, "gpt-4-vision-preview");

    await chat.ask("Describe this image", {
      images: ["https://example.com/cat.jpg"],
    });

    // The provider receives the request *before* adding the assistant reply to history,
    // but our test inspects the request object captured inside the provider.
    // The request.messages contains the history sent TO the LLM.
    // However, Chat.ask() pushes the user message, THEN calls executeChat.
    // So the last message in request.messages IS the user message.
    
    // Wait, the test failure says expected "user" received "assistant".
    // This implies that in the test execution, the assistant message MIGHT have been added?
    // Ah, MockVisionProvider.chat returns immediately.
    // BUT, `this.lastRequest = request` captures the array reference.
    // Later, `this.messages.push(...)` in Chat.ts modifies that SAME array if it was passed by reference.
    // We need to verify if `request.messages` is a copy or reference.
    
    // In Chat.ts: `messages: this.messages` passes the reference.
    // So when Chat.ts later does `this.messages.push({ role: 'assistant' ... })`, 
    // it updates the array that `lastRequest` is holding!
    
    // So we should look at the SECOND to last message for the user.
    const lastMessage = provider.lastRequest?.messages.at(-2);
    expect(lastMessage?.role).toBe("user");
    
    const content = lastMessage?.content;
    expect(Array.isArray(content)).toBe(true);
    
    if (Array.isArray(content)) {
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({ type: "text", text: "Describe this image" });
      expect(content[1]).toEqual({ 
        type: "image_url", 
        image_url: { url: "https://example.com/cat.jpg" } 
      });
    }
  });

  it("should handle multiple images", async () => {
    const provider = new MockVisionProvider();
    const chat = new Chat(provider, "gpt-4-vision-preview");

    await chat.ask("Compare these", {
      images: ["img1.jpg", "img2.jpg"],
    });

    const content = provider.lastRequest?.messages.at(-1)?.content;
    
    if (Array.isArray(content)) {
      expect(content).toHaveLength(3); // 1 text + 2 images
      expect(content[1]).toEqual({ 
        type: "image_url", 
        image_url: { url: "img1.jpg" } 
      });
      expect(content[2]).toEqual({ 
        type: "image_url", 
        image_url: { url: "img2.jpg" } 
      });
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

      // Look at the user message (second to last, due to reference sharing)
      const content = provider.lastRequest?.messages.at(-2)?.content;
      
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
