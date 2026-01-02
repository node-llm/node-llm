---
layout: default
title: Custom Endpoints
nav_order: 4
parent: Advanced
---

# Custom Endpoints & Models

`node-llm` is flexible enough to connect to any OpenAI-compatible service and use custom models.

## OpenAI-Compatible Endpoints

Connect to services like Azure OpenAI, LiteLLM, or Ollama by configuring the base URL.

### Generic Configuration

Set `OPENAI_API_BASE` to your custom endpoint:

```bash
# LiteLLM
export OPENAI_API_KEY="your-litellm-key"
export OPENAI_API_BASE="https://your-proxy.litellm.ai/v1"

# Ollama (Local)
export OPENAI_API_KEY="not-needed"
export OPENAI_API_BASE="http://localhost:11434/v1"
```

### Azure OpenAI

For Azure, point `OPENAI_API_BASE` to your specific deployment URL. The library correctly handles URL construction even with query parameters.

```bash
export OPENAI_API_KEY="your-azure-key"
# Include the full path to your deployment
export OPENAI_API_BASE="https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT?api-version=2024-08-01-preview"
```

Then, pass the `api-key` header manually when creating the chat instance:

```typescript
import { LLM } from '@node-llm/core';

LLM.configure({ provider: 'openai' });

const chat = LLM.chat('gpt-4').withRequestOptions({
  headers: { 'api-key': process.env.OPENAI_API_KEY }
});

const response = await chat.ask('Hello Azure!');
```

## Using Custom Models (`assumeModelExists`)

If you use a model ID not in the built-in registry (e.g., custom Azure names or new models), use `assumeModelExists: true` to bypass validation.

```typescript
const chat = LLM.chat('my-company-gpt-4', {
  assumeModelExists: true,
  // Provider is typically required if not already configured globally
  provider: 'openai' 
});

await chat.ask("Hello");
```

This flag is available on all major methods:

```typescript
// Embeddings
await LLM.embed('text', {
  model: 'custom-embedder',
  assumeModelExists: true
});

// Image Generation
await LLM.paint('prompt', {
  model: 'custom-dalle',
  assumeModelExists: true
});
```

**Note:** When using this flag, strict capability checks (e.g., whether a model supports vision) are skipped. You are responsible for ensuring the model supports the requested features.
