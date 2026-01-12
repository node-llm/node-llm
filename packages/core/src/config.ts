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

class Configuration implements NodeLLMConfig {
  public openaiApiKey?: string = process.env.OPENAI_API_KEY?.trim();
  public openaiApiBase?: string = process.env.OPENAI_API_BASE?.trim();
  public anthropicApiKey?: string = process.env.ANTHROPIC_API_KEY?.trim();
  public anthropicApiBase?: string = process.env.ANTHROPIC_API_BASE?.trim();
  public geminiApiKey?: string = process.env.GEMINI_API_KEY?.trim();
  public geminiApiBase?: string = process.env.GEMINI_API_BASE?.trim();
  public deepseekApiKey?: string = process.env.DEEPSEEK_API_KEY?.trim();
  public deepseekApiBase?: string = process.env.DEEPSEEK_API_BASE?.trim();
  public ollamaApiBase?: string = process.env.OLLAMA_API_BASE?.trim() || DEFAULT_OLLAMA_BASE_URL;
  public openrouterApiKey?: string = process.env.OPENROUTER_API_KEY?.trim();
  public openrouterApiBase?: string = process.env.OPENROUTER_API_BASE?.trim();
  public debug?: boolean = process.env.NODELLM_DEBUG === "true";
  public maxToolCalls: number = DEFAULT_MAX_TOOL_CALLS;
  public maxRetries: number = DEFAULT_MAX_RETRIES;
  public requestTimeout: number = DEFAULT_REQUEST_TIMEOUT;
  public maxTokens: number = DEFAULT_MAX_TOKENS;
  public toolExecution: ToolExecutionMode = DEFAULT_TOOL_EXECUTION;
}

export const config = new Configuration();
