/**
 * Global configuration for LLM providers.
 * Values are initialized from environment variables but can be overridden programmatically.
 */
export interface NodeLLMConfig {
  openaiApiKey?: string;
  openaiApiBase?: string;
  anthropicApiKey?: string;
  anthropicApiBase?: string;
  geminiApiKey?: string;
  geminiApiBase?: string;
  deepseekApiKey?: string;
  deepseekApiBase?: string;
  ollamaApiBase?: string;
  openrouterApiKey?: string;
  openrouterApiBase?: string;
  xaiApiKey?: string;
  xaiApiBase?: string;
  mistralApiKey?: string;
  mistralApiBase?: string;
  /** TypeSafe (System One / Jev) key for judgments. */
  typesafeApiKey?: string;
  /** System One endpoint; point it at any Jev-compatible server. */
  typesafeApiBase?: string;
  // AWS Bedrock
  bedrockApiKey?: string; // Long-term API key (Bearer token)
  bedrockAccessKeyId?: string; // SigV4: AWS Access Key ID
  bedrockSecretAccessKey?: string; // SigV4: AWS Secret Access Key
  bedrockSessionToken?: string; // SigV4: Optional session token
  bedrockRegion?: string; // AWS Region (e.g., "us-east-1")
  bedrockApiBase?: string; // Custom endpoint override (e.g. for a proxy/gateway)
  bedrockGuardrailIdentifier?: string; // AWS Guardrail ID
  bedrockGuardrailVersion?: string; // AWS Guardrail Version
  // General options
  debug?: boolean;
  maxToolCalls?: number;
  maxRetries?: number;
  requestTimeout?: number;
  maxTokens?: number;
  toolExecution?: ToolExecutionModeInput;
  /**
   * When true, independent tool calls returned in the same turn are executed
   * concurrently instead of one at a time. Opt-in, overridable per-chat via
   * `chat.withToolConcurrency()`.
   */
  toolConcurrency?: boolean;
  provider?: string;
  /**
   * When false, keys, base URLs and the provider come only from what is passed in code, never
   * from environment variables such as OPENAI_API_KEY. Apps that call providers for many
   * customers set it, so a missing customer key fails instead of quietly using the machine's own.
   */
  envFallback?: boolean;
}

import {
  DEFAULT_MAX_TOOL_CALLS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_REQUEST_TIMEOUT,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TOOL_EXECUTION,
  DEFAULT_TOOL_CONCURRENCY,
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_ANTHROPIC_BASE_URL,
  DEFAULT_GEMINI_BASE_URL,
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_OPENROUTER_BASE_URL,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_XAI_BASE_URL,
  DEFAULT_MISTRAL_BASE_URL,
  DEFAULT_TYPESAFE_BASE_URL,
  DEFAULT_BEDROCK_REGION,
  ToolExecutionMode,
  ToolExecutionModeInput
} from "./constants.js";

export class Configuration implements NodeLLMConfig {
  private _openaiApiKey?: string;
  private _openaiApiBase?: string;
  private _anthropicApiKey?: string;
  private _anthropicApiBase?: string;
  private _geminiApiKey?: string;
  private _geminiApiBase?: string;
  private _deepseekApiKey?: string;
  private _deepseekApiBase?: string;
  private _ollamaApiBase?: string;
  private _openrouterApiKey?: string;
  private _openrouterApiBase?: string;
  private _xaiApiKey?: string;
  private _xaiApiBase?: string;
  private _mistralApiKey?: string;
  private _mistralApiBase?: string;
  private _typesafeApiKey?: string;
  private _typesafeApiBase?: string;
  private _bedrockApiKey?: string;
  private _bedrockAccessKeyId?: string;
  private _bedrockSecretAccessKey?: string;
  private _bedrockSessionToken?: string;
  private _bedrockRegion?: string;
  private _bedrockApiBase?: string;
  private _bedrockGuardrailIdentifier?: string;
  private _bedrockGuardrailVersion?: string;
  private _debug?: boolean;
  private _provider?: string;
  private _envFallback?: boolean;

  public get openaiApiKey(): string | undefined {
    return this._openaiApiKey ?? this.fromEnv("OPENAI_API_KEY");
  }
  public set openaiApiKey(v: string | undefined) {
    this._openaiApiKey = v;
  }

  public get openaiApiBase(): string | undefined {
    return this._openaiApiBase ?? this.fromEnv("OPENAI_API_BASE") ?? DEFAULT_OPENAI_BASE_URL;
  }
  public set openaiApiBase(v: string | undefined) {
    this._openaiApiBase = v;
  }

