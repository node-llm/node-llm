import { Message } from "../../chat/Message.js";
import { GeminiContent, GeminiPart } from "./types.js";
import { BinaryUtils } from "../../utils/Binary.js";

export class GeminiChatUtils {
  static async convertMessages(
    messages: Message[]
  ): Promise<{ contents: GeminiContent[]; systemInstructionParts: GeminiPart[] }> {
    const contents: GeminiContent[] = [];
    const systemInstructionParts: GeminiPart[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      if (msg.role === "system" || msg.role === "developer") {
        if (msg.content) {
          systemInstructionParts.push({ text: String(msg.content) });
        }
      } else if (msg.role === "tool") {
        const parts: GeminiPart[] = [];
        let j = i;
        while (j < messages.length) {
          const toolMsg = messages[j];
          if (!toolMsg || toolMsg.role !== "tool") break;

          parts.push({
            functionResponse: {
              name: toolMsg.tool_call_id || "unknown",
              response: { result: toolMsg.content }
            }
          });
          j++;
        }
        contents.push({ role: "user", parts });
        i = j - 1;
      } else if (msg.role === "user" || msg.role === "assistant") {
        const parts: GeminiPart[] = [];
        const role = msg.role === "assistant" ? "model" : "user";

        if (msg.content && (typeof msg.content === "string" || msg.content instanceof String)) {
          parts.push({ text: String(msg.content) });
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (part.type === "text") {
              parts.push({ text: part.text });
            } else if (part.type === "image_url") {
              const binary = await BinaryUtils.toBase64(part.image_url.url);
              if (binary) {
                parts.push({
                  inlineData: {
                    mimeType: binary.mimeType,
                    data: binary.data
                  }
                });
              }
            } else if (part.type === "input_audio") {
              parts.push({
                inlineData: {
                  mimeType: `audio/${part.input_audio.format}`,
                  data: part.input_audio.data
                }
              });
            } else if (part.type === "video_url") {
              const binary = await BinaryUtils.toBase64(part.video_url.url);
              if (binary) {
                parts.push({
                  inlineData: {
                    mimeType: binary.mimeType,
                    data: binary.data
                  }
                });
              }
            }
          }
        }

        if (msg.role === "assistant" && msg.tool_calls) {
          for (const call of msg.tool_calls) {
            parts.push({
              functionCall: {
                name: call.function.name,
                args: JSON.parse(call.function.arguments)
              }
            });
          }
        }

        if (parts.length > 0) {
          contents.push({ role, parts });
        }
      }
    }

    return { contents, systemInstructionParts };
  }
}
