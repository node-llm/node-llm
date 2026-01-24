import { ChatRequest, ChatResponse } from "../Provider.js";
import { GeminiGenerateContentRequest, GeminiGenerateContentResponse } from "./types.js";
import { Capabilities } from "./Capabilities.js";
import { handleGeminiError } from "./Errors.js";
import { GeminiChatUtils } from "./ChatUtils.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

export class GeminiChat {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);
    const url = `${this.baseUrl}/models/${request.model}:generateContent?key=${this.apiKey}`;

    const { contents, systemInstructionParts } = await GeminiChatUtils.convertMessages(
      request.messages
    );

    const generationConfig: any = {
      temperature: temperature ?? undefined,
      maxOutputTokens: request.max_tokens
    };

    if (request.response_format?.type === "json_object") {
      generationConfig.responseMimeType = "application/json";
    } else if (request.response_format?.type === "json_schema") {
      generationConfig.responseMimeType = "application/json";
      if (request.response_format.json_schema?.schema) {
        generationConfig.responseSchema = this.sanitizeSchema(
          request.response_format.json_schema.schema
        );
      }
    }

    const {
      model: _model,
      messages: _messages,
      tools: _tools,
      temperature: _temp,
      max_tokens: _max,
      response_format: _format,
      headers: _headers,
      requestTimeout,
      ...rest
    } = request;

    const payload: any = {
      contents,
      generationConfig: {
        ...generationConfig,
        ...(rest.generationConfig || {})
      },
      ...rest
    };

    if (systemInstructionParts.length > 0) {
      payload.systemInstruction = { parts: systemInstructionParts };
    }

    if (request.tools && request.tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters
          }))
        }
      ];
    }

    logger.logRequest("Gemini", "POST", url, payload);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      },
      requestTimeout
    );

    if (!response.ok) {
      await handleGeminiError(response, request.model);
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;
    logger.logResponse("Gemini", response.status, response.statusText, json);
    const candidate = json.candidates?.[0];

    const content =
      candidate?.content?.parts
        ?.filter((p) => p.text)
        .map((p) => p.text)
        .join("\n") || null;

    const tool_calls = candidate?.content?.parts
      ?.filter((p) => p.functionCall)
      .map((p) => ({
        id: p.functionCall!.name,
        type: "function" as const,
        function: {
          name: p.functionCall!.name,
          arguments: JSON.stringify(p.functionCall!.args)
        }
      }));

    const usage = json.usageMetadata
      ? {
          input_tokens: json.usageMetadata.promptTokenCount,
          output_tokens: json.usageMetadata.candidatesTokenCount,
          total_tokens: json.usageMetadata.totalTokenCount
        }
      : undefined;

    const calculatedUsage = usage
      ? ModelRegistry.calculateCost(usage, request.model, "gemini")
      : undefined;

    return { content, tool_calls, usage: calculatedUsage };
  }

  private sanitizeSchema(schema: any): any {
    if (typeof schema !== "object" || schema === null) return schema;

    const sanitized = { ...schema };

    // Remove unsupported fields
    delete sanitized.additionalProperties;
    delete sanitized.$schema;
    delete sanitized.$id;
    delete sanitized.definitions;

    // Recursively sanitize
    if (sanitized.properties) {
      for (const key in sanitized.properties) {
        sanitized.properties[key] = this.sanitizeSchema(sanitized.properties[key]);
      }
    }

    if (sanitized.items) {
      sanitized.items = this.sanitizeSchema(sanitized.items);
    }

    return sanitized;
  }
}
