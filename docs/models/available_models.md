---
layout: default
title: Available Models
nav_order: 5
has_children: false
permalink: /available-models
---

# Available Models

`node-llm` includes a comprehensive registry of models with metadata for pricing, context windows, and capabilities. Below are the most popular models supported out of the box.

## OpenAI

| Model ID | Context | Cost (In/Out) | Notes |
| :--- | :--- | :--- | :--- |
| **Flagship** | | | |
| `gpt-4o` | 128k | $2.50 / $10 | High intelligence, native multimodal |
| `gpt-4o-mini` | 128k | $0.15 / $0.60 | Fast, cheap replacement for GPT-3.5 |
| **Reasoning** | | | |
| `o1-preview` | 128k | $15 / $60 | Advanced reasoning, slower |
| `o1-mini` | 128k | $3 / $12 | Efficient reasoning |
| **Standard** | | | |
| `gpt-4-turbo` | 128k | $10 / $30 | Previous flagship |
| `gpt-3.5-turbo` | 16k | $0.50 / $1.50 | Legacy standard |
| **Audio / Other** | | | |
| `whisper-1` | - | $0.006 / min | Speech to Text |
| `text-embedding-3-small` | 8k | $0.02 | Embeddings |
| `text-embedding-3-large` | 8k | $0.13 | Embeddings |

## Anthropic

| Model ID | Context | Cost (In/Out) | Notes |
| :--- | :--- | :--- | :--- |
| **Claude 3.5** | | | |
| `claude-3-5-sonnet-20241022` | 200k | $3 / $15 | Best balance of speed/intelligence |
| `claude-3-5-haiku-20241022` | 200k | $0.80 / $4 | Extremely fast |
| **Claude 3** | | | |
| `claude-3-opus-20240229` | 200k | $15 / $75 | Highest reasoning (legacy) |
| `claude-3-sonnet-20240229` | 200k | $3 / $15 | Balanced |
| `claude-3-haiku-20240307` | 200k | $0.25 / $1.25 | Economy |

## Gemini

| Model ID | Context | Cost (In/Out) | Notes |
| :--- | :--- | :--- | :--- |
| **Gemini 2.0** | | | |
| `gemini-2.0-flash` | 1M | $0.10 / $0.40 | Next-gen speed & multimodal |
| **Gemini 1.5** | | | |
| `gemini-1.5-pro` | 2M | $1.25 / $5 | Massive context window |
| `gemini-1.5-flash` | 1M | $0.075 / $0.30 | High volume tasks |
| `gemini-1.5-flash-8b` | 1M | $0.0375 / $0.1125 | Ultra-fast, optimized for high scale |
| **Embedding** | | | |
| `text-embedding-004` | - | - | Semantic search |

## DeepSeek

| Model ID | Context | Cost (In/Out) | Notes |
| :--- | :--- | :--- | :--- |
| **DeepSeek V3** | | | |
| `deepseek-chat` | 128k | $0.27 / $1.10 | Extremely cost-effective flagship |
| **DeepSeek R1** | | | |
| `deepseek-reasoner` | 128k | $0.55 / $2.19 | Advanced reasoning (R1) |

## OpenRouter

OpenRouter provides access to 300+ additional models through a single gateway. 

| Model ID | Context | Cost | Notes |
| :--- | :--- | :--- | :--- |
| `google/gemini-2.0-flash-exp:free` | 1M | Free | Fast experimental model |
| `meta-llama/llama-3.1-405b-instruct` | 128k | $2 / $10 | Top-tier open source model |
| `liquid/lfm-40b` | 32k | $0.10 / $0.10 | High performance specialist |
| `qwen/qwen-2.5-72b-instruct` | 128k | $0.35 / $0.40 | Strong general reasoning |

## Ollama (Local)

Ollama models are run locally on your machine. Costs are typically free (local compute).

| Model ID | Context | Cost | Notes |
| :--- | :--- | :--- | :--- |
| **Llama 3.2** | | | |
| `llama3.2` | 128k | Free | Vision, tools, small and fast |
| `llama3.2:1b` | 128k | Free | Ultra-lightweight |
| **Llama 3.1** | | | |
| `llama3.1` | 128k | Free | Tools support, balanced |
| `llama3.1:70b` | 128k | Free | Powerful open model |
| **Mistral** | | | |
| `mistral` | 32k | Free | Reliable, tools support |
| **Embeddings** | | | |
| `nomic-embed-text` | 8k | Free | High quality embeddings |
| `mxbai-embed-large` | 512 | Free | Popular for RAG |


You can access this data programmatically using the registry:

```ts
import { NodeLLM } from "@node-llm/core";

// Get metadata for a specific model
const model = await NodeLLM.model("gpt-4o");

console.log(model.context_window); // 128000
console.log(model.pricing.text_tokens.standard.input_per_million); // 2.5
console.log(model.capabilities); // ["vision", "function_calling", ...]

// Get all models in the registry
const allModels = await NodeLLM.listModels();
```

## Finding Models

Use the registry to find models dynamically based on capabilities:

```ts
const allModels = await NodeLLM.listModels();

// Find a model that supports vision and tools
const visionModel = allModels.find(m => 
  m.capabilities.includes("vision") && m.capabilities.includes("function_calling")
);
```

## Model Aliases

`node-llm` uses aliases (defined strictly in `packages/core/src/aliases.json`) for convenience, mapping common names to specific provider-specific versions. This allows you to use a generic name like `"gpt-4o"` or `"claude-3-5-sonnet"` and have it resolve to the correct ID for your configured provider.

### How It Works

Aliases abstract away the specific model ID strings required by different providers. For example, `claude-3-5-sonnet` might map to:

- **Anthropic**: `claude-3-5-sonnet-20241022`
- **Vertex AI**: `claude-3-5-sonnet-v2@20241022`
- **OpenRouter**: `anthropic/claude-3.5-sonnet`
- **Bedrock**: `anthropic.claude-3-5-sonnet-20241022-v2:0`

When you call a method like `NodeLLM.chat("claude-3-5-sonnet")`, `node-llm` checks the configured provider and automatically resolves the alias.

```ts
// If configured with Anthropic
NodeLLM.configure({ provider: "anthropic" });
const chat = NodeLLM.chat("claude-3-5-sonnet"); 
// Resolves internally to "claude-3-5-sonnet-20241022" (or latest stable version)

// If configured with Bedrock
NodeLLM.configure({ provider: "bedrock" });
const chat = NodeLLM.chat("claude-3-5-sonnet");
// Resolves internally to "anthropic.claude-3-5-sonnet-20241022-v2:0"
```

### Provider-Specific Resolution

If an alias exists for multiple providers, the resolution depends entirely on the `provider` you have currently configured/passed.

```json
// Example aliases.json structure
{
  "gemini-flash": {
    "gemini": "gemini-1.5-flash-001",
    "vertexai": "gemini-1.5-flash-001",
    "openrouter": "google/gemini-1.5-flash-001"
  }
}
```

This ensures your code remains portable across providers without changing the model string manually.

### Prioritization

`node-llm` prioritizes exact ID matches first (if you pass a specific ID like `"gpt-4-0613"`, it uses it). If no exact match or known ID is found, it attempts to resolve it as an alias.
