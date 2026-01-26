import {
  Provider,
  providerRegistry,
  ChatResponse,
  EmbeddingResponse,
  ChatRequest,
  EmbeddingRequest,
  ImageRequest,
  TranscriptionRequest,
  ModerationRequest,
  ImageResponse,
  TranscriptionResponse,
  ModerationResponse,
  ChatChunk,
  ToolCall,
  ModerationResult,
  MessageContent
} from "@node-llm/core";

export interface MockResponse {
  content?: string | null;
  tool_calls?: ToolCall[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: Error;
  finish_reason?: string | null;
  chunks?: string[] | ChatChunk[];
  vectors?: number[][];
  url?: string;
  data?: string;
  text?: string;
  results?: ModerationResult[];
  revised_prompt?: string;
  id?: string;
}

export type MockMatcher = (request: unknown) => boolean;

export interface MockDefinition {
  method: string;
  match: MockMatcher;
  response: MockResponse | ((request: unknown) => MockResponse);
}

/**
 * Debug information about defined mocks.
 */
export interface MockerDebugInfo {
  totalMocks: number;
  methods: string[];
}

const EXECUTION_METHODS = ["chat", "stream", "paint", "transcribe", "moderate", "embed"];

export interface MockCall {
  method: string;
  args: unknown[];
  timestamp: number;
}

export class Mocker {
  private mocks: MockDefinition[] = [];
  private _history: MockCall[] = [];
  public strict = false;

  constructor() {
    this.setupInterceptor();
  }

  public get history(): MockCall[] {
    return [...this._history];
  }

  public getCalls(method?: string): MockCall[] {
    if (!method) return this.history;
    return this._history.filter((c) => c.method === method);
  }

  public getLastCall(method?: string): MockCall | undefined {
    const calls = this.getCalls(method);
    return calls[calls.length - 1];
  }

  public resetHistory(): void {
    this._history = [];
  }

  public chat(query?: string | RegExp): this {
    return this.addMock("chat", (req: unknown) => {
      const chatReq = req as ChatRequest;
      if (!query) return true;
      const lastMessage = [...chatReq.messages].reverse().find((m) => m.role === "user");
      if (!lastMessage) return false;

      const content = this.getContentString(lastMessage.content);
      if (typeof query === "string") return content === query;
      if (query instanceof RegExp) return typeof content === "string" && query.test(content);
      return false;
    });
  }

  public stream(chunks: string[] | ChatChunk[]): this {
    const lastMock = this.mocks[this.mocks.length - 1];
    if (!lastMock || (lastMock.method !== "chat" && lastMock.method !== "stream")) {
      throw new Error("Mocker: .stream() must follow a .chat() or .addMock('stream') definition.");
    }
    lastMock.method = "stream";
    lastMock.response = { chunks };
    return this;
  }

  public placeholder(query: string | RegExp): this {
    return this.addMock("chat", (req: unknown) => {
      const chatReq = req as ChatRequest;
      return chatReq.messages.some((m) => {
        const content = this.getContentString(m.content);
        if (typeof query === "string") return content === query;
        return typeof content === "string" && query.test(content);
      });
    });
  }

  public callsTool(name: string, args: Record<string, unknown> = {}): this {
    const lastMock = this.mocks[this.mocks.length - 1];
    if (!lastMock || lastMock.method !== "chat") {
      throw new Error("Mocker: .callsTool() must follow a .chat() definition.");
    }
    lastMock.response = {
      content: null,
      tool_calls: [
        {
          id: `call_${Math.random().toString(36).slice(2, 9)}`,
          type: "function",
          function: { name, arguments: JSON.stringify(args) }
        }
      ],
      finish_reason: "tool_calls"
    };
    return this;
  }

  public embed(input?: string | string[]): this {
    return this.addMock("embed", (req: unknown) => {
      const embReq = req as EmbeddingRequest;
      if (!input) return true;
      return JSON.stringify(embReq.input) === JSON.stringify(input);
    });
  }

  public paint(prompt?: string | RegExp): this {
    return this.addMock("paint", (req: unknown) => {
      const paintReq = req as ImageRequest;
      if (!prompt) return true;
      if (typeof prompt === "string") return paintReq.prompt === prompt;
      return prompt.test(paintReq.prompt);
    });
  }

  public transcribe(file?: string | RegExp): this {
    return this.addMock("transcribe", (req: unknown) => {
      const transReq = req as TranscriptionRequest;
      if (!file) return true;
      if (typeof file === "string") return transReq.file === file;
      return file.test(transReq.file);
    });
  }

  public moderate(input?: string | string[] | RegExp): this {
    return this.addMock("moderate", (req: unknown) => {
      const modReq = req as ModerationRequest;
      if (!input) return true;
      const content = Array.isArray(modReq.input) ? modReq.input.join(" ") : modReq.input;
      if (input instanceof RegExp) return input.test(content);
      return JSON.stringify(modReq.input) === JSON.stringify(input);
    });
  }

