---
layout: default
title: Configuration
nav_order: 3
parent: Getting Started
---

# Configuration

Before using the library, you need to configure the provider. You can do this globally using `LLM.configure`.

```ts
import { LLM } from "@node-llm/core";
import "dotenv/config";

LLM.configure({
  provider: "openai", // or "anthropic", "gemini"
  apiKey: process.env.OPENAI_API_KEY, // Optional if set in env vars
  retry: { attempts: 3, delayMs: 500 },
  defaultModerationModel: "text-moderation-latest",
  defaultTranscriptionModel: "whisper-1", // Provider specific defaults
  defaultEmbeddingModel: "text-embedding-3-small"
});
```

See [Custom Endpoints](/advanced/custom_endpoints) for advanced configuration.
