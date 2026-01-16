export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

export interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
  tools?: {
    functionDeclarations: Array<{
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    }>;
  }[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    topP?: number;
    topK?: number;
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content: GeminiContent;
    finishReason?: string;
    index?: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
}

export interface GeminiModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiListModelsResponse {
  models: GeminiModel[];
  nextPageToken?: string;
}
export interface GeminiImageRequest {
  prompt: string;
  numberOfImages?: number;
  aspectRatio?: string;
  safetySetting?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiImageResponse {
  images: Array<{
    image: {
      mimeType: string;
      data: string; // base64
    };
  }>;
}

export interface GeminiEmbedRequest {
  model: string;
  content: {
    parts: Array<{ text: string }>;
  };
  outputDimensionality?: number;
}

export interface GeminiEmbedResponse {
  embedding: {
    values: number[];
  };
}

export interface GeminiBatchEmbedRequest {
  requests: GeminiEmbedRequest[];
}

export interface GeminiBatchEmbedResponse {
  embeddings: Array<{
    values: number[];
  }>;
}