  public respond(response: string | MockResponse | ((req: unknown) => MockResponse)): this {
    const lastMock = this.mocks[this.mocks.length - 1];
    if (!lastMock) throw new Error("Mocker: No mock definition started.");
    if (typeof response === "string") {
      lastMock.response = { content: response, text: response };
    } else {
      lastMock.response = response;
    }
    return this;
  }

  /**
   * Returns debug information about defined mocks.
   * Useful for troubleshooting what mocks are defined.
   */
  public getDebugInfo(): MockerDebugInfo {
    const methods = this.mocks.map((m) => m.method);
    return {
      totalMocks: this.mocks.length,
      methods: [...new Set(methods)]
    };
  }

  public clear(): void {
    this.mocks = [];
    this._history = [];
    providerRegistry.setInterceptor(undefined);
  }

  private addMock(method: string, matcher: MockMatcher): this {
    this.mocks.push({ method, match: matcher, response: { content: "Mock response" } });
    return this;
  }

  private getContentString(content: MessageContent | null | undefined | unknown): string | null {
    if (content === null || content === undefined) return null;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map((part) => (part.type === "text" ? part.text : "")).join("");
    }
    return String(content);
  }

  private setupInterceptor(): void {
    providerRegistry.setInterceptor((provider: Provider) => {
      return new Proxy(provider, {
        get: (target, prop) => {
          const originalValue = Reflect.get(target, prop);
          const methodName = prop.toString();

          if (methodName === "id") return target.id;

          if (EXECUTION_METHODS.includes(methodName)) {
            if (methodName === "stream") {
              return async function* (this: Mocker, request: ChatRequest) {
                this._history.push({
                  method: methodName,
                  args: [request],
                  timestamp: Date.now()
                });

                const matchingMocks = this.mocks.filter(
                  (m) => m.method === methodName && m.match(request)
                );
                const mock = matchingMocks[matchingMocks.length - 1];
                if (mock) {
                  const res =
                    typeof mock.response === "function" ? mock.response(request) : mock.response;
                  if (res.error) throw res.error;
                  const chunks = res.chunks || [];
                  for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    yield typeof chunk === "string"
                      ? { content: chunk, done: i === chunks.length - 1 }
                      : chunk;
                  }
                  return;
                }
                if (this.strict) throw new Error("Mocker: Unexpected LLM call to 'stream'");
                const original = originalValue
                  ? (originalValue as any).apply(target, [request])
                  : undefined;
                if (original) yield* original;
              }.bind(this);
            }

            // Promise-based methods
            return (async (request: unknown) => {
              this._history.push({
                method: methodName,
                args: [request],
                timestamp: Date.now()
              });

              const matchingMocks = this.mocks.filter(
                (m) => m.method === methodName && m.match(request)
              );
              const mock = matchingMocks[matchingMocks.length - 1];

              if (mock) {
                const res =
                  typeof mock.response === "function" ? mock.response(request) : mock.response;
                if (res.error) throw res.error;

                switch (methodName) {
                  case "chat": {
                    return {
                      content:
                        res.content !== undefined && res.content !== null
                          ? String(res.content)
                          : null,
                      tool_calls: res.tool_calls || [],
                      usage: res.usage || { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
                      finish_reason:
                        res.finish_reason || (res.tool_calls?.length ? "tool_calls" : "stop")
                    } as ChatResponse;
                  }
                  case "embed": {
                    const embReq = request as EmbeddingRequest;
                    return {
                      vectors: res.vectors || [[0.1, 0.2, 0.3]],
                      model: embReq.model || "mock-embed",
                      input_tokens: 10,
                      dimensions: res.vectors?.[0]?.length || 3
                    } as EmbeddingResponse;
                  }
                  case "paint": {
                    const paintReq = request as ImageRequest;
                    return {
                      url: res.url || "http://mock.com/image.png",
                      revised_prompt: res.revised_prompt || paintReq.prompt
                    } as ImageResponse;
                  }
                  case "transcribe": {
                    const transReq = request as TranscriptionRequest;
                    return {
                      text: res.text || "Mock transcript",
                      model: transReq.model || "mock-whisper"
                    } as TranscriptionResponse;
                  }
                  case "moderate": {
                    const modReq = request as ModerationRequest;
                    return {
                      id: res.id || "mod-123",
                      model: modReq.model || "mock-mod",
                      results: res.results || [
                        { flagged: false, categories: {}, category_scores: {} }
                      ]
                    } as ModerationResponse;
                  }
                  default:
                    return res;
                }
              }

              if (this.strict) throw new Error(`Mocker: Unexpected LLM call to '${methodName}'`);
              return originalValue ? (originalValue as any).apply(target, [request]) : undefined;
            }).bind(this);
          }
          return originalValue;
        }
      });
    });
  }
}

export function mockLLM() {
  return new Mocker();
}
