export enum ToolExecutionMode {
  AUTO = "auto",
  CONFIRM = "confirm",
  DRY_RUN = "dry-run"
}

export const DEFAULT_MAX_TOOL_CALLS = 5;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_TOOL_EXECUTION = ToolExecutionMode.AUTO;
export const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_MAX_TOKENS = 4096; // 4K tokens output limit

export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
export const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434/v1";

export const DEFAULT_MODELS = {
  TRANSCRIPTION: "whisper-1",
  MODERATION: "omni-moderation-latest",
  EMBEDDING: "text-embedding-3-small",
  IMAGE: "dall-e-3"
} as const;

export const DEFAULT_BEDROCK_REGION = "us-east-1";
