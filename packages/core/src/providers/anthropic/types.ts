export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<AnthropicContentBlock>;
}

export interface AnthropicContentBlock {
  type:
    | "text"
    | "image"
    | "tool_use"
    | "tool_result"
    | "document"
    | "thinking"
    | "redacted_thinking";
  text?: string;
  source?: {
    type: "base64";
    media_type: string;
    data: string;
  };
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | Array<AnthropicContentBlock>;
  is_error?: boolean;
  thinking?: string;
  signature?: string;
}

export interface AnthropicMessageRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  system?: string;
  metadata?: Record<string, unknown>;
  stop_sequences?: string[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  tools?: Array<{
    name: string;
    description?: string;
    input_schema?: Record<string, unknown>;
  }>;
  tool_choice?: { type: string; name?: string };
  thinking?: AnthropicThinking;
  output_config?: {
    effort?: string;
    [key: string]: unknown;
  };
}

export type AnthropicThinking =
  | { type: "enabled"; budget_tokens: number; display?: "summarized" | "omitted" }
  | { type: "adaptive"; display?: "summarized" | "omitted" }
  | { type: "disabled" };

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface AnthropicMessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | null;
  stop_sequence: string | null;
  usage: AnthropicUsage;
}

export interface AnthropicErrorResponse {
  type: "error";
  error: {
    type: string;
    message: string;
  };
}
