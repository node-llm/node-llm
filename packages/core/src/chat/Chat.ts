import { FileLoader } from "../utils/FileLoader.js";
import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider } from "../providers/Provider.js";
import { Executor } from "../executor/Executor.js";
import { LLM } from "../llm.js";

export class Chat {
  private messages: Message[] = [];
  private executor: Executor;

  constructor(
    private readonly provider: Provider,
    private readonly model: string,
    private readonly options: ChatOptions = {}
  ) {

    this.executor = new Executor(
      provider,
      LLM.getRetryConfig()
    );

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
  async ask(content: string, options?: { images?: string[]; files?: string[] }): Promise<string> {
    let messageContent: any = content;
    const files = [...(options?.images ?? []), ...(options?.files ?? [])];

    if (files.length > 0) {
      const processedFiles = await Promise.all(files.map(f => FileLoader.load(f)));

      messageContent = [
        { type: "text", text: content },
        ...processedFiles
      ];
    }

    this.messages.push({
      role: "user",
      content: messageContent,
    });

    let response = await this.executor.executeChat({
      model: this.model,
      messages: this.messages,
      tools: this.options.tools,
    });

    this.messages.push({
      role: "assistant",
      content: response.content,
      tool_calls: response.tool_calls,
    });

    while (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const tool = this.options.tools?.find(
          (t) => t.function.name === toolCall.function.name
        );

        if (tool?.handler) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.handler(args);

            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          } catch (error: any) {
            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Error executing tool: ${error.message}`,
            });
          }
        } else {
          this.messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: "Error: Tool not found or no handler provided",
          });
        }
      }

      response = await this.executor.executeChat({
        model: this.model,
        messages: this.messages,
        tools: this.options.tools,
      });

      this.messages.push({
        role: "assistant",
        content: response.content,
        tool_calls: response.tool_calls,
      });
    }

    return response.content ?? "";
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
