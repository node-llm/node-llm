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

      let full = "";
      let fullReasoning = "";
      let isFirst = true;

      try {
        for await (const chunk of provider.stream({
          model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          signal: abortController.signal,
        })) {
          if (isFirst) {
            if (options.onNewMessage) options.onNewMessage();
            isFirst = false;
          }

          if (chunk.content) {
            full += chunk.content;
          }
          if (chunk.reasoning) {
            fullReasoning += chunk.reasoning;
          }
          yield chunk;
        }

        // Finalize history
        messages.push({
          role: "assistant",
          content: full,
          // @ts-ignore
          reasoning: fullReasoning || undefined
        });

        if (options.onEndMessage) {
          options.onEndMessage(new ChatResponseString(
            full,
            { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
            model,
            fullReasoning || undefined
          ));
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Stream was aborted, we might still want to save what we got?
          // For now just rethrow or handle as needed
        }
        throw error;
      }
    };

    return new Stream(
      () => sideEffectGenerator(this.provider, this.model, this.messages, this.options, controller),
      controller
    );
  }
}
