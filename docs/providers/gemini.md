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

---

## Video Support

Gemini is unique in its ability to natively process video files.

```ts
await chat.ask("What happens in this video?", {
  files: ["./video.mp4"]
});
```

---

## Getting an API Key

Sign up and get your API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
