import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider } from "../providers/Provider.js";
import { ChatResponseString } from "./ChatResponse.js";

export class Stream {
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
   * Streams the model's response to a user question.
   * @param content The user's question to send to the model.
   * @returns An async generator yielding chunks of the assistant's response as strings.
   */
  async *stream(content: string) {
    this.messages.push({ role: "user", content });

    if (!this.provider.stream) {
      throw new Error("Streaming not supported by provider");
    }

    let full = "";
    let fullReasoning = "";
    let isFirst = true;

    for await (const chunk of this.provider.stream({
      model: this.model,
      messages: this.messages,
      temperature: this.options.temperature,
      max_tokens: this.options.maxTokens,
    })) {
      if (isFirst) {
        if (this.options.onNewMessage) this.options.onNewMessage();
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

    this.messages.push({
      role: "assistant",
      content: full,
      // @ts-ignore
      reasoning: fullReasoning || undefined
    });

    if (this.options.onEndMessage) {
      this.options.onEndMessage(new ChatResponseString(
        full,
        { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
        this.model,
        fullReasoning || undefined
      ));
    }
  }
}
