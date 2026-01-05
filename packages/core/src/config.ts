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
}

class Configuration implements NodeLLMConfig {
  public openaiApiKey?: string = process.env.OPENAI_API_KEY?.trim();
  public openaiApiBase?: string = process.env.OPENAI_API_BASE?.trim();
  public anthropicApiKey?: string = process.env.ANTHROPIC_API_KEY?.trim();
  public anthropicApiBase?: string = process.env.ANTHROPIC_API_BASE?.trim();
  public geminiApiKey?: string = process.env.GEMINI_API_KEY?.trim();
  public geminiApiBase?: string = process.env.GEMINI_API_BASE?.trim();
  public deepseekApiKey?: string = process.env.DEEPSEEK_API_KEY?.trim();
  public deepseekApiBase?: string = process.env.DEEPSEEK_API_BASE?.trim();
  public ollamaApiBase?: string = process.env.OLLAMA_API_BASE?.trim() || "http://localhost:11434/v1";
  public openrouterApiKey?: string = process.env.OPENROUTER_API_KEY?.trim();
  public openrouterApiBase?: string = process.env.OPENROUTER_API_BASE?.trim();
  public debug?: boolean = process.env.NODELLM_DEBUG === "true";
}

export const config = new Configuration();
