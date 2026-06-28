import {
  TranscriptionResponse,
  TranscriptionSegment,
  TranscriptionWord
} from "../providers/Provider.js";

export class Transcription {
  constructor(private readonly response: TranscriptionResponse) {}

  get text(): string {
    return this.response.text;
  }

  get model(): string {
    return this.response.model;
  }

  get segments(): TranscriptionSegment[] {
    return this.response.segments || [];
  }

  get words(): TranscriptionWord[] {
    return this.response.words || [];
  }

  get duration(): number | undefined {
    return this.response.duration;
  }

  /**
   * Serializable object containing all response metadata.
   * Perfect for database persistence — mirrors ChatResponseString.meta.
   */
  get meta() {
    return {
      text: this.response.text,
      model: this.response.model,
      duration: this.response.duration,
      segments: this.response.segments,
      words: this.response.words
    };
  }

  /**
   * Alias for meta (backwards compatibility).
   */
  get raw() {
    return this.meta;
  }

  toString(): string {
    return this.text;
  }
}
