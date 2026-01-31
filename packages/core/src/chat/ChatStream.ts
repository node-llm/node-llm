import { Message } from "./Message.js";
import {
  ContentPart,
  isBinaryContent,
  formatMultimodalContent,
  MessageContent
} from "./Content.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, ChatChunk, Usage, ThinkingResult } from "../providers/Provider.js";
import { ChatResponseString } from "./ChatResponse.js";
import { Stream } from "../streaming/Stream.js";
import { config } from "../config.js";
import { ToolExecutionMode } from "../constants.js";
import { AskOptions } from "./Chat.js";
import { FileLoader } from "../utils/FileLoader.js";
import { toJsonSchema } from "../schema/to-json-schema.js";
import { ToolDefinition, ToolCall } from "./Tool.js";
import { ChatValidator } from "./Validation.js";
import { ToolHandler } from "./ToolHandler.js";
import { logger } from "../utils/logger.js";
import { ResponseFormat } from "../providers/Provider.js";
import { ModelRegistry } from "../models/ModelRegistry.js";
import { Middleware, MiddlewareContext } from "../types/Middleware.js";
import { randomUUID } from "node:crypto";

/**
 * Internal handler for chat streaming logic.
 * Wraps the provider's stream with side effects like history updates and events.
 */
export class ChatStream {
  private messages: Message[];
  private systemMessages: Message[];

  constructor(
    private readonly provider: Provider,
    private readonly model: string,
    private readonly options: ChatOptions = {},
    messages?: Message[],
    systemMessages?: Message[]
  ) {
    this.messages = messages ?? [];
    this.systemMessages = systemMessages ?? [];

    if (this.messages.length === 0 && this.systemMessages.length === 0) {
      if (options.systemPrompt) {
        this.systemMessages.push({
          role: "system",
          content: options.systemPrompt
        });
      }

      if (options.messages) {
        for (const msg of options.messages) {
          if (msg.role === "system" || msg.role === "developer") {
            this.systemMessages.push(msg);
          } else {
            this.messages.push(msg);
          }
        }
      }
    }

    if (!this.options.toolExecution) {
      this.options.toolExecution = config.toolExecution || ToolExecutionMode.AUTO;
    }
  }

  get history(): readonly Message[] {
    return [...this.systemMessages, ...this.messages];
  }

