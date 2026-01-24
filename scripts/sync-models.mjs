import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const MODELS_FILE = path.join(ROOT_DIR, "packages/core/src/models/models.ts");
const ALIASES_FILE = path.join(ROOT_DIR, "packages/core/src/aliases.ts");
const API_URL = "https://models.dev/api.json";

const SUPPORTED_PROVIDERS = [
  "openai",
  "anthropic",
  "gemini",
  "deepseek",
  "openrouter",
  "ollama",
  "bedrock"
];

const PROVIDER_MAP = {
  google: "gemini",
  "google-vertex": "gemini",
  vertexai: "gemini",
  "amazon-bedrock": "bedrock"
};

// High-quality manual overrides for the most common models
const GOLDEN_ALIASES = {
  "gpt-4o": { openai: "gpt-4o", openrouter: "openai/gpt-4o" },
  "gpt-4o-mini": { openai: "gpt-4o-mini", openrouter: "openai/gpt-4o-mini" },
  o1: { openai: "o1", openrouter: "openai/o1" },
  "o3-mini": { openai: "o3-mini", openrouter: "openai/o3-mini" },
  "claude-3-5-sonnet": {
    anthropic: "claude-3-5-sonnet-20241022",
    openrouter: "anthropic/claude-3.5-sonnet",
    bedrock: "anthropic.claude-3-5-sonnet-20241022-v2:0"
  },
  "claude-3-7-sonnet": {
    anthropic: "claude-3-7-sonnet-20250219",
    openrouter: "anthropic/claude-3.7-sonnet",
    bedrock: "anthropic.claude-3-7-sonnet-20250219-v1:0"
  },
  "claude-3-5-haiku": {
    anthropic: "claude-3-5-haiku-20241022",
    openrouter: "anthropic/claude-3.5-haiku",
    bedrock: "anthropic.claude-3-5-haiku-20241022-v1:0"
  },
  "claude-4-sonnet": { bedrock: "anthropic.claude-sonnet-4-20250514-v1:0" },
  "claude-4-opus": { bedrock: "anthropic.claude-opus-4-20250514-v1:0" },
  "claude-4-1-opus": { bedrock: "anthropic.claude-opus-4-1-20250805-v1:0" },
  "claude-4-5-sonnet": { bedrock: "anthropic.claude-sonnet-4-5-20250929-v1:0" },
  "claude-4-5-haiku": { bedrock: "anthropic.claude-haiku-4-5-20251001-v1:0" },
  "claude-4-5-opus": { bedrock: "anthropic.claude-opus-4-5-20251101-v1:0" },
  "deepseek-chat": {
    deepseek: "deepseek-chat",
    openrouter: "deepseek/deepseek-chat",
    bedrock: "deepseek.v3-v1:0"
  },
  "deepseek-reasoner": {
    deepseek: "deepseek-reasoner",
    openrouter: "deepseek/deepseek-reasoner",
    bedrock: "deepseek.r1-v1:0"
  },
  "gemini-2.0-flash": { gemini: "gemini-2.0-flash", openrouter: "google/gemini-2.0-flash-001" },
  "gemini-1.5-pro": { gemini: "gemini-1.5-pro-latest", openrouter: "google/gemini-pro-1.5" },
  "llama-3-3-70b": {
    bedrock: "meta.llama3-3-70b-instruct-v1:0",
    openrouter: "meta-llama/llama-3.3-70b-instruct"
  },
  "llama-3-1-7b": {
    bedrock: "meta.llama3-1-8b-instruct-v1:0",
    openrouter: "meta-llama/llama-3.1-8b-instruct"
  },
  "llama-3-1-70b": {
    bedrock: "meta.llama3-1-70b-instruct-v1:0",
    openrouter: "meta-llama/llama-3.1-70b-instruct"
  },
  "llama-3-2-1b": {
    bedrock: "meta.llama3-2-1b-instruct-v1:0",
    openrouter: "meta-llama/llama-3.2-1b-instruct"
  },
  "llama-3-2-3b": {
    bedrock: "meta.llama3-2-3b-instruct-v1:0",
    openrouter: "meta-llama/llama-3.2-3b-instruct"
  },
  "llama-3-2-11b": {
    bedrock: "meta.llama3-2-11b-instruct-v1:0",
    openrouter: "meta-llama/llama-3.2-11b-instruct"
  },
  "llama-3-2-90b": {
    bedrock: "meta.llama3-2-90b-instruct-v1:0",
    openrouter: "meta-llama/llama-3.2-90b-instruct"
  },
  "llama-4-maverick": { bedrock: "meta.llama4-maverick-17b-instruct-v1:0" },
  "llama-4-scout": { bedrock: "meta.llama4-scout-17b-instruct-v1:0" },
  "mistral-large": {
    bedrock: "mistral.mistral-large-2402-v1:0",
    openrouter: "mistralai/mistral-large"
  },
  "nova-pro": { bedrock: "amazon.nova-pro-v1:0" },
  "nova-lite": { bedrock: "amazon.nova-lite-v1:0" },
  "nova-micro": { bedrock: "amazon.nova-micro-v1:0" },
  "nova-premier": { bedrock: "amazon.nova-premier-v1:0" },
  "nova-2-lite": { bedrock: "amazon.nova-2-lite-v1:0" }
};

