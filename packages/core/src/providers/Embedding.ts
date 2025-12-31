export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
  dimensions?: number;
  user?: string;
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

export interface EmbeddingProvider {
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}
