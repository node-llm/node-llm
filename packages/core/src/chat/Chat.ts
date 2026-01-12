import { FileLoader } from "../utils/FileLoader.js";
import { Message } from "./Message.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, Usage, ChatChunk } from "../providers/Provider.js";
import { Executor } from "../executor/Executor.js";
import { ChatStream } from "./ChatStream.js";
import { Stream } from "../streaming/Stream.js";
import { Tool, ToolDefinition } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { toJsonSchema } from "../schema/to-json-schema.js";
import { z } from "zod";
import { config } from "../config.js";
import { ToolExecutionMode } from "../constants.js";

export interface AskOptions {
  images?: string[];
  files?: string[];
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  maxToolCalls?: number;
  requestTimeout?: number;
}

import { ChatResponseString } from "./ChatResponse.js";

export class Chat {
  private messages: Message[] = [];
  private systemMessages: Message[] = [];
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
      this.withInstructions(options.systemPrompt);
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

  get modelId(): string {
    return this.model;
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
   * Supports passing Tool classes (which will be instantiated) or instances.
   * Can replace existing tools if options.replace is true.
   * 
   * @example
   * chat.withTools([WeatherTool, new CalculatorTool()], { replace: true });
   */
  withTools(tools: (Tool | { new(): Tool } | any)[], options?: { replace?: boolean }): this {
    if (options?.replace) {
      this.options.tools = [];
    }

    if (!this.options.tools) {
      this.options.tools = [];
    }

    for (const tool of tools) {
      let toolInstance: any;

      // Handle class constructor
      if (typeof tool === "function") {
        try {
          toolInstance = new tool();
        } catch (e) {
          console.error(`[NodeLLM] Failed to instantiate tool class: ${tool.name}`, e);
          continue;
        }
      } else {
        toolInstance = tool;
      }

      // Normalized to standard ToolDefinition interface if it's a Tool class instance
      if (toolInstance && typeof toolInstance.toLLMTool === "function") {
        this.options.tools.push(toolInstance.toLLMTool());
      } else {
        // Fallback for legacy raw tool objects (defined as objects with type: 'function')
        this.options.tools.push(toolInstance);
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
      this.systemMessages = [];
    }
    
    // Always push to isolated storage
    this.systemMessages.push({ role: "system", content: instruction });
    
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
    return this.onToolCallStart(handler);
  }

  onToolResult(handler: (result: any) => void): this {
    return this.onToolCallEnd((_call, result) => handler(result));
  }

  /**
   * Called when a tool call starts.
   */
  onToolCallStart(handler: (toolCall: any) => void): this {
    this.options.onToolCallStart = handler;
    return this;
  }

  /**
   * Called when a tool call ends successfully.
   */
  onToolCallEnd(handler: (toolCall: any, result: any) => void): this {
    this.options.onToolCallEnd = handler;
    return this;
  }

  /**
   * Called when a tool call fails.
   */
  onToolCallError(handler: (toolCall: any, error: Error) => void): this {
    this.options.onToolCallError = handler;
    return this;
  }

  /**
   * Set the tool execution mode.
   * - "auto": (Default) Automatically execute all tool calls.
   * - "confirm": Call onConfirmToolCall before executing each tool.
   * - "dry-run": Propose tool calls but do not execute them.
   */
  withToolExecution(mode: ToolExecutionMode): this {
    this.options.toolExecution = mode;
    return this;
  }

  /**
   * Hook for confirming tool execution in "confirm" mode.
   * Return true to proceed, false to cancel the specific call.
   */
  onConfirmToolCall(handler: (toolCall: any) => Promise<boolean> | boolean): this {
    this.options.onConfirmToolCall = handler;
    return this;
  }

  /**
   * Add a hook to process messages before sending to the LLM.
   * Useful for PII detection, redaction, and input moderation.
   */
  beforeRequest(handler: (messages: Message[]) => Promise<Message[] | void>): this {
    this.options.onBeforeRequest = handler;
    return this;
  }

  /**
   * Add a hook to process the response before returning it.
   * Useful for output redaction, compliance, and post-moderation.
   */
  afterResponse(handler: (response: ChatResponseString) => Promise<ChatResponseString | void>): this {
    this.options.onAfterResponse = handler;
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
      messages: [...this.systemMessages, ...this.messages],
      tools: this.options.tools,
      temperature: options?.temperature ?? this.options.temperature,
      max_tokens: options?.maxTokens ?? this.options.maxTokens ?? config.maxTokens,
      headers: { ...this.options.headers, ...options?.headers },
      response_format: responseFormat, // Pass to provider
      requestTimeout: options?.requestTimeout ?? this.options.requestTimeout ?? config.requestTimeout,
      ...this.options.params,
    };

    // --- Content Policy Hooks (Input) ---
    if (this.options.onBeforeRequest) {
      const messagesToProcess = [...this.systemMessages, ...this.messages];
      const result = await this.options.onBeforeRequest(messagesToProcess);
      if (result) {
        // If the hook returned modified messages, use them for this request
        executeOptions.messages = result;
      }
    }

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

    let assistantMessage = new ChatResponseString(
      response.content ?? "", 
      response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, 
      this.model,
      this.provider.id,
      response.reasoning,
      response.tool_calls
    );

    // --- Content Policy Hooks (Output - Turn 1) ---
    if (this.options.onAfterResponse) {
      const result = await this.options.onAfterResponse(assistantMessage);
      if (result) {
        assistantMessage = result;
      }
    }

    this.messages.push({
      role: "assistant",
      content: assistantMessage || null,
      tool_calls: response.tool_calls,
      usage: response.usage,
    });

    if (this.options.onEndMessage && (!response.tool_calls || response.tool_calls.length === 0)) {
      this.options.onEndMessage(assistantMessage);
    }
    
    const maxToolCalls = options?.maxToolCalls ?? this.options.maxToolCalls ?? 5;
    let stepCount = 0;

    while (response.tool_calls && response.tool_calls.length > 0) {
      // Dry-run mode: stop after proposing tools
      if (!this.shouldExecuteTools(response.tool_calls, this.options.toolExecution)) {
        break;
      }

      stepCount++;
      if (stepCount > maxToolCalls) {
        throw new Error(`[NodeLLM] Maximum tool execution calls (${maxToolCalls}) exceeded.`);
      }

      for (const toolCall of response.tool_calls) {
        // Confirm mode: request approval
        if (this.options.toolExecution === ToolExecutionMode.CONFIRM) {
          const approved = await this.requestToolConfirmation(toolCall, this.options.onConfirmToolCall);
          if (!approved) {
            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Action cancelled by user.",
            });
            continue;
          }
        }

        // Execute the tool
        const toolResult = await this.executeToolCall(
          toolCall,
          this.options.tools,
          this.options.onToolCallStart,
          this.options.onToolCallEnd,
          this.options.onToolCallError
        );
        this.messages.push(toolResult);
      }

      response = await this.executor.executeChat({
        model: this.model,
        messages: [...this.systemMessages, ...this.messages],
        tools: this.options.tools,
        headers: this.options.headers,
        requestTimeout: options?.requestTimeout ?? this.options.requestTimeout ?? config.requestTimeout,
      });
      trackUsage(response.usage);

      assistantMessage = new ChatResponseString(
        response.content ?? "", 
        response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, 
        this.model,
        this.provider.id,
        response.reasoning
      );

      // --- Content Policy Hooks (Output - Tool Turns) ---
      if (this.options.onAfterResponse) {
        const result = await this.options.onAfterResponse(assistantMessage);
        if (result) {
          assistantMessage = result;
        }
      }

      this.messages.push({
        role: "assistant",
        content: assistantMessage || null,
        tool_calls: response.tool_calls,
        usage: response.usage,
      });

      if (this.options.onEndMessage && (!response.tool_calls || response.tool_calls.length === 0)) {
        this.options.onEndMessage(assistantMessage);
      }
    }

    // For the final return, we might want to aggregate reasoning too if it happened in multiple turns? 
    // Usually reasoning only happens once or we just want the last one.
    return new ChatResponseString(
      assistantMessage.toString() || "", 
      totalUsage, 
      this.model, 
      this.provider.id, 
      assistantMessage.reasoning,
      response.tool_calls
    );
  }

  /**
   * Streams the model's response to a user question.
   */
  stream(content: string): Stream<ChatChunk> {
    const streamer = new ChatStream(this.provider, this.model, this.options, this.messages, this.systemMessages);
    return streamer.create(content);
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
