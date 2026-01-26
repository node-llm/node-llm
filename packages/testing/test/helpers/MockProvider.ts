import { vi, type Mock } from "vitest";
import {
  BaseProvider,
  ChatRequest,
  ChatResponse,
  ProviderCapabilities,
  EmbeddingResponse,
  ImageResponse,
  TranscriptionResponse,
  ModerationResponse,
  EmbeddingRequest,
  ImageRequest,
  TranscriptionRequest,
  ModerationRequest
} from "@node-llm/core";

export class MockProvider extends BaseProvider {
  get id() {
    return "mock-provider";
  }

  apiBase() {
    return "http://mock";
  }
  headers() {
    return {};
  }
  protected providerName() {
    return "mock-provider";
  }

  defaultModel() {
    return "mock-model";
  }

  capabilities: ProviderCapabilities = {
    supportsVision: () => true,
    supportsTools: () => true,
    supportsStructuredOutput: () => true,
    supportsEmbeddings: () => true,
    supportsImageGeneration: () => true,
    supportsTranscription: () => true,
    supportsModeration: () => true,
    supportsReasoning: () => true,
    supportsDeveloperRole: () => true,
    getContextWindow: () => 128000
  };

  chat: Mock<(req: ChatRequest) => Promise<ChatResponse>> = vi.fn(
    async (req: ChatRequest): Promise<ChatResponse> => {
      const lastMsg = req.messages[req.messages.length - 1];
      let contentStr = "nothing";

      if (lastMsg && lastMsg.content) {
        if (typeof lastMsg.content === "string") {
          contentStr = lastMsg.content;
        } else if (Array.isArray(lastMsg.content)) {
          contentStr = lastMsg.content.map((p) => (p.type === "text" ? p.text : "")).join("");
        } else {
          contentStr = String(lastMsg.content);
        }
      }

      return {
        content: `Response to ${contentStr}`,
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
      };
    }
  );

  embed: Mock<(req: EmbeddingRequest) => Promise<EmbeddingResponse>> = vi.fn();
  paint: Mock<(req: ImageRequest) => Promise<ImageResponse>> = vi.fn();
  transcribe: Mock<(req: TranscriptionRequest) => Promise<TranscriptionResponse>> = vi.fn();
  moderate: Mock<(req: ModerationRequest) => Promise<ModerationResponse>> = vi.fn();
}
