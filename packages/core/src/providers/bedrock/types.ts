/**
 * Bedrock Converse API Types
 *
 * These types match the AWS Bedrock Converse API schema.
 * Reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html
 */

// ─────────────────────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BedrockContentBlock {
  text?: string;
  image?: {
    format: "png" | "jpeg" | "gif" | "webp";
    source: {
      bytes: string; // base64
    };
  };
  toolUse?: {
    toolUseId: string;
    name: string;
    input: Record<string, unknown>;
  };
  toolResult?: {
    toolUseId: string;
    content: BedrockContentBlock[];
    status?: "success" | "error";
  };
}

export interface BedrockMessage {
  role: "user" | "assistant";
  content: BedrockContentBlock[];
}

export interface BedrockToolSpec {
  name: string;
  description?: string;
  inputSchema: {
    json: Record<string, unknown>;
  };
}

export interface BedrockToolConfig {
  tools: Array<{ toolSpec: BedrockToolSpec }>;
  toolChoice?: {
    auto?: Record<string, never>;
    any?: Record<string, never>;
    tool?: { name: string };
  };
}

export interface BedrockInferenceConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface BedrockConverseRequest {
  messages: BedrockMessage[];
  system?: BedrockContentBlock[];
  toolConfig?: BedrockToolConfig;
  inferenceConfig?: BedrockInferenceConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BedrockConverseResponse {
  output: {
    message: BedrockMessage;
  };
  stopReason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence" | "content_filtered";
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metrics?: {
    latencyMs: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BedrockStreamEvent {
  messageStart?: {
    role: "assistant";
  };
  contentBlockStart?: {
    contentBlockIndex: number;
    start: {
      text?: string;
      toolUse?: {
        toolUseId: string;
        name: string;
      };
    };
  };
  contentBlockDelta?: {
    contentBlockIndex: number;
    delta: {
      text?: string;
      toolUse?: {
        input: string; // JSON string fragment
      };
    };
  };
  contentBlockStop?: {
    contentBlockIndex: number;
  };
  messageStop?: {
    stopReason: string;
  };
  metadata?: {
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    metrics?: {
      latencyMs: number;
    };
  };
}
