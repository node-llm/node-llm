---
layout: default
title: Gemini
nav_order: 2
parent: Providers
---

# Gemini Provider

Google's Gemini provider offers multimodal capabilities including native video and audio understanding.

## Configuration

```ts
import { NodeLLM } from "@node-llm/core";

NodeLLM.configure({
  provider: "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY, // Optional if set in env
});
```

## Specific Parameters

Gemini uses `generationConfig` and `safetySettings`.

```ts
const chat = NodeLLM.chat("gemini-1.5-pro")
  .withParams({
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

## Features

- **Models**: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-1.0-pro`.
- **Multimodal**: Supports Images, Audio, and Video files directly.
- **Tools**: Supported.
- **System Instructions**: Supported.

## Video Support

Gemini is unique in its ability to natively process video files.

```ts
await chat.ask("What happens in this video?", {
  files: ["./video.mp4"]
});
```
