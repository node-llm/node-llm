import { Message } from "../chat/Message.js";
import { ToolDefinition, ToolCall } from "../chat/Tool.js";
import type { NamedQuestion, JsonValue } from "../judge/Question.js";

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

import { ContentPart } from "../chat/Content.js";

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

export type ToolChoice =
  | "auto"
  | "none"
  | "required"
  | { type: "function"; function: { name: string } }
  | string;

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  parallel_tool_calls?: boolean;
  thinking?: ThinkingConfig;
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
  prediction?: string | ContentPart[];
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
  finish_reason?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  reasoning_tokens?: number;
  image_tokens?: number;
  cached_tokens?: number;
  cache_creation_tokens?: number;
  cost?: number;
  input_cost?: number;
  output_cost?: number;
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
  name?: string;
  [key: string]: unknown;
}

export interface ChatResponse {
  content: string | null;
  thinking?: ThinkingResult;
  /** @deprecated use thinking.text */
  reasoning?: string | null;
  tool_calls?: ToolCall[];
  usage?: Usage;
  finish_reason?: string | null;
  metadata?: Record<string, unknown>;
  attachments?: Attachment[];
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
  supportsPrediction?(modelId: string): boolean;
  supportsToolChoice?(modelId: string): boolean;
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
  images?: string[]; // Source images (for edits or variations)
  mask?: string; // Mask image (for in-painting)
  size?: string;
  quality?: string;
  n?: number;
  headers?: Record<string, string>;
  requestTimeout?: number;
  [key: string]: unknown;
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
  /**
   * Granularity of timestamps in the response.
   * 'word' returns word-level timestamps (useful for subtitle generation).
   * Defaults to 'segment' if not specified.
   */
  timestamp_granularities?: ("word" | "segment")[];
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words?: TranscriptionWord[];
  [key: string]: unknown;
}

export interface TranscriptionResponse {
  text: string;
  model: string;
  duration?: number;
  segments?: TranscriptionSegment[];
  words?: TranscriptionWord[];
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
  judge?(request: JudgmentRequest): Promise<JudgmentResponse>;
  defaultModel(feature?: string): string;
  capabilities?: ProviderCapabilities;
  formatToolResultMessage(
    toolCallId: string,
    content: string,
    options?: { isError?: boolean }
  ): Message;
}

/** Input a judgment is asked about: text, or JSON-compatible structured data. */
export type JudgmentInput = string | JsonValue[] | { [key: string]: JsonValue };

export interface JudgmentRequest {
  model: string;
  input: JudgmentInput;
  /** Validated questions, in declaration order. */
  questions: NamedQuestion[];
  /** Provider-specific fields merged into the request body. */
  providerOptions?: Record<string, unknown>;
  requestTimeout?: number;
}

/** One answer as returned by a provider, before it is wrapped for the caller. */
export type JudgmentAnswerData =
  | { type: "probability"; probability: number }
  | {
      type: "choice";
      choice: string;
      probabilities: Record<string, number>;
      confidence: number;
    }
  | {
      type: "score";
      score: number;
      probabilities: Record<number, number>;
      confidence: number;
    };

export interface JudgmentResponse {
  /** The model that answered, which can be more specific than the one requested. */
  model: string;
  answers: Record<string, JudgmentAnswerData>;
  usage: Usage;
  raw?: unknown;
}
