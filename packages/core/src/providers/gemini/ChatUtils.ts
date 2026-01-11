import { Message } from "../../chat/Message.js";
import { GeminiContent, GeminiPart } from "./types.js";
import { BinaryUtils } from "../../utils/Binary.js";

export class GeminiChatUtils {
  static async convertMessages(messages: Message[]): Promise<{ contents: GeminiContent[]; systemInstructionParts: GeminiPart[] }> {
    const contents: GeminiContent[] = [];
    const systemInstructionParts: GeminiPart[] = [];

    for (const msg of messages) {
      if (msg.role === "system" || msg.role === "developer") {
        if (typeof msg.content === "string") {
          systemInstructionParts.push({ text: msg.content });
        }
      } else if (msg.role === "user" || msg.role === "assistant" || msg.role === "tool") {
        const parts: GeminiPart[] = [];

        if (msg.role === "tool") {
          parts.push({
            functionResponse: {
              name: msg.tool_call_id || "unknown",
              response: { result: msg.content },
            },
          });
          contents.push({ role: "user", parts });
        } else {
          const role = msg.role === "assistant" ? "model" : "user";
          
          if (typeof msg.content === "string" && msg.content) {
            parts.push({ text: msg.content });
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
                      data: binary.data,
                    },
                  });
                }
              } else if (part.type === "input_audio") {
                parts.push({
                  inlineData: {
                    mimeType: `audio/${part.input_audio.format}`,
                    data: part.input_audio.data,
                  },
                });
              } else if (part.type === "video_url") {
                const binary = await BinaryUtils.toBase64(part.video_url.url);
                if (binary) {
                  parts.push({
                    inlineData: {
                      mimeType: binary.mimeType,
                      data: binary.data,
                    },
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
                  args: JSON.parse(call.function.arguments),
                },
              });
            }
          }

          if (parts.length > 0) {
            contents.push({ role, parts });
          }
        }
      }
    }

    return { contents, systemInstructionParts };
  }
}
