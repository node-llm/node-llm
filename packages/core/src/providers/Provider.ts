import { Message } from "../chat/Message.js";
import { Tool, ToolCall } from "../chat/Tool.js";
import { MessageContent } from "../chat/Content.js";
import { EmbeddingRequest, EmbeddingResponse } from "./Embedding.js";

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools?: Tool[];
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
  headers?: Record<string, string>;
  [key: string]: any;
}

export interface ChatChunk {
  content: string;
  reasoning?: string;
  done?: boolean;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cached_tokens?: number;
  cache_creation_tokens?: number;
  cost?: number;
  input_cost?: number;
  output_cost?: number;
}

export interface ChatResponse {
  content: string | null;
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
  pricing: any;
  metadata?: Record<string, any>;
}

export interface ImageRequest {
  model?: string;
  prompt: string;
  size?: string;
  quality?: string;
  n?: number;
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
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  [key: string]: any;
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

export interface Provider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream?(request: ChatRequest): AsyncIterable<ChatChunk>;
  listModels?(): Promise<ModelInfo[]>;
  paint?(request: ImageRequest): Promise<ImageResponse>;
  transcribe?(request: TranscriptionRequest): Promise<TranscriptionResponse>;
  moderate?(request: ModerationRequest): Promise<ModerationResponse>;
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  capabilities?: ProviderCapabilities;
}
