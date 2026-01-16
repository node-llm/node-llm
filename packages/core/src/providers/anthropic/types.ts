export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<AnthropicContentBlock>;
}

export interface AnthropicContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result" | "document";
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
}

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
