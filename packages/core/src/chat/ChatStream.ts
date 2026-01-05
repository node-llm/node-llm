import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, ChatChunk } from "../providers/Provider.js";
import { ChatResponseString } from "./ChatResponse.js";
import { Stream } from "../streaming/Stream.js";

/**
 * Internal handler for chat streaming logic.
 * Wraps the provider's stream with side effects like history updates and events.
 */
export class ChatStream {
  private messages: Message[];

  constructor(
    private readonly provider: Provider,
    private readonly model: string,
    private readonly options: ChatOptions = {},
    messages?: Message[]
  ) {
    this.messages = messages ?? [];

    // Only initialize if we're starting a new history
    if (this.messages.length === 0) {
      if (options.systemPrompt) {
        this.messages.push({
          role: "system",
          content: options.systemPrompt,
        });
      }

      if (options.messages) {
        this.messages.push(...options.messages);
      }
    }
  }

  /**
   * Read-only access to message history
   */
  get history(): readonly Message[] {
    return this.messages;
  }

  /**
   * Creates a high-level Stream object for the chat response.
   * @param content The user's question.
   */
  create(content: string): Stream<ChatChunk> {
    const controller = new AbortController();
    
    // We create a wrapper async generator that handles our side effects
    const sideEffectGenerator = async function* (
      provider: Provider,
      model: string,
      messages: Message[],
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

      // Main streaming loop - may iterate multiple times for tool calls
      while (true) {
        fullContent = "";
        fullReasoning = "";
        toolCalls = undefined;

        try {
          for await (const chunk of provider.stream({
            model,
            messages,
            tools: options.tools,
            temperature: options.temperature,
            max_tokens: options.maxTokens,
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

          // Add assistant message to history
          messages.push({
            role: "assistant",
            content: fullContent || null,
            tool_calls: toolCalls,
            reasoning: fullReasoning || undefined
          });

          // If no tool calls, we're done
          if (!toolCalls || toolCalls.length === 0) {
            if (options.onEndMessage) {
              options.onEndMessage(new ChatResponseString(
                fullContent,
                { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
                model,
                fullReasoning || undefined
              ));
            }
            break;
          }

          // Execute tool calls
          for (const toolCall of toolCalls) {
            if (options.onToolCall) options.onToolCall(toolCall);

            const tool = options.tools?.find(
              (t) => t.function.name === toolCall.function.name
            );

            if (tool?.handler) {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                const result = await tool.handler(args);
                if (options.onToolResult) options.onToolResult(result);

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: result,
                });
              } catch (error: any) {
                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Error executing tool: ${error.message}`,
                });
              }
            } else {
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: "Error: Tool not found or no handler provided",
              });
            }
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
      () => sideEffectGenerator(this.provider, this.model, this.messages, this.options, controller),
      controller
    );
  }
}
