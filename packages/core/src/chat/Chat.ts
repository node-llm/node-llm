import { FileLoader } from "../utils/FileLoader.js";
import { Message } from "./Message.js";
import {
  ContentPart,
  isBinaryContent,
  formatMultimodalContent,
  MessageContent
} from "./Content.js";
import { ChatOptions } from "./ChatOptions.js";
import {
  Provider,
  Usage,
  ChatChunk,
  ResponseFormat,
  ThinkingConfig,
  ToolChoice
} from "../providers/Provider.js";
import { Executor } from "../executor/Executor.js";
import { ChatStream } from "./ChatStream.js";
import { Stream } from "../streaming/Stream.js";
import { ModelRegistry } from "../models/ModelRegistry.js";
import { ToolDefinition, ToolResolvable } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { toJsonSchema } from "../schema/to-json-schema.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { ToolExecutionMode } from "../constants.js";
import { ConfigurationError } from "../errors/index.js";
import { ChatValidator } from "./Validation.js";
import { ToolHandler } from "./ToolHandler.js";
import { logger } from "../utils/logger.js";
import {
  Middleware,
  MiddlewareContext,
  ToolErrorDirective,
  RequestDirective
} from "../types/Middleware.js";
import { runMiddleware } from "../utils/middleware-runner.js";

export interface AskOptions {
  images?: string[];
  files?: string[];
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  maxToolCalls?: number;
  requestTimeout?: number;
  thinking?: ThinkingConfig;
  prediction?: string | ContentPart[];
  signal?: AbortSignal;
  inputs?: Record<string, any>;
}

import { ChatResponseString } from "./ChatResponse.js";

export class Chat<S = unknown> {
  private messages: Message[] = [];
  private systemMessages: Message[] = [];
  private executor: Executor;
  private middlewares: Middleware[] = [];

