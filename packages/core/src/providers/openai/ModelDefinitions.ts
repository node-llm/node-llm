export interface ModelPricing {
  input?: number;
  output?: number;
  price?: number; // for flat pricing like embedding/audio
  cached_input?: number;
  audio_input?: number;
  audio_output?: number;
}

export interface ModelFeatures {
  vision?: boolean;
  tools?: boolean;
  structuredOutput?: boolean;
  jsonMode?: boolean;
}

export type ModelType = "chat" | "embedding" | "audio" | "image" | "moderation";

export interface ModelFamilyDefinition {
  pattern: RegExp;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  pricing: ModelPricing;
  features: ModelFeatures;
  type: ModelType;
}

export const OPENAI_MODELS: Record<string, ModelFamilyDefinition> = {
  gpt5: {
    pattern: /^gpt-5/,
    contextWindow: 128_000,
    maxOutputTokens: 400_000,
    pricing: { input: 1.25, output: 10.0, cached_input: 0.125 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  gpt5_mini: {
    pattern: /^gpt-5-mini/,
    contextWindow: 128_000,
    maxOutputTokens: 400_000,
    pricing: { input: 0.25, output: 2.0, cached_input: 0.025 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  gpt5_nano: {
    pattern: /^gpt-5-nano/,
    contextWindow: 128_000,
    maxOutputTokens: 400_000,
    pricing: { input: 0.05, output: 0.4, cached_input: 0.005 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  gpt41: {
    pattern: /^gpt-4\.1(?!-(?:mini|nano))/,
    contextWindow: 1_047_576,
    maxOutputTokens: 32_768,
    pricing: { input: 2.0, output: 8.0, cached_input: 0.5 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  gpt41_mini: {
    pattern: /^gpt-4\.1-mini/,
    contextWindow: 1_047_576,
    maxOutputTokens: 32_768,
    pricing: { input: 0.4, output: 1.6, cached_input: 0.1 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  gpt41_nano: {
    pattern: /^gpt-4\.1-nano/,
    contextWindow: 1_047_576,
    maxOutputTokens: 32_768,
    pricing: { input: 0.1, output: 0.4 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  chatgpt4o: {
    pattern: /^chatgpt-4o/,
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    pricing: { input: 5.0, output: 15.0 },
    features: { vision: true, tools: false, structuredOutput: true },
    type: "chat"
  },
  gpt4: {
    pattern: /^gpt-4(?:-\d{6})?$/,
    contextWindow: 8_192,
    maxOutputTokens: 8_192,
    pricing: { input: 10.0, output: 30.0 },
    features: { vision: true, tools: true, structuredOutput: false },
    type: "chat"
  },
  gpt4_turbo: {
    pattern: /^gpt-4(?:\.5)?-(?:\d{6}-)?(preview|turbo)/,
    contextWindow: 128_000,
    maxOutputTokens: 4_096,
    pricing: { input: 10.0, output: 30.0 },
    features: { vision: true, tools: true, structuredOutput: false },
    type: "chat"
  },
  gpt45: {
    pattern: /^gpt-4\.5/,  // Assuming pattern based on name, wasn't explicit in MODEL_PATTERNS but listed in type
    contextWindow: 128_000, // Guessing based on gpt-4-turbo
    maxOutputTokens: 4_096,
    pricing: { input: 75.0, output: 150.0 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  gpt35_turbo: {
    pattern: /^gpt-3\.5-turbo/,
    contextWindow: 16_385,
    maxOutputTokens: 4_096,
    pricing: { input: 0.5, output: 1.5 },
    features: { vision: false, tools: false, structuredOutput: false },
    type: "chat"
  },
  gpt4o: {
    pattern: /^gpt-4o(?!-(?:mini|audio|realtime|transcribe|tts|search))/,
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    pricing: { input: 2.5, output: 10.0 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  gpt4o_audio: {
    pattern: /^gpt-4o-(?:audio)/,
    contextWindow: 128_000,
    maxOutputTokens: 16_384, // Assuming same as gpt4o
    pricing: { input: 2.5, output: 10.0, audio_input: 40.0, audio_output: 80.0 },
    features: { vision: false, tools: false, structuredOutput: false }, // Check features
    type: "audio"
  },
  gpt4o_mini: {
    pattern: /^gpt-4o-mini(?!-(?:audio|realtime|transcribe|tts|search))/,
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    pricing: { input: 0.15, output: 0.6 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  o1: {
    pattern: /^o1(?!-(?:mini|pro))/,
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    pricing: { input: 15.0, output: 60.0 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  o1_mini: {
    pattern: /^o1-mini/,
    contextWindow: 128_000,
    maxOutputTokens: 65_536,
    pricing: { input: 1.1, output: 4.4 },
    features: { vision: false, tools: false, structuredOutput: false }, // Check features
    type: "chat"
  },
  o1_pro: {
    pattern: /^o1-pro/,
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    pricing: { input: 150.0, output: 600.0 },
    features: { vision: true, tools: true, structuredOutput: true },
    type: "chat"
  },
  o3_mini: {
    pattern: /^o3-mini/,
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    pricing: { input: 1.1, output: 4.4 },
    features: { vision: false, tools: true, structuredOutput: true },
    type: "chat"
  },
  embedding3_small: {
    pattern: /^text-embedding-3-small/,
    contextWindow: null,
    maxOutputTokens: null,
    pricing: { price: 0.02 },
    features: { vision: false, tools: false, structuredOutput: false },
    type: "embedding"
  },
  embedding3_large: {
    pattern: /^text-embedding-3-large/,
    contextWindow: null,
    maxOutputTokens: null,
    pricing: { price: 0.13 },
    features: { vision: false, tools: false, structuredOutput: false },
    type: "embedding"
  },
  embedding_ada: {
    pattern: /^text-embedding-ada/,
    contextWindow: null,
    maxOutputTokens: null,
    pricing: { price: 0.10 },
    features: { vision: false, tools: false, structuredOutput: false },
    type: "embedding"
  },
  moderation: {
    pattern: /^(?:omni|text)-moderation/,
    contextWindow: null,
    maxOutputTokens: null,
    pricing: { price: 0.0 },
    features: { vision: true, tools: false, structuredOutput: false },
    type: "moderation"
  },
  dall_e: {
    pattern: /^dall-e/,
    contextWindow: null,
    maxOutputTokens: null,
    pricing: {}, // Variable
    features: { vision: false, tools: false, structuredOutput: false },
    type: "image"
  },
  whisper: {
    pattern: /^whisper/,
    contextWindow: null,
    maxOutputTokens: null,
    pricing: { price: 0.006 },
    features: { vision: false, tools: false, structuredOutput: false },
    type: "audio"
  },
  tts1: {
    pattern: /^tts-1(?!-hd)/,
    contextWindow: null,
    maxOutputTokens: null,
    pricing: { price: 15.0 },
    features: { vision: false, tools: false, structuredOutput: false },
    type: "audio"
  },
  // Default fallback
  other: {
    pattern: /.*/,
    contextWindow: 4_096,
    maxOutputTokens: 16_384,
    pricing: { input: 0.5, output: 1.5 },
    features: { vision: false, tools: false, structuredOutput: false },
    type: "chat"
  }
};
