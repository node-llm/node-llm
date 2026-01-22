import { Message } from "../chat/Message.js";
import { ToolDefinition, ToolCall } from "../chat/Tool.js";

export interface ResponseFormat {
  type: "text" | "json_object" | "json_schema";
  json_schema?: {
    name: string;
    description?: string;
    strict?: boolean;
    schema?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ThinkingConfig {
  /**
   * Effort level for thinking-capable models.
   * 'low', 'medium', 'high' map to provider-specific qualitative settings.
   * 'none' disables thinking if the model allows it.
   */
  effort?: "low" | "medium" | "high" | "none";

  /**
   * Maximum budget (in tokens) dedicated to thinking.
   */
  budget?: number;
}

export interface ThinkingResult {
  /**
   * The thinking text (chain of thought).
   */
  text?: string;

  /**
   * Cryptographic signature or provider-specific trace ID.
   */
  signature?: string;

  /**
   * Tokens consumed during thinking.
   */
  tokens?: number;
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
  thinking?: ThinkingConfig;
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
  headers?: Record<string, string>;
  requestTimeout?: number;
  [key: string]: unknown;
}

export interface ChatChunk {
  content: string;
  thinking?: ThinkingResult;
  /** @deprecated use thinking.text */
  reasoning?: string;
  tool_calls?: ToolCall[];
  done?: boolean;
  usage?: Usage;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  reasoning_tokens?: number;
  cached_tokens?: number;
  cache_creation_tokens?: number;
  cost?: number;
  input_cost?: number;
  output_cost?: number;
}

export interface ChatResponse {
  content: string | null;
  thinking?: ThinkingResult;
  /** @deprecated use thinking.text */
  reasoning?: string | null;
  tool_calls?: ToolCall[];
  usage?: Usage;
}

export interface ProviderCapabilities {
  supportsVision(modelId: string): boolean;
  supportsTools(modelId: string): boolean;
  supportsStructuredOutput(modelId: string): boolean;
  supportsEmbeddings(modelId: string): boolean;
  supportsImageGeneration(modelId: string): boolean;
  supportsTranscription(modelId: string): boolean;
  supportsModeration(modelId: string): boolean;
  supportsReasoning(modelId: string): boolean;
  supportsDeveloperRole(modelId: string): boolean;
  getContextWindow(modelId: string): number | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  family: string;
  context_window: number | null;
  max_output_tokens: number | null;
  modalities: { input: string[]; output: string[] };
  capabilities: string[];
  pricing: unknown;
  metadata?: Record<string, unknown>;
}

export interface ImageRequest {
  model?: string;
  prompt: string;
  size?: string;
  quality?: string;
  n?: number;
  requestTimeout?: number;
}

export interface ImageResponse {
  url?: string;
  data?: string; // base64
  mime_type?: string;
  revised_prompt?: string;
}

export interface TranscriptionRequest {
  model?: string;
  file: string;
  prompt?: string;
  language?: string;
  speakerNames?: string[];
  speakerReferences?: string[];
  requestTimeout?: number;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  [key: string]: unknown;
}

export interface TranscriptionResponse {
  text: string;
  model: string;
  duration?: number;
  segments?: TranscriptionSegment[];
}

export interface ModerationRequest {
  input: string | string[];
  model?: string;
  requestTimeout?: number;
}

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

export interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
  dimensions?: number;
  user?: string;
  requestTimeout?: number;
}

export interface EmbeddingVector {
  embedding: number[];
  index: number;
}

export interface EmbeddingResponse {
  vectors: number[][];
  model: string;
  input_tokens: number;
  dimensions: number;
}

export interface Provider {
  id: string; // "openai", "anthropic", "gemini", etc.
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream?(request: ChatRequest): AsyncIterable<ChatChunk>;
  listModels?(): Promise<ModelInfo[]>;
  paint?(request: ImageRequest): Promise<ImageResponse>;
  transcribe?(request: TranscriptionRequest): Promise<TranscriptionResponse>;
  moderate?(request: ModerationRequest): Promise<ModerationResponse>;
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  defaultModel(feature?: string): string;
  capabilities?: ProviderCapabilities;
  formatToolResultMessage(
    toolCallId: string,
    content: string,
    options?: { isError?: boolean }
  ): Message;
}