  public get anthropicApiKey(): string | undefined {
    return this._anthropicApiKey ?? this.fromEnv("ANTHROPIC_API_KEY");
  }
  public set anthropicApiKey(v: string | undefined) {
    this._anthropicApiKey = v;
  }

  public get anthropicApiBase(): string | undefined {
    return (
      this._anthropicApiBase ?? this.fromEnv("ANTHROPIC_API_BASE") ?? DEFAULT_ANTHROPIC_BASE_URL
    );
  }
  public set anthropicApiBase(v: string | undefined) {
    this._anthropicApiBase = v;
  }

  public get geminiApiKey(): string | undefined {
    return this._geminiApiKey ?? this.fromEnv("GEMINI_API_KEY");
  }
  public set geminiApiKey(v: string | undefined) {
    this._geminiApiKey = v;
  }

  public get geminiApiBase(): string | undefined {
    return this._geminiApiBase ?? this.fromEnv("GEMINI_API_BASE") ?? DEFAULT_GEMINI_BASE_URL;
  }
  public set geminiApiBase(v: string | undefined) {
    this._geminiApiBase = v;
  }

  public get deepseekApiKey(): string | undefined {
    return this._deepseekApiKey ?? this.fromEnv("DEEPSEEK_API_KEY");
  }
  public set deepseekApiKey(v: string | undefined) {
    this._deepseekApiKey = v;
  }

  public get deepseekApiBase(): string | undefined {
    return this._deepseekApiBase ?? this.fromEnv("DEEPSEEK_API_BASE") ?? DEFAULT_DEEPSEEK_BASE_URL;
  }
  public set deepseekApiBase(v: string | undefined) {
    this._deepseekApiBase = v;
  }

  public get ollamaApiBase(): string | undefined {
    return this._ollamaApiBase ?? this.fromEnv("OLLAMA_API_BASE") ?? DEFAULT_OLLAMA_BASE_URL;
  }
  public set ollamaApiBase(v: string | undefined) {
    this._ollamaApiBase = v;
  }

  public get openrouterApiKey(): string | undefined {
    return this._openrouterApiKey ?? this.fromEnv("OPENROUTER_API_KEY");
  }
  public set openrouterApiKey(v: string | undefined) {
    this._openrouterApiKey = v;
  }

  public get openrouterApiBase(): string | undefined {
    return (
      this._openrouterApiBase ?? this.fromEnv("OPENROUTER_API_BASE") ?? DEFAULT_OPENROUTER_BASE_URL
    );
  }
  public set openrouterApiBase(v: string | undefined) {
    this._openrouterApiBase = v;
  }

  public get xaiApiKey(): string | undefined {
    return this._xaiApiKey ?? this.fromEnv("XAI_API_KEY");
  }
  public set xaiApiKey(v: string | undefined) {
    this._xaiApiKey = v;
  }

  public get xaiApiBase(): string | undefined {
    return this._xaiApiBase ?? this.fromEnv("XAI_API_BASE") ?? DEFAULT_XAI_BASE_URL;
  }
  public set xaiApiBase(v: string | undefined) {
    this._xaiApiBase = v;
  }

  public get mistralApiKey(): string | undefined {
    return this._mistralApiKey ?? this.fromEnv("MISTRAL_API_KEY");
  }
  public set mistralApiKey(v: string | undefined) {
    this._mistralApiKey = v;
  }

  public get mistralApiBase(): string | undefined {
    return this._mistralApiBase ?? this.fromEnv("MISTRAL_API_BASE") ?? DEFAULT_MISTRAL_BASE_URL;
  }
  public set mistralApiBase(v: string | undefined) {
    this._mistralApiBase = v;
  }

  public get typesafeApiKey(): string | undefined {
    // TYPESAFE_API_KEY matches the provider's name; JEV_API_KEY is accepted too.
    return this._typesafeApiKey ?? this.fromEnv("TYPESAFE_API_KEY") ?? this.fromEnv("JEV_API_KEY");
  }
  public set typesafeApiKey(v: string | undefined) {
    this._typesafeApiKey = v;
  }

  public get typesafeApiBase(): string | undefined {
    return this._typesafeApiBase ?? this.fromEnv("TYPESAFE_API_BASE") ?? DEFAULT_TYPESAFE_BASE_URL;
  }
  public set typesafeApiBase(v: string | undefined) {
    this._typesafeApiBase = v;
  }

