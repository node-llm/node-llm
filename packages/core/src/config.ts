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
  debug?: boolean;
  maxToolCalls?: number;
  maxRetries?: number;
  requestTimeout?: number;
  maxTokens?: number;
  toolExecution?: ToolExecutionMode;
  provider?: string;
}

import {
  DEFAULT_MAX_TOOL_CALLS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_REQUEST_TIMEOUT,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TOOL_EXECUTION,
  DEFAULT_OLLAMA_BASE_URL,
  ToolExecutionMode
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
  private _debug?: boolean;
  private _provider?: string;

  public get openaiApiKey(): string | undefined {
    return this._openaiApiKey ?? process.env.OPENAI_API_KEY?.trim();
  }
  public set openaiApiKey(v: string | undefined) {
    this._openaiApiKey = v;
  }

  public get openaiApiBase(): string | undefined {
    return this._openaiApiBase ?? process.env.OPENAI_API_BASE?.trim();
  }
  public set openaiApiBase(v: string | undefined) {
    this._openaiApiBase = v;
  }

  public get anthropicApiKey(): string | undefined {
    return this._anthropicApiKey ?? process.env.ANTHROPIC_API_KEY?.trim();
  }
  public set anthropicApiKey(v: string | undefined) {
    this._anthropicApiKey = v;
  }

  public get anthropicApiBase(): string | undefined {
    return this._anthropicApiBase ?? process.env.ANTHROPIC_API_BASE?.trim();
  }
  public set anthropicApiBase(v: string | undefined) {
    this._anthropicApiBase = v;
  }

  public get geminiApiKey(): string | undefined {
    return this._geminiApiKey ?? process.env.GEMINI_API_KEY?.trim();
  }
  public set geminiApiKey(v: string | undefined) {
    this._geminiApiKey = v;
  }

  public get geminiApiBase(): string | undefined {
    return this._geminiApiBase ?? process.env.GEMINI_API_BASE?.trim();
  }
  public set geminiApiBase(v: string | undefined) {
    this._geminiApiBase = v;
  }

  public get deepseekApiKey(): string | undefined {
    return this._deepseekApiKey ?? process.env.DEEPSEEK_API_KEY?.trim();
  }
  public set deepseekApiKey(v: string | undefined) {
    this._deepseekApiKey = v;
  }

  public get deepseekApiBase(): string | undefined {
    return this._deepseekApiBase ?? process.env.DEEPSEEK_API_BASE?.trim();
  }
  public set deepseekApiBase(v: string | undefined) {
    this._deepseekApiBase = v;
  }

  public get ollamaApiBase(): string | undefined {
    return this._ollamaApiBase ?? process.env.OLLAMA_API_BASE?.trim() ?? DEFAULT_OLLAMA_BASE_URL;
  }
  public set ollamaApiBase(v: string | undefined) {
    this._ollamaApiBase = v;
  }

  public get openrouterApiKey(): string | undefined {
    return this._openrouterApiKey ?? process.env.OPENROUTER_API_KEY?.trim();
  }
  public set openrouterApiKey(v: string | undefined) {
    this._openrouterApiKey = v;
  }

  public get openrouterApiBase(): string | undefined {
    return this._openrouterApiBase ?? process.env.OPENROUTER_API_BASE?.trim();
  }
  public set openrouterApiBase(v: string | undefined) {
    this._openrouterApiBase = v;
  }

  public get debug(): boolean | undefined {
    return this._debug ?? process.env.NODELLM_DEBUG === "true";
  }
  public set debug(v: boolean | undefined) {
    this._debug = v;
  }

  public get provider(): string | undefined {
    return this._provider ?? process.env.NODELLM_PROVIDER?.trim();
  }
  public set provider(v: string | undefined) {
    this._provider = v;
  }

  public maxToolCalls: number = DEFAULT_MAX_TOOL_CALLS;
  public maxRetries: number = DEFAULT_MAX_RETRIES;
  public requestTimeout: number = DEFAULT_REQUEST_TIMEOUT;
  public maxTokens: number = DEFAULT_MAX_TOKENS;
  public toolExecution: ToolExecutionMode = DEFAULT_TOOL_EXECUTION;

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
