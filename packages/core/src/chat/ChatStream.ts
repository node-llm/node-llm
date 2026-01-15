import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, ChatChunk } from "../providers/Provider.js";
import { ChatResponseString } from "./ChatResponse.js";
import { Stream } from "../streaming/Stream.js";
import { config } from "../config.js";
import { ToolExecutionMode } from "../constants.js";
import { ToolError } from "../errors/index.js";

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

  create(content: string): Stream<ChatChunk> {
    const controller = new AbortController();
    
    const sideEffectGenerator = async function* (
      self: ChatStream,
      provider: Provider,
      model: string,
      messages: Message[],
      systemMessages: Message[],
      options: ChatOptions,
      abortController: AbortController,
      content: string
    ) {
      messages.push({ role: "user", content });

      if (!provider.stream) {
        throw new Error("Streaming not supported by provider");
      }

      let isFirst = true;
      const maxToolCalls = options.maxToolCalls ?? 5;
      let stepCount = 0;

      while (true) {
        stepCount++;
        if (stepCount > maxToolCalls) {
          throw new Error(`[NodeLLM] Maximum tool execution calls (${maxToolCalls}) exceeded during streaming.`);
        }

        let fullContent = "";
        let fullReasoning = "";
        let toolCalls: any[] | undefined;

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
            tools: options.tools,
            temperature: options.temperature,
            max_tokens: options.maxTokens ?? config.maxTokens,
            headers: options.headers,
            requestTimeout: options.requestTimeout ?? config.requestTimeout,
            signal: abortController.signal,
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
          }

          let assistantResponse = new ChatResponseString(
            fullContent || "",
            { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
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
            reasoning: fullReasoning || undefined
          });

          if (!toolCalls || toolCalls.length === 0) {
            if (options.onEndMessage) {
              options.onEndMessage(assistantResponse);
            }
            break;
          }

          if (!self.shouldExecuteTools(toolCalls, options.toolExecution)) {
            break;
          }

          for (const toolCall of toolCalls) {
            if (options.toolExecution === ToolExecutionMode.CONFIRM) {
              const approved = await self.requestToolConfirmation(toolCall, options.onConfirmToolCall);
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
              const toolResult = await self.executeToolCall(
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

              console.error(`[NodeLLM] Tool execution failed for '${toolCall.function.name}':`, error);
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
      () => sideEffectGenerator(this, this.provider, this.model, this.messages, this.systemMessages, this.options, controller, content),
      controller
    );
  }

  private shouldExecuteTools(toolCalls: any[] | undefined, mode?: ToolExecutionMode): boolean {
    if (!toolCalls || toolCalls.length === 0) return false;
    if (mode === ToolExecutionMode.DRY_RUN) return false;
    return true;
  }

  private async requestToolConfirmation(
    toolCall: any,
    onConfirm?: (call: any) => Promise<boolean> | boolean
  ): Promise<boolean> {
    if (!onConfirm) return true;
    const confirmed = await onConfirm(toolCall);
    return confirmed !== false;
  }

  private async executeToolCall(
    toolCall: any,
    tools: any[] | undefined,
    onStart?: (call: any) => void,
    onEnd?: (call: any, result: any) => void
  ): Promise<{ role: "tool"; tool_call_id: string; content: string }> {
    if (onStart) onStart(toolCall);

    const tool = tools?.find((t) => t.function.name === toolCall.function.name);

    if (tool?.handler) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await tool.handler(args);
        
        if (onEnd) onEnd(toolCall, result);

        return {
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        };
      } catch (error: any) {
        throw error;
      }
    } else {
      const error = new ToolError("Tool not found or no handler provided", toolCall.function?.name ?? "unknown");
      throw error;
    }
  }
}
