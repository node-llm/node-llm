import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider } from "../providers/Provider.js";

export class Chat {
  private messages: Message[] = [];

  constructor(
    private readonly provider: Provider,
    private readonly model: string,
    options: ChatOptions = {}
  ) {
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

  /**
   * Read-only access to message history
   */
  get history(): readonly Message[] {
    return this.messages;
  }

  /**
   * Ask the model a question
   */
  async ask(content: string): Promise<string> {
    this.messages.push({
      role: "user",
      content,
    });

    const response = await this.provider.chat({
      model: this.model,
      messages: this.messages,
    });

    this.messages.push({
      role: "assistant",
      content: response.content,
    });

    return response.content;
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

    for await (const chunk of this.provider.stream({
      model: this.model,
      messages: this.messages,
    })) {
      if (chunk.content) {
        full += chunk.content;
        yield chunk.content;
      }
    }

    this.messages.push({
      role: "assistant",
      content: full,
    });
  }

}
