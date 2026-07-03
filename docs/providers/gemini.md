---
layout: default
title: Gemini
parent: Providers
nav_order: 2
description: Leverage Google's powerful multimodal capabilities with native support for image, audio, and video processing alongside long-context reasoning.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.0.0+</span>
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Google's Gemini provider offers multimodal capabilities including native video and audio understanding.

---

## Configuration

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ 
  provider: "gemini", 
  geminiApiKey: process.env.GEMINI_API_KEY // Optional if set in env 
});
```

### Custom Endpoint

To route requests through a proxy or Gemini-compatible gateway, override the base URL via `geminiApiBase` (or the `GEMINI_API_BASE` environment variable):

```ts
const llm = createLLM({
  provider: "gemini",
  geminiApiBase: "https://my-proxy.example.com/v1beta"
});
```

---

## Specific Parameters

Gemini uses `generationConfig` and `safetySettings`.

```ts
const chat = llm.chat("gemini-1.5-pro").withParams({
  generationConfig: {
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_LOW_AND_ABOVE"
    }
  ]
});
```

---

## Features

- **Models**: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash`.
- **Multimodal**: Supports images, audio, and video files directly.
- **Tools**: Supported.
- **System Instructions**: Supported.
- **Structured Output**: Native JSON schema support.
- **Embeddings**: Vector generation via `text-embedding-004`.
- **Image Generation**: Imagen model support via `llm.paint()`.
- **Transcription**: Audio transcription via Gemini's multimodal `generateContent` endpoint.

---

## Video Support

Gemini is unique in its ability to natively process video files.

```ts
await chat.ask("What happens in this video?", {
  files: ["./video.mp4"]
});
```

---

## Embeddings

Generate vector embeddings using Gemini's embedding models.

```ts
const embedding = await llm.embed("The concept of general relativity", {
  model: "text-embedding-004"
});

console.log(embedding.vector); // number[]
```

---

## Image Generation

Use the `paint()` method to generate images with Imagen.

```ts
const response = await llm.paint("A futuristic city on Mars, high quality, 4k", {
  model: "imagen-4.0-generate-001"
});

await response.save("./mars-city.png");
```

---

## Transcription

Transcribe audio files using Gemini's native multimodal understanding.

```ts
const transcription = await llm.transcribe("./meeting.mp3", {
  model: "gemini-2.0-flash"
});

console.log(transcription.text);
```

---

## Getting an API Key

Sign up and get your API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
