/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ChatRecord {
  id: string;
  model?: string | null;
  provider?: string | null;
  instructions?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatOptions {
  model?: string;
  provider?: string;
  instructions?: string;
  metadata?: Record<string, any>;
  debug?: boolean;
  persistence?: {
    toolCalls?: boolean; // Default: true
    requests?: boolean; // Default: true
  };
}

export interface UserHooks {
  onToolCallStart: ((call: any) => void | Promise<void>)[];
  onToolCallEnd: ((call: any, result: any) => void | Promise<void>)[];
  afterResponse: ((resp: any) => any | Promise<any>)[];
  onNewMessage: (() => void | Promise<void>)[];
  onEndMessage: ((message: any) => void | Promise<void>)[];
  onToolCallError: ((call: any, error: Error) => any | Promise<any>)[];
  onConfirmToolCall: ((call: any) => boolean | Promise<boolean>)[];
  onBeforeRequest: ((messages: any[]) => any | Promise<any>)[];
}

/**
 * BaseChat - A generic base class for ORM chat implementations.
 */
export abstract class BaseChat<
  R extends ChatRecord = ChatRecord,
  O extends ChatOptions = ChatOptions
> {
  public id: string;
  protected localOptions: any = {};
  protected customTools: any[] = [];
  protected userHooks: UserHooks = {
    onToolCallStart: [],
    onToolCallEnd: [],
    afterResponse: [],
    onNewMessage: [],
    onEndMessage: [],
    onToolCallError: [],
    onConfirmToolCall: [],
    onBeforeRequest: []
  };

  constructor(
    public record: R,
    public options: O = {} as O
  ) {
    this.id = record.id;

    // Initialize local options from record/options
    this.localOptions.instructions = options.instructions || record.instructions;
    this.localOptions.model = options.model || record.model;
    this.localOptions.provider = options.provider || record.provider;
  }

  protected log(...args: any[]) {
    if (this.options?.debug) {
      console.log(`[@node-llm/orm]`, ...args);
    }
  }

  // --- Fluent Configuration Methods ---

  withInstructions(instruction: string, options?: { replace?: boolean }): this {
    if (options?.replace) {
      this.localOptions.instructions = instruction;
    } else {
      this.localOptions.instructions = (this.localOptions.instructions || "") + "\n" + instruction;
    }
    return this;
  }

  system(instruction: string, options?: { replace?: boolean }): this {
    return this.withInstructions(instruction, options);
  }

  withTemperature(temp: number): this {
    this.localOptions.temperature = temp;
    return this;
  }

  withModel(model: string): this {
    this.localOptions.model = model;
    return this;
  }

  withProvider(provider: string): this {
    this.localOptions.provider = provider;
    return this;
  }

  withTools(tools: any[]): this {
    this.customTools.push(...tools);
    return this;
  }

  withTool(tool: any): this {
    this.customTools.push(tool);
    return this;
  }

  use(tool: any): this {
    return this.withTool(tool);
  }

  withSchema(schema: any): this {
    this.localOptions.schema = schema;
    return this;
  }

  withParams(params: Record<string, any>): this {
    this.localOptions.params = { ...(this.localOptions.params || {}), ...params };
    return this;
  }

  // --- Hook Registration ---

  onToolCallStart(callback: (call: any) => void | Promise<void>): this {
    this.userHooks.onToolCallStart.push(callback);
    return this;
  }

  onToolCall(callback: (call: any) => void | Promise<void>): this {
    return this.onToolCallStart(callback);
  }

  onToolCallEnd(callback: (call: any, result: any) => void | Promise<void>): this {
    this.userHooks.onToolCallEnd.push(callback);
    return this;
  }

  onToolResult(callback: (result: any) => void | Promise<void>): this {
    return this.onToolCallEnd((_call, result) => callback(result));
  }

  afterResponse(callback: (resp: any) => any | Promise<any>): this {
    this.userHooks.afterResponse.push(callback);
    return this;
  }

  onBeforeRequest(callback: (messages: any[]) => any | Promise<any>): this {
    this.userHooks.onBeforeRequest.push(callback);
    return this;
  }

  onNewMessage(callback: () => void | Promise<void>): this {
    this.userHooks.onNewMessage.push(callback);
    return this;
  }

  onEndMessage(callback: (message: any) => void | Promise<void>): this {
    this.userHooks.onEndMessage.push(callback);
    return this;
  }
}
