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
| `gpt-4o` | 128k | $5 / $15 | High intelligence, native multimodal |
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
| **Embedding** | | | |
| `text-embedding-004` | - | - | Semantic search |



## Programmatic Access

You can access this data programmatically using the registry:

```ts
import { LLM } from "@node-llm/core";

const model = LLM.models.find("gpt-4o");

console.log(model.context_window); // 128000
console.log(model.pricing.text_tokens.standard.input_per_million); // 5
console.log(model.capabilities); // ["vision", "function_calling", ...]
```

## Finding Models

Use the registry to find models dynamically based on capabilities:

```ts
// Find a model that supports vision and tools
const visionModel = LLM.models.list().find(m => 
  m.capabilities.includes("vision") && m.capabilities.includes("function_calling")
);
```