  // AWS Bedrock configuration
  public get bedrockApiKey(): string | undefined {
    return this._bedrockApiKey ?? this.fromEnv("AWS_BEARER_TOKEN_BEDROCK");
  }
  public set bedrockApiKey(v: string | undefined) {
    this._bedrockApiKey = v;
  }

  public get bedrockAccessKeyId(): string | undefined {
    return this._bedrockAccessKeyId ?? this.fromEnv("AWS_ACCESS_KEY_ID");
  }
  public set bedrockAccessKeyId(v: string | undefined) {
    this._bedrockAccessKeyId = v;
  }

  public get bedrockSecretAccessKey(): string | undefined {
    return this._bedrockSecretAccessKey ?? this.fromEnv("AWS_SECRET_ACCESS_KEY");
  }
  public set bedrockSecretAccessKey(v: string | undefined) {
    this._bedrockSecretAccessKey = v;
  }

  public get bedrockSessionToken(): string | undefined {
    return this._bedrockSessionToken ?? this.fromEnv("AWS_SESSION_TOKEN");
  }
  public set bedrockSessionToken(v: string | undefined) {
    this._bedrockSessionToken = v;
  }

  public get bedrockRegion(): string | undefined {
    return this._bedrockRegion ?? this.fromEnv("AWS_REGION") ?? DEFAULT_BEDROCK_REGION;
  }
  public set bedrockRegion(v: string | undefined) {
    this._bedrockRegion = v;
  }

  public get bedrockApiBase(): string | undefined {
    return this._bedrockApiBase ?? this.fromEnv("BEDROCK_API_BASE");
  }
  public set bedrockApiBase(v: string | undefined) {
    this._bedrockApiBase = v;
  }

  public get bedrockGuardrailIdentifier(): string | undefined {
    return this._bedrockGuardrailIdentifier ?? this.fromEnv("AWS_GUARDRAIL_ID");
  }
  public set bedrockGuardrailIdentifier(v: string | undefined) {
    this._bedrockGuardrailIdentifier = v;
  }

  public get bedrockGuardrailVersion(): string | undefined {
    return this._bedrockGuardrailVersion ?? this.fromEnv("AWS_GUARDRAIL_VERSION");
  }
  public set bedrockGuardrailVersion(v: string | undefined) {
    this._bedrockGuardrailVersion = v;
  }

  public get envFallback(): boolean | undefined {
    return this._envFallback;
  }
  public set envFallback(v: boolean | undefined) {
    this._envFallback = v;
  }

  /** An environment variable, unless envFallback is false. */
  private fromEnv(name: string): string | undefined {
    return this._envFallback === false ? undefined : process.env[name]?.trim();
  }

  public get debug(): boolean | undefined {
    return this._debug ?? process.env.NODELLM_DEBUG === "true";
  }
  public set debug(v: boolean | undefined) {
    this._debug = v;
  }

  public get provider(): string | undefined {
    return this._provider ?? this.fromEnv("NODELLM_PROVIDER");
  }
  public set provider(v: string | undefined) {
    this._provider = v;
  }

  public maxToolCalls: number = DEFAULT_MAX_TOOL_CALLS;
  public maxRetries: number = DEFAULT_MAX_RETRIES;
  public requestTimeout: number = DEFAULT_REQUEST_TIMEOUT;
  public maxTokens: number = DEFAULT_MAX_TOKENS;
  public toolExecution: ToolExecutionMode = DEFAULT_TOOL_EXECUTION;
  public toolConcurrency: boolean = DEFAULT_TOOL_CONCURRENCY;

  /**
   * Returns a plain object with all configuration values.
   * This is useful for cloning or serialization.
   * It handles getters (lazy-loaded values) correctly.
   */
  public toPlainObject(): NodeLLMConfig {
    const plain: Record<string, unknown> = { ...(this as unknown as Record<string, unknown>) }; // Capture all enumerable "own" properties (custom keys, overrides)

    // Capture all getters from the class prototype (lazy-loaded values)
    const prototype = Object.getPrototypeOf(this);
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const name of propertyNames) {
      if (name === "constructor") continue;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (descriptor && descriptor.get) {
        // Trigger the getter to snapshot the live value (including env fallbacks)
        plain[name] = Reflect.get(this, name);
      }
    }

    return plain as NodeLLMConfig;
  }
}

export const config = new Configuration();