async function syncModels() {
  console.log(`Fetching models from ${API_URL}...`);

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const rawData = await response.json();

    // Read existing models to preserve manual/other source entries
    let existingModels = [];
    if (fs.existsSync(MODELS_FILE)) {
      try {
        const content = fs.readFileSync(MODELS_FILE, "utf-8");
        const jsonMatch = content.match(/modelsData = (\[[\s\S]*\]);/);
        if (jsonMatch) {
          existingModels = JSON.parse(jsonMatch[1]);
        }
      } catch {
        console.warn("Could not parse existing models file, starting fresh.");
      }
    }

    const finalModels = [];
    // Preserve any models that didn't come from models.dev
    for (const model of existingModels) {
      if (model.metadata?.source !== "models.dev") {
        finalModels.push(model);
      }
    }

    const generatedAliases = { ...GOLDEN_ALIASES };

    for (const [providerId, providerData] of Object.entries(rawData)) {
      let targetProvider = PROVIDER_MAP[providerId] || providerId;
      if (!SUPPORTED_PROVIDERS.includes(targetProvider)) continue;

      const models = providerData.models || {};
      for (const [modelId, details] of Object.entries(models)) {
        const caps = [];

        if (details.streaming !== false) caps.push("streaming");
        if (
          details.reasoning ||
          details.id?.includes("reasoner") ||
          details.id?.match(/[or]1|[or]3/)
        )
          caps.push("reasoning");

        const inputMod = details.modalities?.input || [];
        const outputMod = details.modalities?.output || [];

        if (inputMod.includes("text")) caps.push("chat");
        if (inputMod.includes("image") || details.attachment) caps.push("vision");
        if (inputMod.includes("audio") || details.id?.includes("whisper"))
          caps.push("transcription");
        if (outputMod.includes("audio")) caps.push("speech_generation");
        if (outputMod.includes("image")) caps.push("image_generation");

        if (details.tool_call) {
          caps.push("function_calling");
          caps.push("tools");
        }
        if (details.json_mode || details.structured_output || details.tool_call) {
          caps.push("structured_output");
          caps.push("json_mode");
        }

        // Special overrides for DeepSeek Reasoner (R1)
        if (modelId === "deepseek-reasoner") {
          // R1 does not support tools/function calling on official API
          const remove = ["function_calling", "tools", "vision"];
          remove.forEach((cap) => {
            const idx = caps.indexOf(cap);
            if (idx > -1) caps.splice(idx, 1);
          });

          // Ensure reasoning and structured_output are present
          if (!caps.includes("reasoning")) caps.push("reasoning");
          if (!caps.includes("structured_output")) caps.push("structured_output");
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
          modalities: details.modalities || { input: ["text"], output: ["text"] },
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
          metadata: {
            source: "models.dev",
            cost: details.cost || {},
            limit: details.limit || {},
            last_synced: new Date().toISOString()
          }
        };

        finalModels.push(modelEntry);

        // Alias Generation: Slugify the name (e.g. "GPT-4o Mini" -> "gpt-4o-mini")
        const slug = details.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-.]/g, "")
          .replace(/-v[0-9]+$/, "");

        if (slug.length > 3 && !generatedAliases[slug]) {
          generatedAliases[slug] = {};
        }
        if (generatedAliases[slug]) {
          generatedAliases[slug][targetProvider] = modelEntry.id;
        }
      }
    }

    finalModels.sort((a, b) => a.id.localeCompare(b.id));
    fs.writeFileSync(
      MODELS_FILE,
      `export const modelsData = ${JSON.stringify(finalModels, null, 2)};\n`
    );
    console.log(`Synced ${finalModels.length} models.`);

    // Cleanup and save Aliases
    const finalAliases = {};
    Object.keys(generatedAliases)
      .sort()
      .forEach((key) => {
        if (Object.keys(generatedAliases[key]).length > 0) {
          finalAliases[key] = generatedAliases[key];
        }
      });

    fs.writeFileSync(
      ALIASES_FILE,
      `export default ${JSON.stringify(finalAliases, null, 2)} as const;\n`
    );
    console.log(`Successfully generated verified aliases to ${ALIASES_FILE}`);

    // Generate available-models.md documentation
    generateAvailableModelsDoc(finalModels);
  } catch (error) {
    console.error("Error syncing:", error);
    process.exit(1);
  }
}

