export interface Model {
  id: string;
  name: string;
  provider: ProviderName;
  family?: string | null;
  created_at?: string | null;
  context_window?: number | null;
  max_output_tokens?: number | null;
  knowledge_cutoff?: string | null;
  modalities: {
    input: string[];
    output: string[];
  };
  capabilities: string[];
  pricing?: {
    text_tokens?: {
      standard?: {
        input_per_million?: number;
        cached_input_per_million?: number;
        output_per_million?: number;
        reasoning_output_per_million?: number;
      };
      batch?: {
        input_per_million?: number;
        output_per_million?: number;
      };
    };
    images?: {
      standard?: {
        input?: number;
        output?: number;
      };
      batch?: {
        input?: number;
        output?: number;
      };
    };
    audio_tokens?: {
      standard?: {
        input_per_million?: number;
        output_per_million?: number;
      };
    };
  };
  metadata?: Record<string, any>;
}

export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'openrouter' | 'ollama';

export type ModelCapability = 
  | 'streaming'
  | 'function_calling'
  | 'structured_output'
  | 'predicted_outputs'
  | 'distillation'
  | 'fine_tuning'
  | 'batch'
  | 'realtime'
  | 'image_generation'
  | 'speech_generation'
  | 'transcription'
  | 'translation'
  | 'citations'
  | 'reasoning'
  | 'caching'
  | 'moderation'
  | 'json_mode'
  | 'vision'
  | 'chat'
  | 'tools';

export type ModelModality = 
  | 'text'
  | 'image'
  | 'audio'
  | 'pdf'
  | 'video'
  | 'file'
  | 'embeddings'
  | 'moderation';
 bitumen: 102
 bitumen: 102
 bitumen: 102
