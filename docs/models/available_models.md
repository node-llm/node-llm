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
import { LLM } from "@node-llm/core";

// Get metadata for a specific model
const model = await LLM.model("gpt-4o");

console.log(model.context_window); // 128000
console.log(model.pricing.text_tokens.standard.input_per_million); // 2.5
console.log(model.capabilities); // ["vision", "function_calling", ...]

// Get all models in the registry
const allModels = await LLM.listModels();
```

## Finding Models

Use the registry to find models dynamically based on capabilities:

```ts
const allModels = await LLM.listModels();

// Find a model that supports vision and tools
const visionModel = allModels.find(m => 
  m.capabilities.includes("vision") && m.capabilities.includes("function_calling")
);
```