function generateAvailableModelsDoc(models) {
  const DOCS_FILE = path.join(ROOT_DIR, "docs/models/available_models.md");

  // Group models by provider
  const byProvider = {};
  models.forEach((model) => {
    if (!byProvider[model.provider]) {
      byProvider[model.provider] = [];
    }
    byProvider[model.provider].push(model);
  });

  // Helper to format cost
  const formatCost = (model) => {
    const pricing = model.pricing?.text_tokens?.standard;
    if (!pricing) return "-";

    const parts = [];
    if (pricing.input_per_million) parts.push(`In: $${pricing.input_per_million.toFixed(2)}`);
    if (pricing.output_per_million) parts.push(`Out: $${pricing.output_per_million.toFixed(2)}`);
    if (pricing.cached_input_per_million)
      parts.push(`Cache: $${pricing.cached_input_per_million.toFixed(2)}`);

    return parts.length > 0 ? parts.join(", ") : "-";
  };

  // Helper to format context window
  const formatContext = (tokens) => {
    if (!tokens) return "-";
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${tokens / 1000}k`;
    return tokens.toString();
  };

  let markdown = `---
layout: default
title: Available Models
nav_order: 5
has_children: false
permalink: /available-models
description: Browse AI models from every major provider. Always up-to-date, automatically generated.
---

# {{ page.title }}
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

_Model information enriched by [models.dev](https://models.dev)._

## Last Updated
{: .d-inline-block }

${new Date().toISOString().split("T")[0]}
{: .label .label-green }

---

## Models by Provider

`;

  // Generate tables for each provider
  const providerOrder = [
    "openai",
    "anthropic",
    "gemini",
    "deepseek",
    "openrouter",
    "ollama",
    "bedrock"
  ];
  const providerNames = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Gemini",
    deepseek: "DeepSeek",
    openrouter: "OpenRouter",
    ollama: "Ollama (Local)",
    bedrock: "Amazon Bedrock"
  };

  providerOrder.forEach((provider) => {
    if (!byProvider[provider]) return;

    const providerModels = byProvider[provider].sort(
      (a, b) => (b.context_window || 0) - (a.context_window || 0)
    );

    markdown += `### ${providerNames[provider]} (${providerModels.length})\n\n`;
    markdown += `| Model | Context | Max Output | Pricing (per 1M tokens) |\n`;
    markdown += `| :--- | ---: | ---: | :--- |\n`;

    providerModels.forEach((model) => {
      const context = formatContext(model.context_window);
      const maxOutput = formatContext(model.max_output_tokens);
      const cost = formatCost(model);

      markdown += `| \`${model.id}\` | ${context} | ${maxOutput} | ${cost} |\n`;
    });

    markdown += `\n`;
  });

  // Models by Capability
  markdown += `---\n\n## Models by Capability\n\n`;

  const capabilities = {
    "Function Calling": models.filter((m) => m.capabilities?.includes("function_calling")),
    Vision: models.filter((m) => m.capabilities?.includes("vision")),
    Reasoning: models.filter((m) => m.capabilities?.includes("reasoning")),
    Streaming: models.filter((m) => m.capabilities?.includes("streaming")),
    "Structured Output": models.filter((m) => m.capabilities?.includes("structured_output"))
  };

  Object.entries(capabilities).forEach(([capability, capModels]) => {
    if (capModels.length === 0) return;

    markdown += `### ${capability} (${capModels.length})\n\n`;
    markdown += `| Model | Provider | Context | Pricing |\n`;
    markdown += `| :--- | :--- | ---: | :--- |\n`;

    capModels.slice(0, 20).forEach((model) => {
      const context = formatContext(model.context_window);
      const cost = formatCost(model);
      markdown += `| \`${model.id}\` | ${model.provider} | ${context} | ${cost} |\n`;
    });

    markdown += `\n`;
  });

  // Models by Modality
  markdown += `---\n\n## Models by Modality\n\n`;

  const visionModels = models.filter((m) => m.modalities?.input?.includes("image"));
  if (visionModels.length > 0) {
    markdown += `### Vision Models (${visionModels.length})\n\nModels that can process images:\n\n`;
    markdown += `| Model | Provider | Context | Pricing |\n`;
    markdown += `| :--- | :--- | ---: | :--- |\n`;
    visionModels.slice(0, 15).forEach((model) => {
      markdown += `| \`${model.id}\` | ${model.provider} | ${formatContext(model.context_window)} | ${formatCost(model)} |\n`;
    });
    markdown += `\n`;
  }

  const audioModels = models.filter((m) => m.modalities?.input?.includes("audio"));
  if (audioModels.length > 0) {
    markdown += `### Audio Input Models (${audioModels.length})\n\nModels that can process audio:\n\n`;
    markdown += `| Model | Provider | Context | Pricing |\n`;
    markdown += `| :--- | :--- | ---: | :--- |\n`;
    audioModels.slice(0, 15).forEach((model) => {
      markdown += `| \`${model.id}\` | ${model.provider} | ${formatContext(model.context_window)} | ${formatCost(model)} |\n`;
    });
    markdown += `\n`;
  }

  const embeddingModels = models.filter((m) => m.modalities?.output?.includes("embeddings"));
  if (embeddingModels.length > 0) {
    markdown += `### Embedding Models (${embeddingModels.length})\n\nModels that generate embeddings:\n\n`;
    markdown += `| Model | Provider | Dimensions | Pricing |\n`;
    markdown += `| :--- | :--- | ---: | :--- |\n`;
    embeddingModels.slice(0, 15).forEach((model) => {
      markdown += `| \`${model.id}\` | ${model.provider} | - | ${formatCost(model)} |\n`;
    });
    markdown += `\n`;
  }

  // Add programmatic access section (preserve original content)
  markdown += `---\n\n## Programmatic Access\n
You can access this data programmatically using the registry:

\`\`\`ts
import { NodeLLM } from "@node-llm/core";

// Get metadata for a specific model
const model = await NodeLLM.model("gpt-4o");

console.log(model.context_window); // 128000
console.log(model.pricing.text_tokens.standard.input_per_million); // 2.5
console.log(model.capabilities); // ["vision", "function_calling", ...]

// Get all models in the registry
const allModels = await NodeLLM.listModels();
\`\`\`

---

## Finding Models

Use the registry to find models dynamically based on capabilities:

\`\`\`ts
const allModels = await NodeLLM.listModels();

// Find a model that supports vision and tools
const visionModel = allModels.find(m => 
  m.capabilities.includes("vision") && m.capabilities.includes("function_calling")
);
\`\`\`

---

## Model Aliases

\`NodeLLM\` uses aliases (defined strictly in \`packages/core/src/aliases.ts\`) for convenience, mapping common names to specific provider-specific versions. This allows you to use a generic name like \`"gpt-4o"\` or \`"claude-3-5-sonnet"\` and have it resolve to the correct ID for your configured provider.

### How It Works

Aliases abstract away the specific model ID strings required by different providers. For example, \`claude-3-5-sonnet\` might map to:

- **Anthropic**: \`claude-3-5-sonnet-20241022\`
- **OpenRouter**: \`anthropic/claude-3.5-sonnet\`

When you call a method like \`NodeLLM.chat("claude-3-5-sonnet")\`, \`NodeLLM\` checks the configured provider and automatically resolves the alias.

\`\`\`ts
// Using Anthropic provider
const llm = createLLM({ provider: "anthropic" });
const chat = llm.chat("claude-3-5-sonnet"); 
// Resolves internally to "claude-3-5-sonnet-20241022" (or latest stable version)
\`\`\`

### Provider-Specific Resolution

If an alias exists for multiple providers, the resolution depends entirely on the \`provider\` you have currently configured/passed.

\`\`\`json
// Example aliases.ts structure
{
  "gemini-flash": {
    "gemini": "gemini-1.5-flash-001",
    "openrouter": "google/gemini-1.5-flash-001"
  }
}
\`\`\`

This ensures your code remains portable across providers without changing the model string manually.

### Prioritization

\`NodeLLM\` prioritizes exact ID matches first (if you pass a specific ID like \`"gpt-4-0613"\`, it uses it). If no exact match or known ID is found, it attempts to resolve it as an alias.

### Programmatic Access

You can access the alias mappings programmatically for validation or UI purposes:

\`\`\`ts
import { MODEL_ALIASES, resolveModelAlias } from "@node-llm/core";

// Check if an alias exists
const isValidAlias = "claude-3-5-haiku" in MODEL_ALIASES;

// Get all providers supporting an alias
const providers = Object.keys(MODEL_ALIASES["claude-3-5-haiku"]);
// => ["anthropic", "openrouter"]

// Resolve alias for a specific provider
const resolved = resolveModelAlias("claude-3-5-haiku", "anthropic");
// => "claude-3-5-haiku-20241022"

// List all available aliases
const allAliases = Object.keys(MODEL_ALIASES);

// Validate user input
function validateModel(input, provider) {
  if (input in MODEL_ALIASES) {
    if (MODEL_ALIASES[input][provider]) {
      return { valid: true, resolved: MODEL_ALIASES[input][provider] };
    }
    return { valid: false, reason: \`Alias not supported for \${provider}\` };
  }
  return { valid: true, resolved: input };
}
\`\`\`

This is useful for:
- Building model selection UIs
- Validating user input before API calls
- Checking provider compatibility
- Debugging 404 errors

---

**Auto-generated by \`npm run sync-models\`** • Last updated: ${new Date().toISOString().split("T")[0]}
`;

  fs.writeFileSync(DOCS_FILE, markdown);
  console.log(`Generated documentation: ${DOCS_FILE}`);
}

syncModels();
