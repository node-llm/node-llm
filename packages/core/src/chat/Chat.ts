import { FileLoader } from "../utils/FileLoader.js";
import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, Usage, ChatChunk } from "../providers/Provider.js";
import { Executor } from "../executor/Executor.js";
import { ChatStream } from "./ChatStream.js";
import { Stream } from "../streaming/Stream.js";
import { Tool } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { toJsonSchema } from "../schema/to-json-schema.js";
import { z } from "zod";

export interface AskOptions {
  images?: string[];
  files?: string[];
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
}

import { ChatResponseString } from "./ChatResponse.js";

export class Chat {
  private messages: Message[] = [];
  private executor: Executor;

  constructor(
    private readonly provider: Provider,
    private model: string,
    private readonly options: ChatOptions = {},
    retryConfig: { attempts: number; delayMs: number } = { attempts: 1, delayMs: 0 }
  ) {
    this.executor = new Executor(
      provider,
      retryConfig
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
          acc.cache_creation_tokens = (acc.cache_creation_tokens ?? 0) + (msg.usage.cache_creation_tokens ?? 0);
          acc.cost = (acc.cost ?? 0) + (msg.usage.cost ?? 0);
        }
        return acc;
      },
      { input_tokens: 0, output_tokens: 0, total_tokens: 0, cached_tokens: 0, cache_creation_tokens: 0, cost: 0 }
    );
  }

  /**
   * Add a tool to the chat session (fluent API)
   * Supports passing a tool instance or a tool class (which will be instantiated).
   */
  withTool(tool: any): this {
    return this.withTools([tool]);
  }

  /**
   * Add multiple tools to the chat session.
   * Supports passing tool instances or classes (which will be instantiated).
   * Can replace existing tools if options.replace is true.
   * 
   * @example
   * chat.withTools([WeatherTool, new CalculatorTool()], { replace: true });
   */
  withTools(tools: (Tool | any)[], options?: { replace?: boolean }): this {
    if (options?.replace) {
      this.options.tools = [];
    }

    if (!this.options.tools) {
      this.options.tools = [];
    }

    for (const tool of tools) {
      if (typeof tool === "function") {
        try {
          // Attempt to instantiate if it's a class
          this.options.tools.push(new tool());
        } catch (e) {
          // If instantiation fails, it might be a function tool or require args? 
          // For now, assuming classes with no-arg constructors as per convention.
          console.warn("Attempted to instantiate tool class but failed, adding as-is", e);
          this.options.tools.push(tool);
        }
      } else {
        this.options.tools.push(tool);
      }
    }
    return this;
  }

  /**
   * Add instructions (system prompt) to the chat.
   * By default, it appends a new system message.
   * If { replace: true } is passed, it removes all previous system messages first.
   */
  withInstructions(instruction: string, options?: { replace?: boolean }): this {
    if (options?.replace) {
      this.messages = this.messages.filter((m) => m.role !== "system");
    }
    
    // System messages usually go first, but for "appending" behavior 
    // mid-conversation, most providers handle them fine in history.
    // Ideally, if it's "replace", we might want to unshift it to index 0,
    // but simply pushing a new system message works for "updating" context too.
    // For consistency with "replace" meaning "this is THE system prompt":
    if (options?.replace) {
      this.messages.unshift({ role: "system", content: instruction });
    } else {
      this.messages.push({ role: "system", content: instruction });
    }
    
    return this;
  }

  /**
   * Alias for withInstructions
   */
  withSystemPrompt(instruction: string, options?: { replace?: boolean }): this {
    return this.withInstructions(instruction, options);
  }

  /**
   * Set the temperature for the chat session.
   * Controls randomness: 0.0 (deterministic) to 1.0 (creative).
   */
  withTemperature(temp: number): this {
    this.options.temperature = temp;
    return this;
  }

  /**
   * Switch the model used for this chat session.
   */
  withModel(model: string): this {
    this.model = model;
    return this;
  }

  /**
   * Set custom headers for the chat session.
   * Merges with existing headers.
   */
  withRequestOptions(options: { headers?: Record<string, string>; responseFormat?: any }): this {
    if (options.headers) {
      this.options.headers = { ...this.options.headers, ...options.headers };
    }
    if (options.responseFormat) {
      this.options.responseFormat = options.responseFormat;
    }
    return this;
  }

  /**
   * Set provider-specific parameters.
   * These will be merged into the final request payload.
   */
  withParams(params: Record<string, any>): this {
    this.options.params = { ...this.options.params, ...params };
    return this;
  }

  /**
   * Enforce a specific schema for the output.
   * Can accept a Schema object or a Zod schema/JSON Schema directly.
   */
  withSchema(schema: Schema | z.ZodType<any> | Record<string, any> | null): this {
    if (schema === null) {
      this.options.schema = undefined;
      return this;
    }

    if (schema instanceof Schema) {
      this.options.schema = schema;
    } else if (schema instanceof z.ZodType) {
      this.options.schema = Schema.fromZod("output", schema);
    } else {
      this.options.schema = Schema.fromJson("output", schema as Record<string, any>);
    }
    return this;
  }

  // --- Event Handlers ---

  onNewMessage(handler: () => void): this {
    this.options.onNewMessage = handler;
    return this;
  }

  onEndMessage(handler: (message: ChatResponseString) => void): this {
    this.options.onEndMessage = handler;
    return this;
  }

  onToolCall(handler: (toolCall: any) => void): this {
    this.options.onToolCall = handler;
    return this;
  }

  onToolResult(handler: (result: any) => void): this {
    this.options.onToolResult = handler;
    return this;
  }

  /**
   * Ask the model a question
   */
  async ask(content: string | any[], options?: AskOptions): Promise<ChatResponseString> {
    let messageContent: any = content;
    const files = [...(options?.images ?? []), ...(options?.files ?? [])];

    if (files.length > 0) {
      const processedFiles = await Promise.all(files.map(f => FileLoader.load(f)));
      
      const hasBinary = processedFiles.some(p => p.type === "image_url" || p.type === "input_audio" || p.type === "video_url");
      if (hasBinary && !this.options.assumeModelExists && this.provider.capabilities && !this.provider.capabilities.supportsVision(this.model)) {
        throw new Error(`Model ${this.model} does not support vision/binary files.`);
      }
      
      if (hasBinary && this.options.assumeModelExists) {
        console.warn(`[NodeLLM] Skipping vision capability validation for model ${this.model}`);
      }

      // Separate text files from binary files
      const textFiles = processedFiles.filter(p => p.type === "text");
      const binaryFiles = processedFiles.filter(p => p.type !== "text");

      // Concatenate text files into the main content
      let fullText = content;
      if (textFiles.length > 0) {
        fullText += "\n" + textFiles.map(f => f.text).join("\n");
      }

      // If we have binary files, create multimodal content
      if (binaryFiles.length > 0) {
        messageContent = [
          { type: "text", text: fullText },
          ...binaryFiles
        ];
      } else {
        // Only text files, keep as string
        messageContent = fullText;
      }
    }

    if (this.options.tools && this.options.tools.length > 0) {
      if (!this.options.assumeModelExists && this.provider.capabilities && !this.provider.capabilities.supportsTools(this.model)) {
        throw new Error(`Model ${this.model} does not support tool calling.`);
      }
      if (this.options.assumeModelExists) {
        console.warn(`[NodeLLM] Skipping tool capability validation for model ${this.model}`);
      }
    }

    this.messages.push({
      role: "user",
      content: messageContent,
    });
    
    // Process Schema/Structured Output
    let responseFormat: any = this.options.responseFormat;
    
    if (this.options.schema) {
      if (!this.options.assumeModelExists && this.provider.capabilities && !this.provider.capabilities.supportsStructuredOutput(this.model)) {
        throw new Error(`Model ${this.model} does not support structured output.`);
      }
      if (this.options.assumeModelExists) {
        console.warn(`[NodeLLM] Skipping structured output capability validation for model ${this.model}`);
      }
      
      const jsonSchema = toJsonSchema(this.options.schema.definition.schema);
      
      responseFormat = {
        type: "json_schema",
        json_schema: {
          name: this.options.schema.definition.name,
          description: this.options.schema.definition.description,
          strict: this.options.schema.definition.strict ?? true,
          schema: jsonSchema,
        }
      };
    }

    const executeOptions = {
      model: this.model,
      messages: this.messages,
      tools: this.options.tools,
      temperature: options?.temperature ?? this.options.temperature,
      max_tokens: options?.maxTokens ?? this.options.maxTokens,
      headers: { ...this.options.headers, ...options?.headers },
      response_format: responseFormat, // Pass to provider
      ...this.options.params,
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
        if (u.cost !== undefined) {
          totalUsage.cost = (totalUsage.cost ?? 0) + u.cost;
        }
      }
    };

    // First round
    if (this.options.onNewMessage) this.options.onNewMessage();
    let response = await this.executor.executeChat(executeOptions);
    trackUsage(response.usage);

    const firstAssistantMessage = new ChatResponseString(
      response.content ?? "", 
      response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, 
      this.model,
      response.reasoning
    );

    this.messages.push({
      role: "assistant",
      content: firstAssistantMessage,
      tool_calls: response.tool_calls,
      usage: response.usage,
    });

    if (this.options.onEndMessage && (!response.tool_calls || response.tool_calls.length === 0)) {
      this.options.onEndMessage(firstAssistantMessage);
    }

    while (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        if (this.options.onToolCall) this.options.onToolCall(toolCall);

        const tool = this.options.tools?.find(
          (t) => t.function.name === toolCall.function.name
        );

        if (tool?.handler) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.handler(args);
            if (this.options.onToolResult) this.options.onToolResult(result);

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
        headers: this.options.headers,
      });
      trackUsage(response.usage);

      const assistantMessage = new ChatResponseString(
        response.content ?? "", 
        response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, 
        this.model,
        response.reasoning
      );

      this.messages.push({
        role: "assistant",
        content: assistantMessage,
        tool_calls: response.tool_calls,
        usage: response.usage,
      });

      if (this.options.onEndMessage && (!response.tool_calls || response.tool_calls.length === 0)) {
        this.options.onEndMessage(assistantMessage);
      }
    }

    // For the final return, we might want to aggregate reasoning too if it happened in multiple turns? 
    // Usually reasoning only happens once or we just want the last one.
    return new ChatResponseString(response.content ?? "", totalUsage, this.model, response.reasoning);
  }

  /**
   * Streams the model's response to a user question.
   */
  stream(content: string): Stream<ChatChunk> {
    const streamer = new ChatStream(this.provider, this.model, this.options, this.messages);
    return streamer.create(content);
  }
}
