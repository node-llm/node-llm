import { Message } from "../chat/Message.js";
import { Tool, ToolCall } from "../chat/Tool.js";
import { MessageContent } from "../chat/Content.js";

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools?: Tool[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatChunk {
  content: string;
  done?: boolean;
}

export interface ChatResponse {
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface ProviderCapabilities {
  supportsVision: (model: string) => boolean;
  supportsTools: (model: string) => boolean;
  supportsStructuredOutput: (model: string) => boolean;
  getContextWindow: (model: string) => number | null;
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

export interface Provider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream?(request: ChatRequest): AsyncIterable<ChatChunk>;
  listModels?(): Promise<ModelInfo[]>;
  paint?(request: ImageRequest): Promise<ImageResponse>;
  capabilities?: ProviderCapabilities;
}
