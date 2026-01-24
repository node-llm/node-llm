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
  document?: {
    format: "pdf" | "csv" | "doc" | "docx" | "xls" | "xlsx" | "html" | "txt" | "md";
    name: string;
    source: {
      bytes: string; // base64
    };
  };
  reasoningContent?: {
    text?: string;
    redactedContent?: string;
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
  guardContent?: {
    text: {
      text: string;
    };
  };
  cachePoint?: {
    type: "default";
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

export interface BedrockGuardrailConfig {
  guardrailIdentifier: string;
  guardrailVersion: string;
  trace?: "enabled" | "disabled";
}

export interface BedrockConverseRequest {
  messages: BedrockMessage[];
  system?: BedrockContentBlock[];
  toolConfig?: BedrockToolConfig;
  guardrailConfig?: BedrockGuardrailConfig;
  inferenceConfig?: BedrockInferenceConfig;
  additionalModelRequestFields?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BedrockConverseResponse {
  output: {
    message: BedrockMessage;
  };
  stopReason:
    | "end_turn"
    | "tool_use"
    | "max_tokens"
    | "stop_sequence"
    | "content_filtered"
    | "guardrail_intervening"
    | "guardrail_intervened";
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cacheReadInputTokens?: number;
    cacheWriteInputTokens?: number;
  };
  trace?: {
    guardrail?: {
      modelOutput?: string[];
      inputAssessment?: Record<string, any>;
      outputAssessments?: Record<string, any>;
    };
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
      reasoningContent?: {
        text?: string;
      };
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
      reasoningContent?: {
        text?: string;
      };
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
    trace?: {
      guardrail?: {
        modelOutput?: string[];
        inputAssessment?: Record<string, any>;
        outputAssessments?: Record<string, any>;
      };
    };
  };
}
// ─────────────────────────────────────────────────────────────────────────────
// Discovery / Management Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BedrockModelSummary {
  modelId: string;
  modelArn: string;
  modelName?: string;
  providerName?: string;
  inputModalities?: string[];
  outputModalities?: string[];
  responseStreamingSupported?: boolean;
  inferenceTypesSupported?: Array<"ON_DEMAND" | "PROVISIONED" | "INFERENCE_PROFILE">;
  modelLifecycle?: {
    status: "ACTIVE" | "LEGACY";
  };
}

export interface BedrockListModelsResponse {
  modelSummaries: BedrockModelSummary[];
}
