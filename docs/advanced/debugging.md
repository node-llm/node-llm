---
layout: default
title: Debugging & Logging
parent: Advanced
nav_order: 3
---

# Debugging & Logging

When building LLM applications, understanding what's happening "under the hood" is critical. `node-llm` provides mechanisms to inspect raw requests and responses.

## Debug Mode

You can enable detailed debug logging by setting the `NODELLM_DEBUG` environment variable. This will print the raw payloads sent to and received from the providers.

```bash
export NODELLM_DEBUG=true
node my-app.js
```

**Output Example:**

```text
[NodeLLM] [OpenAI] Request: POST https://api.openai.com/v1/chat/completions
{
  "model": "gpt-4o",
  "messages": [...]
}
[NodeLLM] [OpenAI] Response: 200 OK
{
  "id": "chatcmpl-123",
  ...
}
```

## Lifecycle Handlers

For programmatic observability (e.g., sending logs to Datadog or Sentry), use the [Chat Event Handlers](../core-features/chat.html#lifecycle-events).

```ts
chat
  .onNewMessage(() => logger.info("Chat started"))
  .onEndMessage((res) => logger.info("Chat finished", { tokens: res.total_tokens }));
```
