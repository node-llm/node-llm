---
layout: default
title: Ollama
nav_order: 5
parent: Providers
---

# Ollama Provider

Allows you to run large language models locally using [Ollama](https://ollama.com/).

## Configuration

Standard configuration for local inference (defaults to `http://localhost:11434/v1`):

```javascript
import { LLM } from "@node-llm/core";

// Defaults to http://localhost:11434/v1
LLM.configure({
  provider: "ollama",
});
```

### Custom URL

If your Ollama instance is running on a different machine or port:

```javascript
LLM.configure({
  provider: "ollama",
  ollamaApiBase: "http://192.168.1.10:11434/v1", // Note the /v1 suffix
});
```

## Specific Parameters

You can pass Ollama/OpenAI-compatible parameters using `.withParams()`.

```javascript
const chat = LLM.chat("llama3")
  .withParams({ 
    temperature: 0.7,
    seed: 42,
    num_ctx: 8192, // Ollama specific context size
  });
```

## Features

- **Models**: Supports any model pulled via `ollama pull`.
- **Vision**: Use vision-capable models like `llama3.2-vision` or `llava`.
- **Tools**: Fully supported for models with tool-calling capabilities (e.g., `llama3.1`).
- **Embeddings**: High-performance local vector generation.
- **Model Discovery**: Inspect your local library and model metadata via `LLM.listModels()`.

### Multimodal (Vision)

```javascript
const response = await chat.ask("Describe this image", {
  files: ["./image.png"]
});
```

### Model Discovery

List all models currently pulled in your Ollama library to inspect their context windows and features:

```javascript
const models = await LLM.listModels();
console.table(models);
```

## Limitations

The following features are **not** supported natively by Ollama's OpenAI-compatible API:

*   **Transcription** (Whisper): Not available via the `/v1/audio` endpoint.
*   **Image Generation**: Not available via the `/v1/images` endpoint.
*   **Moderation**: Not supported.

For full feature parity locally, consider using [LocalAI](https://localai.io/) and connecting via the [OpenAI Provider](./openai.md) with a custom `openaiApiBase`.

