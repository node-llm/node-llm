---
layout: default
title: Debugging & Logging
parent: Advanced
nav_order: 3
---

# Debugging & Logging

When building LLM applications, understanding what's happening "under the hood" is critical. `NodeLLM` provides mechanisms to inspect raw requests and responses.

## Debug Mode

You can enable detailed debug logging in two ways:

### 1. Programmatic Configuration (Recommended)

```ts
import { NodeLLM } from "@node-llm/core";

NodeLLM.configure({ debug: true });
```

This will print the raw HTTP requests and responses for **all API calls** across **every feature and provider**.

### 2. Environment Variable

```bash
export NODELLM_DEBUG=true
node my-app.js
```

### Scoped Debug Mode

You can also enable debug mode for specific provider instances:

```ts
const debugAnthropic = NodeLLM.withProvider("anthropic", { debug: true });
```

**Output Example:**

```text
[NodeLLM] [OpenAI] Request: POST https://api.openai.com/v1/chat/completions
{
  "model": "gpt-4o",
  "messages": [...],
  "tools": [...]
}
[NodeLLM] [OpenAI] Response: 200 OK
{
  "id": "chatcmpl-123",
  "choices": [...],
  "usage": {...}
}
```

### Coverage

Debug logging works for:
- **Chat** (regular and streaming)
- **Image Generation** (OpenAI, Gemini)
- **Embeddings** (OpenAI, Gemini, Ollama)
- **Transcription** (OpenAI, Gemini)
- **Moderation** (OpenAI)
- **Model Alias Resolution** (all providers)
- **All Providers** (OpenAI, Anthropic, Gemini, DeepSeek)

The logs include:
- HTTP method and full URL
- Request body (JSON formatted)
- Response status code and status text
- Response body (JSON formatted)
- Model alias resolution (when using aliases)

### Model Alias Resolution

When debug mode is enabled, you'll see logs showing how model aliases are resolved:

```text
[NodeLLM Debug] Resolved model alias 'claude-3-5-haiku' → 'claude-3-5-haiku-20241022' for provider 'anthropic'
[NodeLLM Debug] No alias mapping found for 'custom-model' with provider 'anthropic', using as-is
```

This is particularly helpful when debugging 404 errors, as it shows the actual model ID being sent to the API.

## Lifecycle Handlers

For programmatic observability (e.g., sending logs to Datadog or Sentry), use the [Chat Event Handlers](/core-features/chat.html#lifecycle-events).

```ts
chat
  .onNewMessage(() => logger.info("Chat started"))
  .onEndMessage((res) => logger.info("Chat finished", { tokens: res.total_tokens }));
```
