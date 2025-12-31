import { EmbeddingResponse } from "../providers/Embedding.js";

export class Embedding {
  public readonly vectors: number[][];
  public readonly model: string;
  public readonly input_tokens: number;
  public readonly dimensions: number;

  constructor(response: EmbeddingResponse) {
    this.vectors = response.vectors;
    this.model = response.model;
    this.input_tokens = response.input_tokens;
    this.dimensions = response.dimensions;
  }

  /**
   * Get the first vector (useful for single-input embeddings)
   */
  get vector(): number[] {
    return this.vectors[0] || [];
  }

  /**
   * Convert to string representation (shows dimensions and token count)
   */
  toString(): string {
    return `Embedding(model=${this.model}, dimensions=${this.dimensions}, tokens=${this.input_tokens}, count=${this.vectors.length})`;
  }
}
