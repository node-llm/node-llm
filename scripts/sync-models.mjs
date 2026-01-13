import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const MODELS_FILE = path.join(ROOT_DIR, 'packages/core/src/models/models.ts');
const ALIASES_FILE = path.join(ROOT_DIR, 'packages/core/src/aliases.ts');
const API_URL = 'https://models.dev/api.json';

const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'gemini',
  'deepseek',
  'openrouter',
  'ollama'
];

const PROVIDER_MAP = {
  'google': 'gemini',
  'google-vertex': 'gemini',
  'vertexai': 'gemini'
};

// High-quality manual overrides for the most common models
const GOLDEN_ALIASES = {
  "gpt-4o": { "openai": "gpt-4o", "openrouter": "openai/gpt-4o" },
  "gpt-4o-mini": { "openai": "gpt-4o-mini", "openrouter": "openai/gpt-4o-mini" },
  "o1": { "openai": "o1", "openrouter": "openai/o1" },
  "o3-mini": { "openai": "o3-mini", "openrouter": "openai/o3-mini" },
  "claude-3-5-sonnet": { "anthropic": "claude-3-5-sonnet-20241022", "openrouter": "anthropic/claude-3.5-sonnet" },
  "claude-3-7-sonnet": { "anthropic": "claude-3-7-sonnet-20250219", "openrouter": "anthropic/claude-3.7-sonnet" },
  "claude-3-5-haiku": { "anthropic": "claude-3-5-haiku-20241022", "openrouter": "anthropic/claude-3.5-haiku" },
  "deepseek-chat": { "deepseek": "deepseek-chat", "openrouter": "deepseek/deepseek-chat" },
  "deepseek-reasoner": { "deepseek": "deepseek-reasoner", "openrouter": "deepseek/deepseek-reasoner" },
  "gemini-2.0-flash": { "gemini": "gemini-2.0-flash", "openrouter": "google/gemini-2.0-flash-001" },
  "gemini-1.5-pro": { "gemini": "gemini-1.5-pro-latest", "openrouter": "google/gemini-pro-1.5" }
};

async function syncModels() {
  console.log(`Fetching models from ${API_URL}...`);
  
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const rawData = await response.json();
    const finalModels = [];
    const generatedAliases = { ...GOLDEN_ALIASES };

    for (const [providerId, providerData] of Object.entries(rawData)) {
      let targetProvider = PROVIDER_MAP[providerId] || providerId;
      if (!SUPPORTED_PROVIDERS.includes(targetProvider)) continue;

      const models = providerData.models || {};
      for (const [modelId, details] of Object.entries(models)) {
        const caps = [];
        
        if (details.streaming !== false) caps.push('streaming');
        if (details.reasoning || details.id?.includes('reasoner') || details.id?.match(/[or]1|[or]3/)) caps.push('reasoning');
        
        const inputMod = details.modalities?.input || [];
        const outputMod = details.modalities?.output || [];

        if (inputMod.includes('text')) caps.push('chat');
        if (inputMod.includes('image') || details.attachment) caps.push('vision');
        if (inputMod.includes('audio') || details.id?.includes('whisper')) caps.push('transcription');
        if (outputMod.includes('audio')) caps.push('speech_generation');
        if (outputMod.includes('image')) caps.push('image_generation');

        if (details.tool_call) {
          caps.push('function_calling');
          caps.push('tools');
          caps.push('structured_output');
          caps.push('json_mode');
        }

        const modelEntry = {
          id: details.id || modelId,
          name: details.name,
          provider: targetProvider,
          family: details.family,
          created_at: details.release_date ? `${details.release_date} 00:00:00 UTC` : null,
          context_window: details.limit?.context || 0,
          max_output_tokens: details.limit?.output || 0,
          knowledge_cutoff: details.knowledge,
          modalities: details.modalities || { input: ['text'], output: ['text'] },
          capabilities: Array.from(new Set(caps)),
          pricing: {
            text_tokens: {
              standard: {
                input_per_million: details.cost?.input || 0,
                output_per_million: details.cost?.output || 0,
                cached_input_per_million: details.cost?.cache_read,
                reasoning_output_per_million: details.cost?.output
              }
            }
          },
          metadata: { source: 'models.dev', ...(details.cost || {}), ...(details.limit || {}) }
        };

        finalModels.push(modelEntry);

        // Alias Generation: Slugify the name (e.g. "GPT-4o Mini" -> "gpt-4o-mini")
        const slug = details.name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-.]/g, '')
          .replace(/-v[0-9]+$/, '');

        if (slug.length > 3 && !generatedAliases[slug]) {
          generatedAliases[slug] = {};
        }
        if (generatedAliases[slug]) {
          generatedAliases[slug][targetProvider] = modelEntry.id;
        }
      }
    }

    finalModels.sort((a, b) => a.id.localeCompare(b.id));
    fs.writeFileSync(MODELS_FILE, `export const modelsData = ${JSON.stringify(finalModels, null, 2)};\n`);
    console.log(`Synced ${finalModels.length} models.`);

    // Cleanup and save Aliases
    const finalAliases = {};
    Object.keys(generatedAliases).sort().forEach(key => {
      if (Object.keys(generatedAliases[key]).length > 0) {
        finalAliases[key] = generatedAliases[key];
      }
    });

    fs.writeFileSync(ALIASES_FILE, `export default ${JSON.stringify(finalAliases, null, 2)} as const;\n`);
    console.log(`Successfully generated verified aliases to ${ALIASES_FILE}`);

  } catch (error) {
    console.error('Error syncing:', error);
    process.exit(1);
  }
}

syncModels();