  constructor(
    private readonly provider: Provider,
    private model: string,
    private readonly options: ChatOptions = {},
    retryConfig: { attempts: number; delayMs: number } = { attempts: 1, delayMs: 0 }
  ) {
    this.middlewares = options.middlewares || [];
    this.executor = new Executor(provider, retryConfig);

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
          acc.cache_creation_tokens =
            (acc.cache_creation_tokens ?? 0) + (msg.usage.cache_creation_tokens ?? 0);
          acc.cost = (acc.cost ?? 0) + (msg.usage.cost ?? 0);
        }
        return acc;
      },
      {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        cached_tokens: 0,
        cache_creation_tokens: 0,
        cost: 0
      }
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
   * chat.withTools([WeatherTool, new CalculatorTool()], { replace: true, choice: 'required' });
   */
  withTools(
    tools: ToolResolvable[],
    options?: {
      replace?: boolean;
      choice?: ToolChoice;
      calls?: "one" | "many" | number;
    }
  ): this {
    if (options?.replace) {
      this.options.tools = [];
    }

    if (!this.options.tools) {
      this.options.tools = [];
    }

    if (options?.choice) {
      this.options.toolChoice = options.choice;
    }

    if (options?.calls) {
      this.options.toolCalls = options.calls;
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
   * Control whether/how tools are called.
   * - 'auto': (Default) Model decides.
   * - 'none': Model cannot call tools.
   * - 'required': Model must call at least one tool.
   * - string: Force a specific tool by name.
   */
  withToolChoice(choice: ToolChoice): this {
    this.options.toolChoice = choice;
    return this;
  }

  /**
   * Control whether the model may return one or multiple tool calls.
   * - 'many': (Default) Parallel tool calling allowed.
   * - 'one' or 1: Only one tool call allowed in a single response.
   */
  withToolCalls(calls: "one" | "many" | number): this {
    this.options.toolCalls = calls;
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
   * Alias for withInstructions
   */
  system(instruction: string, options?: { replace?: boolean }): this {
    return this.withInstructions(instruction, options);
  }

  /**
   * Add a message manually to the chat history.
   * Useful for rehydrating sessions from a database.
   */
  add(
    role: "user" | "assistant" | "system" | "developer" | "tool",
    content: string | MessageContent
  ): this {
    // Ensure content matches MessageContent type
    const safeContent = content as MessageContent;

    if (role === "system" || role === "developer") {
      this.systemMessages.push({ role, content: safeContent });
    } else {
      this.messages.push({ role, content: safeContent });
    }
    return this;
  }

  /**
   * Add a raw Message object to the chat history.
   */
  addMessage(message: Message): this {
    if (message.role === "system" || message.role === "developer") {
      this.systemMessages.push(message);
    } else {
      this.messages.push(message);
    }
    return this;
  }

  /**
   * Add multiple messages to the chat history.
   */
  addMessages(messages: Message[]): this {
    for (const msg of messages) {
      this.addMessage(msg);
    }
    return this;
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
  withRequestOptions(options: {
    headers?: Record<string, string>;
    responseFormat?: unknown;
  }): this {
    if (options.headers) {
      this.options.headers = { ...this.options.headers, ...options.headers };
    }
    if (options.responseFormat) {
      this.options.responseFormat = options.responseFormat as { type: "json_object" | "text" };
    }
    return this;
  }

  /**
   * Set provider-specific parameters.
   * These will be merged into the final request payload.
   */
  withParams(params: Record<string, unknown>): this {
    this.options.params = { ...this.options.params, ...params };
    return this;
  }

  /**
   * Enforce a specific schema for the output.
   * Can accept a Schema object or a Zod schema/JSON Schema directly.
   */
  withSchema<T>(schema: Schema | z.ZodType<T> | Record<string, unknown> | null): Chat<T> {
    if (schema === null) {
      this.options.schema = undefined;
      return this as unknown as Chat<unknown>;
    }

    if (schema instanceof Schema) {
      this.options.schema = schema;
    } else if (schema instanceof z.ZodType) {
      this.options.schema = Schema.fromZod("output", schema);
    } else {
      this.options.schema = Schema.fromJson("output", schema as Record<string, unknown>);
    }
    return this as unknown as Chat<T>;
  }

  /**
   * Provide a prediction of the expected output to reduce latency.
   * Particularly useful for code-editing agents modifying existing text.
   */
  withPrediction(prediction: string | ContentPart[] | null): this {
    if (prediction === null) {
      delete this.options.prediction;
    } else {
      this.options.prediction = prediction;
    }
    return this;
  }

  /**
   * Enable and configure extended thinking for reasoning models.
   */
  withThinking(config: ThinkingConfig): this {
    this.options.thinking = { ...this.options.thinking, ...config };
    return this;
  }

  /**
   * Shortcut to set thinking effort.
   */
  withEffort(effort: "low" | "medium" | "high" | "none"): this {
    return this.withThinking({ effort });
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

  onToolCall(handler: (toolCall: unknown) => void): this {
    return this.onToolCallStart(handler);
  }

  onToolResult(handler: (result: unknown) => void): this {
    return this.onToolCallEnd((_call, result) => handler(result));
  }

  /**
   * Called when a tool call starts.
   */
  onToolCallStart(handler: (toolCall: unknown) => void): this {
    this.options.onToolCallStart = handler;
    return this;
  }

  /**
   * Called when a tool call ends successfully.
   */
  onToolCallEnd(handler: (toolCall: unknown, result: unknown) => void): this {
    this.options.onToolCallEnd = handler;
    return this;
  }

  onToolCallError(
    handler: (
      toolCall: unknown,
      error: Error
    ) => "STOP" | "CONTINUE" | "RETRY" | void | Promise<"STOP" | "CONTINUE" | "RETRY" | void>
  ): this {
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
  onConfirmToolCall(handler: (toolCall: unknown) => Promise<boolean> | boolean): this {
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
  afterResponse(
    handler: (response: ChatResponseString) => Promise<ChatResponseString | void>
  ): this {
    this.options.onAfterResponse = handler;
    return this;
  }

  /**
   * Ask the model a question
   */
  async ask(content: string | ContentPart[], options?: AskOptions): Promise<ChatResponseString> {
    const requestId = randomUUID();
    const state: Record<string, unknown> = {};

    let messageContent: unknown = content;
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

    if (this.options.toolChoice || this.options.params?.tool_choice) {
      ChatValidator.validateToolChoice(
        this.provider,
        this.model,
        this.options.toolChoice || this.options.params?.tool_choice,
        this.options
      );
    }

    this.messages.push({
      role: "user",
      content: messageContent as MessageContent
    });

    // Process Schema/Structured Output
    let responseFormat: ResponseFormat | undefined = this.options.responseFormat;

    if (this.options.schema) {
      ChatValidator.validateStructuredOutput(this.provider, this.model, true, this.options);

      const jsonSchema = toJsonSchema(this.options.schema.definition.schema);

      responseFormat = {
        type: "json_schema",
        json_schema: {
          name: this.options.schema.definition.name,
          description: this.options.schema.definition.description,
          strict: this.options.schema.definition.strict ?? true,
          schema: jsonSchema
        }
      };
    }

    // Prepare Middleware Context
    const context: MiddlewareContext = {
      requestId,
      provider: this.provider.id,
      model: this.model,
      messages: [...this.systemMessages, ...this.messages],
      options: this.options,
      state
    };

    try {
      // 1. onRequest Hook
      await runMiddleware(this.middlewares, "onRequest", context);

      let assistantMessage: ChatResponseString;
      let finalResponse: ChatResponseString & { data: S };
      let correctionAttempt = 0;
      const totalUsage: Usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

      // Self-Correction Loop
      while (true) {
        // Prepare execution options
        const messagesToUse = context.messages || [];
        const executeOptions = {
          model: this.model,
          messages: messagesToUse,
          tools: this.options.tools as ToolDefinition[],
          temperature: options?.temperature ?? this.options.temperature,
          max_tokens: options?.maxTokens ?? this.options.maxTokens ?? config.maxTokens,
          headers: { ...this.options.headers, ...options?.headers },
          response_format: responseFormat, // Pass to provider
          tool_choice: this.options.toolChoice,
          parallel_tool_calls:
            this.options.toolCalls === "one" || this.options.toolCalls === 1 ? false : undefined,
          requestTimeout:
            options?.requestTimeout ?? this.options.requestTimeout ?? config.requestTimeout,
          thinking: options?.thinking ?? this.options.thinking,
          prediction: options?.prediction ?? this.options.prediction,
          signal: options?.signal,
          ...this.options.params
        };

        // --- Content Policy Hooks (Input) ---
        if (this.options.onBeforeRequest) {
          const result = await this.options.onBeforeRequest(executeOptions.messages);
          if (result) {
            executeOptions.messages = result;
          }
        }

        const trackUsage = (u?: Usage) => {
          if (u) {
            if (u.cost === undefined) {
              const withCost = ModelRegistry.calculateCost(u, this.model, this.provider.id);
              u.cost = (withCost as Usage).cost;
              u.input_cost = (withCost as Usage).input_cost;
              u.output_cost = (withCost as Usage).output_cost;
            }

            totalUsage.input_tokens += u.input_tokens;
            totalUsage.output_tokens += u.output_tokens;
            totalUsage.total_tokens += u.total_tokens;
            if (u.cached_tokens) {
              totalUsage.cached_tokens = (totalUsage.cached_tokens ?? 0) + u.cached_tokens;
            }
            if (u.cost !== undefined) {
              totalUsage.cost = (totalUsage.cost ?? 0) + u.cost;
            }
            if (u.input_cost !== undefined) {
              totalUsage.input_cost = (totalUsage.input_cost ?? 0) + u.input_cost;
            }
            if (u.output_cost !== undefined) {
              totalUsage.output_cost = (totalUsage.output_cost ?? 0) + u.output_cost;
            }
          }
        };

        // Start generation
        if (this.options.onNewMessage) this.options.onNewMessage();
        let response = await this.executor.executeChat(executeOptions);
        trackUsage(response.usage);

        assistantMessage = new ChatResponseString(
          response.content ?? "",
          response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
          this.model,
          this.provider.id,
          response.thinking,
          response.reasoning,
          response.tool_calls,
          response.finish_reason,
          this.options.schema,
          response.metadata,
          response.attachments
        );

        // --- Content Policy Hooks (Output - Turn 1) ---
        if (this.options.onAfterResponse) {
          const result = await this.options.onAfterResponse(assistantMessage);
          if (result) {
            assistantMessage = result;
          }
        }

        // Add to history (temporary, might be rolled back on retry)
        this.messages.push({
          role: "assistant",
          content: assistantMessage?.toString() || null,
          tool_calls: response.tool_calls,
          usage: response.usage
        });

        if (
          this.options.onEndMessage &&
          (!response.tool_calls || response.tool_calls.length === 0)
        ) {
          this.options.onEndMessage(assistantMessage);
        }

        const maxToolCalls = options?.maxToolCalls ?? this.options.maxToolCalls ?? 5;
        let stepCount = 0;
        let haltTriggered = false;

        // Tool Calling Loop
        while (response.tool_calls && response.tool_calls.length > 0 && !haltTriggered) {
          if (!ToolHandler.shouldExecuteTools(response.tool_calls, this.options.toolExecution)) {
            break;
          }

          stepCount++;
          if (stepCount > maxToolCalls) {
            throw new Error(`[NodeLLM] Maximum tool execution calls (${maxToolCalls}) exceeded.`);
          }

          for (const toolCall of response.tool_calls) {
            if (this.options.toolExecution === ToolExecutionMode.CONFIRM) {
              const approved = await ToolHandler.requestToolConfirmation(
                toolCall,
                this.options.onConfirmToolCall
              );
              if (!approved) {
                this.messages.push(
                  this.provider.formatToolResultMessage(toolCall.id, "Action cancelled by user.")
                );
                continue;
              }
            }

            await runMiddleware(this.middlewares, "onToolCallStart", context, toolCall);

            try {
              const toolResult = await ToolHandler.execute(
                toolCall,
                this.options.tools as unknown as ToolDefinition[],
                this.options.onToolCallStart,
                this.options.onToolCallEnd
              );

              await runMiddleware(
                this.middlewares,
                "onToolCallEnd",
                context,
                toolCall,
                toolResult.content
              );

              this.messages.push(
                this.provider.formatToolResultMessage(toolResult.tool_call_id, toolResult.content)
              );

              if (toolResult.halted) {
                haltTriggered = true;
                assistantMessage = new ChatResponseString(
                  toolResult.content,
                  totalUsage,
                  this.model,
                  this.provider.id,
                  undefined,
                  undefined,
                  undefined,
                  "tool_halt"
                );
                if (this.options.onEndMessage) {
                  this.options.onEndMessage(assistantMessage);
                }
                break;
              }
            } catch (error: unknown) {
              let currentError: unknown = error;
              const middlewareDirective = await runMiddleware<ToolErrorDirective>(
                this.middlewares,
                "onToolCallError",
                context,
                toolCall,
                currentError
              );

              const directive =
                middlewareDirective ||
                (await this.options.onToolCallError?.(toolCall, currentError as Error));

              if (directive === "STOP") throw currentError;
              if (directive === "RETRY") {
                try {
                  const toolResult = await ToolHandler.execute(
                    toolCall,
                    this.options.tools as unknown as ToolDefinition[],
                    this.options.onToolCallStart,
                    this.options.onToolCallEnd
                  );
                  await runMiddleware(
                    this.middlewares,
                    "onToolCallEnd",
                    context,
                    toolCall,
                    toolResult.content
                  );
                  this.messages.push(
                    this.provider.formatToolResultMessage(
                      toolResult.tool_call_id,
                      toolResult.content
                    )
                  );
                  continue;
                } catch (retryError) {
                  currentError = retryError;
                  await runMiddleware(
                    this.middlewares,
                    "onToolCallError",
                    context,
                    toolCall,
                    currentError
                  );
                }
              }

              this.messages.push(
                this.provider.formatToolResultMessage(
                  toolCall.id,
                  `Fatal error executing tool '${toolCall.function.name}': ${(currentError as Error).message}`,
                  { isError: true }
                )
              );

              if (directive === "CONTINUE") continue;

              const errorObj = currentError as { fatal?: boolean; status?: number };
              if (errorObj.fatal || errorObj.status === 401 || errorObj.status === 403)
                throw currentError;
              logger.error(`Tool execution failed:`, currentError as Error);
            }
          }

          if (haltTriggered) break;

          response = await this.executor.executeChat({
            model: this.model,
            messages: [...this.systemMessages, ...this.messages],
            tools: this.options.tools as ToolDefinition[],
            temperature: options?.temperature ?? this.options.temperature,
            max_tokens: options?.maxTokens ?? this.options.maxTokens ?? config.maxTokens,
            headers: this.options.headers,
            response_format: responseFormat,
            tool_choice: this.options.toolChoice,
            parallel_tool_calls:
              this.options.toolCalls === "one" || this.options.toolCalls === 1 ? false : undefined,
            requestTimeout:
              options?.requestTimeout ?? this.options.requestTimeout ?? config.requestTimeout,
            prediction: options?.prediction ?? this.options.prediction,
            signal: options?.signal,
            ...this.options.params
          });
          trackUsage(response.usage);

          assistantMessage = new ChatResponseString(
            response.content ?? "",
            response.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
            this.model,
            this.provider.id,
            response.thinking,
            response.reasoning,
            response.tool_calls,
            response.finish_reason,
            this.options.schema,
            response.metadata,
            response.attachments
          );

          if (this.options.onAfterResponse) {
            const result = await this.options.onAfterResponse(assistantMessage);
            if (result) assistantMessage = result;
          }

          this.messages.push({
            role: "assistant",
            content: assistantMessage?.toString() || null,
            tool_calls: response.tool_calls,
            usage: response.usage
          });

          if (
            this.options.onEndMessage &&
            (!response.tool_calls || response.tool_calls.length === 0)
          ) {
            this.options.onEndMessage(assistantMessage);
          }
        }

        finalResponse = new ChatResponseString(
          assistantMessage.toString() || "",
          totalUsage,
          this.model,
          this.provider.id,
          assistantMessage.thinking,
          assistantMessage.reasoning,
          response.tool_calls,
          assistantMessage.finish_reason,
          this.options.schema
        ) as unknown as ChatResponseString & { data: S };

        // 5. onResponse Hook
        const requestDirective = await runMiddleware<RequestDirective>(
          this.middlewares,
          "onResponse",
          context,
          finalResponse
        );

        if (requestDirective && typeof requestDirective === "object") {
          if (requestDirective.action === "RETRY") {
            // Push feedback to history and try again
            this.messages.push({
              role: "user",
              content: requestDirective.message
            });
            correctionAttempt++;
            continue;
          }
          if (requestDirective.action === "REPLACE") {
            return requestDirective.response as ChatResponseString;
          }
        }

        if (requestDirective === "STOP") {
          throw new Error("[NodeLLM] Execution stopped by middleware.");
        }

        return finalResponse;
      }
    } catch (err) {
      // 6. onError Hook
      const errorDirective = await runMiddleware<RequestDirective>(
        this.middlewares,
        "onError",
        context,
        err
      );
      if (
        errorDirective &&
        typeof errorDirective === "object" &&
        errorDirective.action === "RETRY"
      ) {
        // ... handled by retry loop?
        // For now, only onResponse triggers self-correction for simplicity.
      }
      throw err;
    }
  }

  /**
   * Streams the model's response to a user question.
   */
  stream(content: string | ContentPart[], options: AskOptions = {}): Stream<ChatChunk> {
    const streamer = new ChatStream(
      this.provider,
      this.model,
      this.options,
      this.messages,
      this.systemMessages
    );
    return streamer.create(content, options);
  }

  /**
   * Normalizes a ToolResolvable into a ToolDefinition.
   */
  private normalizeTool(tool: ToolResolvable): ToolDefinition | null {
    let toolInstance: unknown;

    // Handle class constructor
    if (typeof tool === "function") {
      try {
        toolInstance = new (tool as new () => unknown)();
      } catch (e: unknown) {
        logger.error(
          `Failed to instantiate tool class: ${(tool as { name?: string }).name}`,
          e as Error
        );
        return null;
      }
    } else {
      toolInstance = tool;
    }

    if (!toolInstance) return null;

    // Normalized to standard ToolDefinition interface if it's a Tool class instance
    if (typeof (toolInstance as { toLLMTool?: unknown }).toLLMTool === "function") {
      return (toolInstance as { toLLMTool: () => ToolDefinition }).toLLMTool();
    }

    const toolObj = toolInstance as {
      function?: { name?: string };
      type?: string;
      handler?: unknown;
    };

    if (!toolObj.function || !toolObj.function.name) {
      // 1. Validate structure
      throw new ConfigurationError(
        `[NodeLLM] Tool validation failed: 'function.name' is required for raw tool objects.`
      );
    }

    if (toolObj.type !== "function") {
      // 2. Ensure 'type: function' exists (standardize for providers)
      (toolObj as { type: string }).type = "function";
    }

    if (typeof toolObj.handler !== "function") {
      // 3. Validate handler existence
      throw new ConfigurationError(
        `[NodeLLM] Tool validation failed: Tool '${toolObj.function.name}' must have a 'handler' function. (Note: Only Tool subclasses use 'execute()')`
      );
    }

    return toolInstance as ToolDefinition;
  }
}