  create(content: string | ContentPart[], options: AskOptions = {}): Stream<ChatChunk> {
    const controller = new AbortController();

    const sideEffectGenerator = async function* (
      self: ChatStream,
      provider: Provider,
      model: string,
      messages: Message[],
      systemMessages: Message[],
      baseOptions: ChatOptions,
      abortController: AbortController,
      content: string | ContentPart[],
      requestOptions: AskOptions
    ) {
      const options = {
        ...baseOptions,
        ...requestOptions,
        headers: { ...baseOptions.headers, ...requestOptions.headers }
      };

      const requestId = randomUUID();
      const state: Record<string, unknown> = {};
      const middlewares = options.middlewares || [];

      // Process Multimodal Content
      let messageContent: MessageContent = content;
      const files = [...(requestOptions.images ?? []), ...(requestOptions.files ?? [])];

      if (files.length > 0) {
        const processedFiles = await Promise.all(files.map((f: string) => FileLoader.load(f)));
        const hasBinary = processedFiles.some(isBinaryContent);

        ChatValidator.validateVision(provider, model, hasBinary, options);
        messageContent = formatMultimodalContent(content, processedFiles);
      }

      if (options.tools && options.tools.length > 0) {
        ChatValidator.validateTools(provider, model, true, options);
      }

      messages.push({ role: "user", content: messageContent });

      // Prepare Middleware Context
      const context: MiddlewareContext = {
        requestId,
        provider: provider.id,
        model: model,
        messages: [...systemMessages, ...messages],
        options: options,
        state
      };

      try {
        // 1. onRequest Hook
        await runMiddleware(middlewares, "onRequest", context);

        if (!provider.stream) {
          throw new Error("Streaming not supported by provider");
        }

        // Process Schema/Structured Output
        let responseFormat: ResponseFormat | undefined = options.responseFormat;
        if (!responseFormat && options.schema) {
          ChatValidator.validateStructuredOutput(provider, model, true, options);

          const jsonSchema = toJsonSchema(options.schema.definition.schema);
          responseFormat = {
            type: "json_schema",
            json_schema: {
              name: options.schema.definition.name,
              description: options.schema.definition.description,
              strict: options.schema.definition.strict ?? true,
              schema: jsonSchema
            }
          };
        }

        let isFirst = true;
        const maxToolCalls = options.maxToolCalls ?? 5;
        let stepCount = 0;

        const totalUsage: Usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
        const trackUsage = (u?: Usage) => {
          if (u) {
            // Fallback cost calculation if provider didn't return it
            if (u.cost === undefined) {
              const withCost = ModelRegistry.calculateCost(u, model, provider.id);
              u.cost = (withCost as Usage).cost;
              u.input_cost = (withCost as Usage).input_cost;
              u.output_cost = (withCost as Usage).output_cost;
            }

            totalUsage.input_tokens += u.input_tokens;
            totalUsage.output_tokens += u.output_tokens;
            totalUsage.total_tokens += u.total_tokens;
            if (u.cached_tokens) {
              totalUsage.cached_tokens = (totalUsage.cached_tokens ?? 0) + u.cached_tokens;
            }
            if (u.cost !== undefined) {
              totalUsage.cost = (totalUsage.cost ?? 0) + u.cost;
            }
          }
        };

        let assistantResponse: ChatResponseString | undefined;

        while (true) {
          stepCount++;
          if (stepCount > maxToolCalls) {
            throw new Error(
              `[NodeLLM] Maximum tool execution calls (${maxToolCalls}) exceeded during streaming.`
            );
          }

          let fullContent = "";
          let fullReasoning = "";
          const thinking: ThinkingResult = { text: "" };
          let toolCalls: ToolCall[] | undefined;
          let currentTurnUsage: Usage | undefined;

          let requestMessages = context.messages || []; // Use messages from context which can be mutated
          if (options.onBeforeRequest) {
            const result = await options.onBeforeRequest(requestMessages);
            if (result) {
              requestMessages = result;
            }
          }

          for await (const chunk of provider.stream({
            model,
            messages: requestMessages,
            tools: options.tools as ToolDefinition[],
            temperature: options.temperature,
            max_tokens: options.maxTokens ?? config.maxTokens,
            response_format: responseFormat,
            headers: options.headers,
            requestTimeout: options.requestTimeout ?? config.requestTimeout,
            thinking: options.thinking,
            signal: abortController.signal,
            ...options.params
          })) {
            if (isFirst) {
              if (options.onNewMessage) options.onNewMessage();
              isFirst = false;
            }

            if (chunk.content) {
              fullContent += chunk.content;
              yield chunk;
            }

            if (chunk.reasoning) {
              fullReasoning += chunk.reasoning;
              yield { content: "", reasoning: chunk.reasoning };
            }

            if (chunk.thinking) {
              if (chunk.thinking.text) {
                thinking.text += chunk.thinking.text;
              }
              if (chunk.thinking.signature) {
                thinking.signature = chunk.thinking.signature;
              }
              if (chunk.thinking.tokens) {
                thinking.tokens = (thinking.tokens ?? 0) + chunk.thinking.tokens;
              }
              yield chunk;
            }

            if (chunk.tool_calls) {
              toolCalls = chunk.tool_calls;
            }

            if ((chunk as { usage?: Usage }).usage) {
              currentTurnUsage = (chunk as { usage: Usage }).usage;
              trackUsage(currentTurnUsage);
            }
          }

          assistantResponse = new ChatResponseString(
            fullContent || "",
            currentTurnUsage || { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
            model,
            provider.id,
            thinking.text || thinking.signature ? thinking : undefined,
            fullReasoning || undefined,
            toolCalls,
            undefined, // finish_reason
            options.schema
          );

          if (options.onAfterResponse) {
            const result = await options.onAfterResponse(assistantResponse);
            if (result) {
              assistantResponse = result;
            }
          }

          messages.push({
            role: "assistant",
            content: assistantResponse || null,
            tool_calls: toolCalls,
            reasoning: fullReasoning || undefined,
            usage: currentTurnUsage
          });

          if (!toolCalls || toolCalls.length === 0) {
            if (options.onEndMessage) {
              options.onEndMessage(assistantResponse);
            }
            break;
          }

          if (!ToolHandler.shouldExecuteTools(toolCalls, options.toolExecution)) {
            break;
          }

          for (const toolCall of toolCalls) {
            if (options.toolExecution === ToolExecutionMode.CONFIRM) {
              const approved = await ToolHandler.requestToolConfirmation(
                toolCall,
                options.onConfirmToolCall
              );
              if (!approved) {
                messages.push(
                  provider.formatToolResultMessage(toolCall.id, "Action cancelled by user.")
                );
                continue;
              }
            }

            // 2. onToolCallStart Hook
            await runMiddleware(middlewares, "onToolCallStart", context, toolCall);

            try {
              const toolResult = await ToolHandler.execute(
                toolCall,
                options.tools as unknown as ToolDefinition[],
                options.onToolCallStart,
                options.onToolCallEnd
              );

              // 3. onToolCallEnd Hook
              await runMiddleware(
                middlewares,
                "onToolCallEnd",
                context,
                toolCall,
                toolResult.content
              );

              messages.push(
                provider.formatToolResultMessage(toolResult.tool_call_id, toolResult.content)
              );
            } catch (error: unknown) {
              let currentError = error as Error & { fatal?: boolean; status?: number };

              // 4. onToolCallError Hook
              await runMiddleware(middlewares, "onToolCallError", context, toolCall, currentError);

              const directive = await options.onToolCallError?.(toolCall, currentError);

              if (directive === "STOP") {
                throw error;
              }

              if (directive === "RETRY") {
                try {
                  const toolResult = await ToolHandler.execute(
                    toolCall,
                    options.tools as unknown as ToolDefinition[],
                    options.onToolCallStart,
                    options.onToolCallEnd
                  );
                  await runMiddleware(
                    middlewares,
                    "onToolCallEnd",
                    context,
                    toolCall,
                    toolResult.content
                  );
                  messages.push(
                    provider.formatToolResultMessage(toolResult.tool_call_id, toolResult.content)
                  );
                  continue;
                } catch (retryError) {
                  currentError = retryError as Error & { fatal?: boolean; status?: number };
                  await runMiddleware(
                    middlewares,
                    "onToolCallError",
                    context,
                    toolCall,
                    currentError
                  );
                }
              }

              messages.push(
                provider.formatToolResultMessage(
                  toolCall.id,
                  `Fatal error executing tool '${toolCall.function.name}': ${currentError.message}`,
                  { isError: true }
                )
              );

              if (directive === "CONTINUE") {
                continue;
              }

              const isFatal =
                currentError.fatal === true ||
                currentError.status === 401 ||
                currentError.status === 403;
              if (isFatal) {
                throw currentError;
              }

              logger.error(
                `Tool execution failed for '${toolCall.function.name}':`,
                currentError as Error
              );
            }
          }
          // Loop continues -> streaming next chunk
        }

        // 5. onResponse Hook
        if (assistantResponse) {
          await runMiddleware(middlewares, "onResponse", context, assistantResponse!);
        }
      } catch (err) {
        // 6. onError Hook
        await runMiddleware(middlewares, "onError", context, err);

        if (err instanceof Error && err.name === "AbortError") {
          // Aborted, still maybe want onError? Middleware logic says "onError".
          // But rethrow for sure.
        }
        throw err;
      }
    };

    return new Stream(
      () =>
        sideEffectGenerator(
          this,
          this.provider,
          this.model,
          this.messages,
          this.systemMessages,
          this.options,
          controller,
          content,
          options
        ),
      controller
    );
  }
}

async function runMiddleware(
  middlewares: Middleware[],
  hookName: keyof Middleware,
  context: MiddlewareContext,
  ...args: any[]
) {
  if (!middlewares || middlewares.length === 0) return;

  for (const middleware of middlewares) {
    if (typeof middleware[hookName] === "function") {
      // @ts-ignore
      await middleware[hookName](context, ...args);
    }
  }
}
