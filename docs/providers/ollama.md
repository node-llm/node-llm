---
layout: default
title: Ollama
parent: Providers
nav_order: 5
description: Run Large Language Models locally on your machine with full support for vision, tools, and embeddings while maintaining total data sovereignty.
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

Allows you to run large language models locally using [Ollama](https://ollama.com/).

## Configuration

Standard configuration for local inference (defaults to `http://localhost:11434/v1`):

```javascript
import { createLLM } from "@node-llm/core";

// Defaults to http://localhost:11434/v1
const llm = createLLM({ provider: "ollama" });
```

### Custom URL

If your Ollama instance is running on a different machine or port:

```javascript
const llm = createLLM({ provider: "ollama", ollamaApiBase: "http://192.168.1.10:11434/v1", // Note the /v1 suffix });
```

## Specific Parameters

You can pass Ollama/OpenAI-compatible parameters using `.withParams()`.

```javascript
const chat = llm.chat("llama3").withParams({
  temperature: 0.7,
  seed: 42,
  num_ctx: 8192 // Ollama specific context size
});
```

## Features

- **Models**: Supports any model pulled via `ollama pull`.
- **Vision**: Use vision-capable models like `llama3.2-vision` or `llava`.
- **Tools**: Fully supported for models with tool-calling capabilities (e.g., `llama3.1`).
- **Embeddings**: High-performance local vector generation.
- **Model Discovery**: Inspect your local library and model metadata via `NodeLLM.listModels()`.

### Multimodal (Vision)

```javascript
const response = await chat.ask("Describe this image", {
  files: ["./image.png"]
});
```

### Model Discovery

List all models currently pulled in your Ollama library to inspect their context windows and features:

```javascript
const models = await NodeLLM.listModels();
console.table(models);
```

## Limitations

The following features are **not** supported natively by Ollama's OpenAI-compatible API:

- **Transcription** (Whisper): Not available via the `/v1/audio` endpoint.
- **Image Generation**: Not available via the `/v1/images` endpoint.
- **Moderation**: Not supported.

For full feature parity locally, consider using [LocalAI](https://localai.io/) and connecting via the [OpenAI Provider](/providers/openai.html) with a custom `openaiApiBase`.
