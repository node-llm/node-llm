import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, ChatChunk } from "../providers/Provider.js";
import { ChatResponseString } from "./ChatResponse.js";
import { Stream } from "../streaming/Stream.js";
import { config } from "../config.js";
import { ToolExecutionMode } from "../constants.js";

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

    // Only initialize if we're starting a new history
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

  /**
   * Read-only access to message history
   */
  get history(): readonly Message[] {
    return [...this.systemMessages, ...this.messages];
  }

  /**
   * Creates a high-level Stream object for the chat response.
   * @param content The user's question.
   */
  create(content: string): Stream<ChatChunk> {
    const controller = new AbortController();
    
    // We create a wrapper async generator that handles our side effects
    const sideEffectGenerator = async function* (
      self: ChatStream,
      provider: Provider,
      model: string,
      messages: Message[],
      systemMessages: Message[],
      options: ChatOptions,
      abortController: AbortController
    ) {
      messages.push({ role: "user", content });

      if (!provider.stream) {
        throw new Error("Streaming not supported by provider");
      }

      let fullContent = "";
      let fullReasoning = "";
      let toolCalls: any[] | undefined;
      let isFirst = true;

      const maxToolCalls = options.maxToolCalls ?? 5;
      let stepCount = 0;

      // Main streaming loop - may iterate multiple times for tool calls
      while (true) {
        stepCount++;
        if (stepCount > maxToolCalls) {
          throw new Error(`[NodeLLM] Maximum tool execution calls (${maxToolCalls}) exceeded during streaming.`);
        }

        fullContent = "";
        fullReasoning = "";
        toolCalls = undefined;

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

            // Accumulate tool calls from the final chunk
            if (chunk.tool_calls) {
              toolCalls = chunk.tool_calls;
            }
          }

          // Build the response object for hooks and history
          let assistantResponse = new ChatResponseString(
            fullContent || "",
            { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
            model,
            provider.id,
            fullReasoning || undefined
          );

          // --- Content Policy Hooks (Output) ---
          if (options.onAfterResponse) {
            const result = await options.onAfterResponse(assistantResponse);
            if (result) {
              assistantResponse = result;
            }
          }

          // Add assistant message to history (now potentially redacted)
          messages.push({
            role: "assistant",
            content: assistantResponse || null,
            tool_calls: toolCalls,
            reasoning: fullReasoning || undefined
          });

          // If no tool calls, we're done
          if (!toolCalls || toolCalls.length === 0) {
            if (options.onEndMessage) {
              options.onEndMessage(assistantResponse);
            }
            break;
          }

          // Dry-run mode: stop after proposing tools
          if (!self.shouldExecuteTools(toolCalls, options.toolExecution)) {
            break;
          }

          // Execute tool calls
          for (const toolCall of toolCalls) {
            // Confirm mode: request approval
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

            // Execute the tool
            const toolResult = await self.executeToolCall(
              toolCall,
              options.tools,
              options.onToolCallStart,
              options.onToolCallEnd,
              options.onToolCallError
            );
            messages.push(toolResult);
          }

          // Continue loop to stream the next response after tool execution
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Stream was aborted
          }
          throw error;
        }
      }
    };

    return new Stream(
      () => sideEffectGenerator(this, this.provider, this.model, this.messages, this.systemMessages, this.options, controller),
      controller
    );
  }

  /**
   * Check if tool execution should proceed based on the current mode.
   */
  private shouldExecuteTools(toolCalls: any[] | undefined, mode?: ToolExecutionMode): boolean {
    if (!toolCalls || toolCalls.length === 0) return false;
    if (mode === ToolExecutionMode.DRY_RUN) return false;
    return true;
  }

  /**
   * Request user confirmation for a tool call in "confirm" mode.
   * Returns true if approved, false if rejected.
   */
  private async requestToolConfirmation(
    toolCall: any,
    onConfirm?: (call: any) => Promise<boolean> | boolean
  ): Promise<boolean> {
    if (!onConfirm) return true;
    const confirmed = await onConfirm(toolCall);
    return confirmed !== false;
  }

  /**
   * Execute a single tool call and return the result message.
   */
  private async executeToolCall(
    toolCall: any,
    tools: any[] | undefined,
    onStart?: (call: any) => void,
    onEnd?: (call: any, result: any) => void,
    onError?: (call: any, error: Error) => void
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
        if (onError) onError(toolCall, error);

        return {
          role: "tool",
          tool_call_id: toolCall.id,
          content: `Error executing tool: ${error.message}`,
        };
      }
    } else {
      const error = new Error("Tool not found or no handler provided");
      if (onError) onError(toolCall, error);

      return {
        role: "tool",
        tool_call_id: toolCall.id,
        content: "Error: Tool not found or no handler provided",
      };
    }
  }
}
