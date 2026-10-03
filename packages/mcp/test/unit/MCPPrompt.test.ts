import { describe, it, expect, vi } from "vitest";
import { MCPPrompt } from "../../src/MCPPrompt.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("MCPPrompt", () => {
  const mockClient = {
    getPrompt: vi.fn()
  } as unknown as Client;

  const metadata = {
    name: "test-prompt",
    description: "A test prompt",
    arguments: [{ name: "arg1", description: "First argument", required: true }]
  };

  it("should initialize with metadata", () => {
    const prompt = new MCPPrompt(mockClient, metadata);
    expect(prompt.name).toBe(metadata.name);
    expect(prompt.description).toBe(metadata.description);
    expect(prompt.arguments).toEqual(metadata.arguments);
  });

  it("should get prompt from client", async () => {
    const prompt = new MCPPrompt(mockClient, metadata);
    const mockResponse = {
      messages: [{ role: "user", content: { type: "text", text: "hello world" } }]
    };
    (mockClient.getPrompt as any).mockResolvedValue(mockResponse);

    const args = { arg1: "value1" };
    const result = await prompt.get(args);

    expect(mockClient.getPrompt).toHaveBeenCalledWith({
      name: metadata.name,
      arguments: args
    });
    expect(result).toEqual(mockResponse);
  });
});

describe("MCPPrompt.getMessages", () => {
  const client = { getPrompt: vi.fn() } as any;
  const prompt = () => new MCPPrompt(client, { name: "review" });
  const respond = (...messages: any[]) => client.getPrompt.mockResolvedValue({ messages });

  it("passes the arguments through to the server", async () => {
    respond({ role: "user", content: { type: "text", text: "hi" } });
    await prompt().getMessages({ code: "x = 1" });
    expect(client.getPrompt).toHaveBeenLastCalledWith({
      name: "review",
      arguments: { code: "x = 1" }
    });
  });

  it("turns text into plain message content", async () => {
    respond(
      { role: "user", content: { type: "text", text: "Review this" } },
      { role: "assistant", content: { type: "text", text: "Sure" } }
    );
    expect(await prompt().getMessages()).toEqual([
      { role: "user", content: "Review this" },
      { role: "assistant", content: "Sure" }
    ]);
  });

  it("sends images as data URIs", async () => {
    respond({ role: "user", content: { type: "image", data: "iVBOR", mimeType: "image/png" } });
    expect((await prompt().getMessages())[0]!.content).toEqual([
      { type: "image_url", image_url: { url: "data:image/png;base64,iVBOR" } }
    ]);
  });

  it("sends audio with its format", async () => {
    respond({ role: "user", content: { type: "audio", data: "SUQz", mimeType: "audio/mpeg" } });
    expect((await prompt().getMessages())[0]!.content).toEqual([
      { type: "input_audio", input_audio: { data: "SUQz", format: "mp3" } }
    ]);
  });

  it("inlines a text resource and links", async () => {
    respond(
      {
        role: "user",
        content: { type: "resource", resource: { uri: "file:///a.ts", text: "const a = 1;" } }
      },
      { role: "user", content: { type: "resource_link", uri: "file:///b.ts", name: "b.ts" } }
    );
    expect((await prompt().getMessages()).map((m) => m.content)).toEqual([
      "const a = 1;",
      "b.ts: file:///b.ts"
    ]);
  });

  it("sends an image or PDF blob, and describes other binaries instead of sending them", async () => {
    respond(
      {
        role: "user",
        content: {
          type: "resource",
          resource: { uri: "x.pdf", mimeType: "application/pdf", blob: "JVBER" }
        }
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: { uri: "x.zip", mimeType: "application/zip", blob: "UEsD" }
        }
      }
    );
    const [pdf, zip] = await prompt().getMessages();
    expect(pdf!.content).toEqual([
      { type: "image_url", image_url: { url: "data:application/pdf;base64,JVBER" } }
    ]);
    expect(zip!.content).toBe("[Binary resource x.zip (application/zip) not included]");
  });

  it("leaves get() returning MCP's own format", async () => {
    respond({ role: "user", content: { type: "text", text: "hi" } });
    const raw = await prompt().get();
    expect(raw.messages[0]).toEqual({ role: "user", content: { type: "text", text: "hi" } });
  });
});
