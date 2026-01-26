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
  Message,
  MessageContent
} from "@node-llm/core";

export interface MockResponse {
  content?: string | null;
  tool_calls?: any[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: Error;
  finish_reason?: string | null;
  vectors?: number[][];
  url?: string;
  data?: string;
  text?: string;
  results?: any[];
  revised_prompt?: string;
  id?: string;
}

export interface MockDefinition {
  method: string;
  match: (request: any) => boolean;
  response: MockResponse | ((request: any) => MockResponse);
}

const EXECUTION_METHODS = ["chat", "stream", "paint", "transcribe", "moderate", "embed"];

export class Mocker {
  private mocks: MockDefinition[] = [];
  public strict = false;

  constructor() {
    this.setupInterceptor();
  }

  public chat(query?: string | RegExp): this {
    return this.addMock("chat", (req: ChatRequest) => {
      if (!query) return true;
      const lastMessage = [...req.messages].reverse().find((m) => m.role === "user");
      if (!lastMessage) return false;

      const content = this.getContentString(lastMessage.content);
      if (typeof query === "string") return content === query;
      if (query instanceof RegExp) return typeof content === "string" && query.test(content);
      return false;
    });
  }

  public placeholder(query: string | RegExp): this {
    return this.addMock("chat", (req: ChatRequest) => {
      return req.messages.some((m) => {
        const content = this.getContentString(m.content);
        if (typeof query === "string") return content === query;
        return typeof content === "string" && query.test(content);
      });
    });
  }

  public callsTool(name: string, args: Record<string, any> = {}): this {
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
    return this.addMock("embed", (req: EmbeddingRequest) => {
      if (!input) return true;
      return JSON.stringify(req.input) === JSON.stringify(input);
    });
  }

  public paint(prompt?: string | RegExp): this {
    return this.addMock("paint", (req: ImageRequest) => {
      if (!prompt) return true;
      if (typeof prompt === "string") return req.prompt === prompt;
      return prompt.test(req.prompt);
    });
  }

  public transcribe(file?: string | RegExp): this {
    return this.addMock("transcribe", (req: TranscriptionRequest) => {
      if (!file) return true;
      if (typeof file === "string") return req.file === file;
      return file.test(req.file);
    });
  }

  public moderate(input?: string | string[] | RegExp): this {
    return this.addMock("moderate", (req: ModerationRequest) => {
      if (!input) return true;
      const content = Array.isArray(req.input) ? req.input.join(" ") : req.input;
      if (input instanceof RegExp) return input.test(content);
      return JSON.stringify(req.input) === JSON.stringify(input);
    });
  }

  public respond(response: string | MockResponse | ((req: any) => MockResponse)): this {
    const lastMock = this.mocks[this.mocks.length - 1];
    if (!lastMock) throw new Error("Mocker: No mock definition started.");
    if (typeof response === "string") {
      lastMock.response = { content: response, text: response };
    } else {
      lastMock.response = response;
    }
    return this;
  }

  public clear(): void {
    this.mocks = [];
    providerRegistry.setInterceptor(undefined);
  }

  private addMock(method: string, matcher: (req: any) => boolean): this {
    this.mocks.push({ method, match: matcher, response: { content: "Mock response" } });
    return this;
  }

  private getContentString(content: any): string | null {
    if (content === null || content === undefined) return null;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map((part) => (part.type === "text" ? part.text : "")).join("");
    }
    return content.toString();
  }

  private setupInterceptor(): void {
    providerRegistry.setInterceptor((provider: Provider) => {
      return new Proxy(provider, {
        get: (target, prop, receiver) => {
          const originalValue = Reflect.get(target, prop, receiver);
          const methodName = prop.toString();

          if (methodName === "id") return target.id;

          if (EXECUTION_METHODS.includes(methodName)) {
            return async (request: any) => {
              const matchingMocks = this.mocks.filter(
                (m) => m.method === methodName && m.match(request)
              );
              const mock = matchingMocks[matchingMocks.length - 1];
              if (mock) {
                const res =
                  typeof mock.response === "function" ? mock.response(request) : mock.response;
                if (res.error) throw res.error;
                switch (methodName) {
                  case "chat":
                    return {
                      content:
                        res.content !== undefined && res.content !== null
                          ? String(res.content)
                          : null,
                      tool_calls: (res.tool_calls as any[]) || [],
                      usage: res.usage || { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
                      finish_reason:
                        res.finish_reason || (res.tool_calls?.length ? "tool_calls" : "stop")
                    } as ChatResponse;
                  case "embed":
                    return {
                      vectors: (res.vectors as number[][]) || [[0.1, 0.2, 0.3]],
                      model: request.model || "mock-embed",
                      input_tokens: 10,
                      dimensions: (res.vectors as any)?.[0]?.length || 3
                    } as EmbeddingResponse;
                  case "paint":
                    return {
                      url: res.url || "http://mock.com/image.png",
                      revised_prompt: res.revised_prompt || request.prompt
                    } as ImageResponse;
                  case "transcribe":
                    return {
                      text: res.text || "Mock transcript",
                      model: request.model || "mock-whisper"
                    } as TranscriptionResponse;
                  case "moderate":
                    return {
                      id: res.id || "mod-123",
                      model: request.model || "mock-mod",
                      results: (res.results as any[]) || [
                        { flagged: false, categories: {}, category_scores: {} }
                      ]
                    } as ModerationResponse;
                  default:
                    return res;
                }
              }
              if (this.strict) throw new Error(`Mocker: Unexpected LLM call to '${methodName}'`);
              return originalValue ? originalValue.apply(target, [request]) : undefined;
            };
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
