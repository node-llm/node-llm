import { FileLoader } from "../utils/FileLoader.js";
import { Message } from "./Message.js";
import { ContentPart, isBinaryContent, formatMultimodalContent } from "./Content.js";
import { ChatOptions } from "./ChatOptions.js";
import { Provider, Usage, ChatChunk } from "../providers/Provider.js";
import { Executor } from "../executor/Executor.js";
import { ChatStream } from "./ChatStream.js";
import { Stream } from "../streaming/Stream.js";
import { Tool, ToolDefinition, ToolResolvable } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { toJsonSchema } from "../schema/to-json-schema.js";
import { z } from "zod";
import { config } from "../config.js";
import { ToolExecutionMode } from "../constants.js";
import { ConfigurationError } from "../errors/index.js";
import { ChatValidator } from "./Validation.js";
import { ToolHandler } from "./ToolHandler.js";
import { logger } from "../utils/logger.js";

export interface AskOptions {
  images?: string[];
  files?: string[];
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  maxToolCalls?: number;
  requestTimeout?: number;
  signal?: AbortSignal;
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

    if (options.tools) {
      const toolList = options.tools;
      this.options.tools = []; // Clear and re-add via normalized method
      this.withTools(toolList);
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
  withTool(tool: ToolResolvable): this {
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
  withTools(tools: ToolResolvable[], options?: { replace?: boolean }): this {
    if (options?.replace) {
      this.options.tools = [];
    }

    if (!this.options.tools) {
      this.options.tools = [];
    }

    for (const tool of tools) {
      const normalized = this.normalizeTool(tool);
      if (normalized) {
        this.options.tools.push(normalized);
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

  onToolCallError(handler: (toolCall: any, error: Error) => 'STOP' | 'CONTINUE' | void | Promise<'STOP' | 'CONTINUE' | void>): this {
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
      const processedFiles = await Promise.all(files.map((f: string) => FileLoader.load(f)));
      const hasBinary = processedFiles.some(isBinaryContent);

      ChatValidator.validateVision(this.provider, this.model, hasBinary, this.options);
      messageContent = formatMultimodalContent(content, processedFiles);
    }

    if (this.options.tools && this.options.tools.length > 0) {
      ChatValidator.validateTools(this.provider, this.model, true, this.options);
    }

    this.messages.push({
      role: "user",
      content: messageContent,
    });
    
    // Process Schema/Structured Output
    let responseFormat: any = this.options.responseFormat;
    
    if (this.options.schema) {
      ChatValidator.validateStructuredOutput(this.provider, this.model, true, this.options);
      
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
      tools: this.options.tools as ToolDefinition[],
      temperature: options?.temperature ?? this.options.temperature,
      max_tokens: options?.maxTokens ?? this.options.maxTokens ?? config.maxTokens,
      headers: { ...this.options.headers, ...options?.headers },
      response_format: responseFormat, // Pass to provider
      requestTimeout: options?.requestTimeout ?? this.options.requestTimeout ?? config.requestTimeout,
      signal: options?.signal,
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
      if (!ToolHandler.shouldExecuteTools(response.tool_calls, this.options.toolExecution)) {
        break;
      }

      stepCount++;
      if (stepCount > maxToolCalls) {
        throw new Error(`[NodeLLM] Maximum tool execution calls (${maxToolCalls}) exceeded.`);
      }

      for (const toolCall of response.tool_calls) {
        // Human-in-the-loop: check for approval
        if (this.options.toolExecution === ToolExecutionMode.CONFIRM) {
          const approved = await ToolHandler.requestToolConfirmation(toolCall, this.options.onConfirmToolCall);
          if (!approved) {
            this.messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Action cancelled by user.",
            });
            continue;
          }
        }

        try {
          const toolResult = await ToolHandler.execute(
            toolCall,
            this.options.tools,
            this.options.onToolCallStart,
            this.options.onToolCallEnd
          );
          this.messages.push(toolResult);
        } catch (error: any) {
          const directive = await this.options.onToolCallError?.(toolCall, error);

          if (directive === 'STOP') {
            throw error;
          }

          this.messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Fatal error executing tool '${toolCall.function.name}': ${error.message}`,
          });

          if (directive === 'CONTINUE') {
            continue;
          }

          // Default short-circuit logic
          const isFatal = error.fatal === true || error.status === 401 || error.status === 403;
          
          if (isFatal) {
            throw error;
          }

          logger.error(`Tool execution failed for '${toolCall.function.name}':`, error as Error);
        }
      }

      response = await this.executor.executeChat({
        model: this.model,
        messages: [...this.systemMessages, ...this.messages],
        tools: this.options.tools as ToolDefinition[],
        temperature: options?.temperature ?? this.options.temperature,
        max_tokens: options?.maxTokens ?? this.options.maxTokens ?? config.maxTokens,
        headers: this.options.headers,
        response_format: responseFormat,
        requestTimeout: options?.requestTimeout ?? this.options.requestTimeout ?? config.requestTimeout,
        signal: options?.signal,
        ...this.options.params,
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
  stream(content: string | ContentPart[], options: AskOptions = {}): Stream<ChatChunk> {
    const streamer = new ChatStream(this.provider, this.model, this.options, this.messages, this.systemMessages);
    return streamer.create(content, options);
  }

  /**
   * Normalizes a ToolResolvable into a ToolDefinition.
   */
  private normalizeTool(tool: ToolResolvable): ToolDefinition | null {
    let toolInstance: any;

    // Handle class constructor
    if (typeof tool === "function") {
      try {
        toolInstance = new (tool as any)();
      } catch (e) {
        logger.error(`Failed to instantiate tool class: ${(tool as any).name}`, e as Error);
        return null;
      }
    } else {
      toolInstance = tool;
    }

    if (!toolInstance) return null;

    // Normalized to standard ToolDefinition interface if it's a Tool class instance
    if (typeof toolInstance.toLLMTool === "function") {
      return toolInstance.toLLMTool();
    }

    if (!toolInstance.function || !toolInstance.function.name) {
      // 1. Validate structure
      throw new ConfigurationError(`[NodeLLM] Tool validation failed: 'function.name' is required for raw tool objects.`);
    }

    if (toolInstance.type !== 'function') {
      // 2. Ensure 'type: function' exists (standardize for providers)
      toolInstance.type = 'function';
    }

    if (typeof toolInstance.handler !== 'function') {
      // 3. Validate handler existence
      throw new ConfigurationError(`[NodeLLM] Tool validation failed: Tool '${toolInstance.function.name}' must have a 'handler' function. (Note: Only Tool subclasses use 'execute()')`);
    }

    return toolInstance as ToolDefinition;
  }
}
