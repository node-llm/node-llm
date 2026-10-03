import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ContentPart, Message } from "@node-llm/core";

/** One block of MCP prompt content, as the SDK returns it. */
type MCPContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | { type: "audio"; data: string; mimeType: string }
  | { type: "resource_link"; uri: string; name?: string }
  | {
      type: "resource";
      resource: { uri: string; mimeType?: string; text?: string; blob?: string };
    };

/** Audio formats are named by their subtype, except MPEG audio, which is mp3. */
function audioFormat(mimeType: string): string {
  const subtype = mimeType.split("/")[1]?.split(";")[0] ?? "wav";
  return subtype === "mpeg" ? "mp3" : subtype;
}

/**
 * Converts one MCP content block into NodeLLM message content.
 *
 * Binary content travels as a data URI, the same way NodeLLM sends local files.
 * A binary resource that is neither an image nor a PDF has no portable form
 * across providers, so it is described in text rather than sent.
 */
function toContent(block: MCPContentBlock): string | ContentPart[] {
  switch (block.type) {
    case "text":
      return block.text;
    case "image":
      return [
        { type: "image_url", image_url: { url: `data:${block.mimeType};base64,${block.data}` } }
      ];
    case "audio":
      return [
        {
          type: "input_audio",
          input_audio: { data: block.data, format: audioFormat(block.mimeType) }
        }
      ];
    case "resource_link":
      return block.name ? `${block.name}: ${block.uri}` : block.uri;
    case "resource": {
      const { uri, mimeType, text, blob } = block.resource;
      if (text !== undefined) return text;
      if (
        blob !== undefined &&
        mimeType &&
        (mimeType.startsWith("image/") || mimeType === "application/pdf")
      ) {
        return [{ type: "image_url", image_url: { url: `data:${mimeType};base64,${blob}` } }];
      }
      return `[Binary resource ${uri}${mimeType ? ` (${mimeType})` : ""} not included]`;
    }
  }
}

/**
 * A wrapper for MCP Prompts that allows for easy discovery and retrieval.
 */
export class MCPPrompt {
  public name: string;
  public description?: string;
  public arguments?: any[];

  constructor(
    private readonly client: Client,
    private readonly metadata: {
      name: string;
      description?: string;
      arguments?: any[];
    }
  ) {
    this.name = metadata.name;
    this.description = metadata.description;
    this.arguments = metadata.arguments;
  }

  /**
   * Retrieves the prompt messages from the MCP server, in MCP's own format.
   * To add them to a chat, use getMessages() instead.
   */
  async get(args: Record<string, string> = {}) {
    return this.client.getPrompt({
      name: this.name,
      arguments: args
    });
  }

  /**
   * Retrieves the prompt as NodeLLM messages, ready for `chat.addMessages()`.
   *
   * MCP gives each message a single content object, which providers reject as
   * message content; this converts text, images, audio and resources into the
   * shapes NodeLLM sends.
   *
   * @example
   * const messages = await prompt.getMessages({ code });
   * await NodeLLM.chat("gpt-5").addMessages(messages).ask("Review this.");
   */
  async getMessages(args: Record<string, string> = {}): Promise<Message[]> {
    const { messages } = await this.get(args);
    return messages.map((message) => ({
      role: message.role,
      content: toContent(message.content as MCPContentBlock)
    }));
  }
}
