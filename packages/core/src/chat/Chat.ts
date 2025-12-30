import { FileLoader } from "../utils/FileLoader.js";
import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, Usage } from "../providers/Provider.js";
import { Executor } from "../executor/Executor.js";
import { LLM } from "../llm.js";
import { Stream } from "./Stream.js";

export interface AskOptions {
  images?: string[];
  files?: string[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Enhanced string that includes token usage metadata.
 * Behaves like a regular string but has .usage and .input_tokens etc.
 */
export class ChatResponseString extends String {
  constructor(
    content: string,
    public readonly usage: Usage,
    public readonly model: string
  ) {
    super(content);
  }

  get input_tokens() { return this.usage.input_tokens; }
  get output_tokens() { return this.usage.output_tokens; }
  get total_tokens() { return this.usage.total_tokens; }
  get cached_tokens() { return this.usage.cached_tokens; }

  get content(): string {
    return this.valueOf();
  }

  get model_id(): string {
    return this.model;
  }

  toString() {
    return this.valueOf();
  }
}

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
   * Aggregate usage across the entire conversation
   */
  get totalUsage(): Usage {
    return this.messages.reduce(
      (acc, msg) => {
        if (msg.usage) {
          acc.input_tokens += msg.usage.input_tokens;
          acc.output_tokens += msg.usage.output_tokens;
          acc.total_tokens += msg.usage.total_tokens;
          acc.cached_tokens = (acc.cached_tokens ?? 0) + (msg.usage.cached_tokens ?? 0);
        }
        return acc;
      },
      { input_tokens: 0, output_tokens: 0, total_tokens: 0, cached_tokens: 0 }
    );
  }

  /**
   * Add a tool to the chat session (fluent API)
   */
  withTool(tool: any): this {
    if (!this.options.tools) {
      this.options.tools = [];
    }
    this.options.tools.push(tool);
    return this;
  }

  /**
   * Ask the model a question
   */
  async ask(content: string, options?: AskOptions): Promise<ChatResponseString> {
    let messageContent: any = content;
    const files = [...(options?.images ?? []), ...(options?.files ?? [])];

    if (files.length > 0) {
      const processedFiles = await Promise.all(files.map(f => FileLoader.load(f)));
      
      const hasBinary = processedFiles.some(p => p.type === "image_url" || p.type === "input_audio" || p.type === "video_url");
      if (hasBinary && this.provider.capabilities && !this.provider.capabilities.supportsVision(this.model)) {
        throw new Error(`Model ${this.model} does not support vision/binary files.`);
      }

      messageContent = [
        { type: "text", text: content },
        ...processedFiles
      ];
    }

    if (this.options.tools && this.options.tools.length > 0) {
      if (this.provider.capabilities && !this.provider.capabilities.supportsTools(this.model)) {
        throw new Error(`Model ${this.model} does not support tool calling.`);
      }
    }

    this.messages.push({
      role: "user",
      content: messageContent,
    });

    const executeOptions = {
      model: this.model,
      messages: this.messages,
      tools: this.options.tools,
      temperature: options?.temperature ?? this.options.temperature,
      max_tokens: options?.maxTokens ?? this.options.maxTokens,
    };

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

    let response = await this.executor.executeChat(executeOptions);
    trackUsage(response.usage);

    this.messages.push({
      role: "assistant",
      content: new ChatResponseString(response.content ?? "", response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, this.model),
      tool_calls: response.tool_calls,
      usage: response.usage,
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
      trackUsage(response.usage);

      this.messages.push({
        role: "assistant",
        content: new ChatResponseString(response.content ?? "", response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, this.model),
        tool_calls: response.tool_calls,
        usage: response.usage,
      });
    }

    return new ChatResponseString(response.content ?? "", totalUsage, this.model);
  }

  /**
   * Streams the model's response to a user question.
   */
  async *stream(content: string) {
    const streamer = new Stream(this.provider, this.model, this.options, this.messages);
    yield* streamer.stream(content);
  }
}

