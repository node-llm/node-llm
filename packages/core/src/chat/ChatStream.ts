import { Message } from "./Message.js";
import { ContentPart, isBinaryContent, formatMultimodalContent } from "./Content.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, ChatChunk, Usage } from "../providers/Provider.js";
import { ChatResponseString } from "./ChatResponse.js";
import { Stream } from "../streaming/Stream.js";
import { config } from "../config.js";
import { ToolExecutionMode } from "../constants.js";
import { AskOptions } from "./Chat.js";
import { FileLoader } from "../utils/FileLoader.js";
import { toJsonSchema } from "../schema/to-json-schema.js";
import { ToolDefinition } from "./Tool.js";
import { ChatValidator } from "./Validation.js";
import { ToolHandler } from "./ToolHandler.js";
import { logger } from "../utils/logger.js";

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
          content: options.systemPrompt,
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
      
      // Process Multimodal Content
      let messageContent: any = content;
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

      if (!provider.stream) {
        throw new Error("Streaming not supported by provider");
      }

      // Process Schema/Structured Output
      let responseFormat: any = options.responseFormat;
      if (!responseFormat && options.schema) {
        ChatValidator.validateStructuredOutput(provider, model, true, options);
        
        const jsonSchema = toJsonSchema(options.schema.definition.schema);
        responseFormat = {
          type: "json_schema",
          json_schema: {
            name: options.schema.definition.name,
            description: options.schema.definition.description,
            strict: options.schema.definition.strict ?? true,
            schema: jsonSchema,
          }
        };
      }

      if (!provider.stream) {
        throw new Error("Streaming not supported by provider");
      }

      let isFirst = true;
      const maxToolCalls = options.maxToolCalls ?? 5;
      let stepCount = 0;

      let totalUsage: Usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
      const trackUsage = (u?: Usage) => {
        if (u) {
          totalUsage.input_tokens += u.input_tokens;
          totalUsage.output_tokens += u.output_tokens;
          totalUsage.total_tokens += u.total_tokens;
          if (u.cached_tokens) {
            totalUsage.cached_tokens = (totalUsage.cached_tokens ?? 0) + u.cached_tokens;
          }
        }
      };

      while (true) {
        stepCount++;
        if (stepCount > maxToolCalls) {
          throw new Error(`[NodeLLM] Maximum tool execution calls (${maxToolCalls}) exceeded during streaming.`);
        }

        let fullContent = "";
        let fullReasoning = "";
        let toolCalls: any[] | undefined;
        let currentTurnUsage: Usage | undefined;

        try {
          let requestMessages = [...systemMessages, ...messages];
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
            signal: abortController.signal,
            ...options.params,
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

            if (chunk.tool_calls) {
              toolCalls = chunk.tool_calls;
            }

            if ((chunk as any).usage) {
              currentTurnUsage = (chunk as any).usage;
              trackUsage(currentTurnUsage);
            }
          }

          let assistantResponse = new ChatResponseString(
            fullContent || "",
            currentTurnUsage || { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
            model,
            provider.id,
            fullReasoning || undefined
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
              const approved = await ToolHandler.requestToolConfirmation(toolCall, options.onConfirmToolCall);
              if (!approved) {
                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: "Action cancelled by user.",
                });
                continue;
              }
            }

            try {
              const toolResult = await ToolHandler.execute(
                toolCall,
                options.tools,
                options.onToolCallStart,
                options.onToolCallEnd
              );
              messages.push(toolResult);
            } catch (error: any) {
              const directive = await options.onToolCallError?.(toolCall, error);

              if (directive === 'STOP') {
                throw error;
              }

              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: `Fatal error executing tool '${toolCall.function.name}': ${error.message}`,
              });

              if (directive === 'CONTINUE') {
                continue;
              }

              const isFatal = error.fatal === true || error.status === 401 || error.status === 403;
              if (isFatal) {
                throw error;
              }

              logger.error(`Tool execution failed for '${toolCall.function.name}':`, error as Error);
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Aborted
          }
          throw error;
        }
      }
    };

    return new Stream(
      () => sideEffectGenerator(this, this.provider, this.model, this.messages, this.systemMessages, this.options, controller, content, options),
      controller
    );
  }
}
