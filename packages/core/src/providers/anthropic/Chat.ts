import { ChatRequest, ChatResponse, ThinkingResult } from "../Provider.js";
import { AnthropicMessageResponse } from "./types.js";
import { ToolCall } from "../../chat/Tool.js";
import { handleAnthropicError } from "./Errors.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { buildMessageRequest, hasPdf, toUsage } from "./Utils.js";

export class AnthropicChat {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model;
    const body = buildMessageRequest(request, false);

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      ...request.headers
    };

    if (hasPdf(body)) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }

    const url = `${this.baseUrl}/messages`;
    logger.logRequest("Anthropic", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
        signal: request.signal
      },
      request.requestTimeout
    );

    if (!response.ok) {
      await handleAnthropicError(response, model);
    }

    const json = (await response.json()) as AnthropicMessageResponse;
    logger.logResponse("Anthropic", response.status, response.statusText, json);
    const contentBlocks = json.content;

    // Extract text content and tool calls
    let content: string | null = null;
    let thinkingResult: ThinkingResult | undefined = undefined;
    const toolCalls: ToolCall[] = [];

    for (const block of contentBlocks) {
      if (block.type === "text") {
        if (content === null) content = "";
        content += block.text;
      } else if (block.type === "thinking") {
        // Handle thinking block (Claude 3.7)
        if (!thinkingResult) thinkingResult = { text: "" };
        if (block.thinking) {
          thinkingResult.text = (thinkingResult.text || "") + block.thinking;
        }
        if (block.signature) thinkingResult.signature = block.signature;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id!,
          type: "function",
          function: {
            name: block.name!,
            arguments: JSON.stringify(block.input)
          }
        });
      }
    }

    const usage = json.usage ? toUsage(json.usage) : undefined;

    const calculatedUsage = usage
      ? ModelRegistry.calculateCost(usage, model, "anthropic")
      : undefined;

    return {
      content,
      usage: calculatedUsage,
      thinking: thinkingResult,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined
    };
  }
}
