---
layout: default
title: Error Handling
nav_order: 3
parent: Advanced
---

# Error Handling

`node-llm` provides a rich exception hierarchy to help you handle failures gracefully. All errors inherit from the base `LLMError` class.

## Error Hierarchy

- `LLMError`: Base class for all library errors.
  - `ConfigurationError`: Missing API keys or invalid config.
  - `NotFoundError`: Model or provider not found in registry.
  - `CapabilityError`: Model does not support the requested feature (e.g. vision).
  - `APIError`: Base for all upstream provider API issues.
    - `BadRequestError` (400): Invalid parameters.
    - `AuthenticationError` (401/403): Invalid API key or permissions.
    - `RateLimitError` (429): You are hitting limits.
    - `ServerError` (500+): Provider internal issues.
      - `ServiceUnavailableError`: Temporary outages or overloads.

## Handling Specific Errors

You can catch specific errors to implement custom logic.

```ts
import { NodeLLM, RateLimitError, CapabilityError } from "@node-llm/core";

try {
  await NodeLLM.chat("text-only-model").ask("Analyze", {
    files: ["image.png"]
  });
} catch (error) {
  if (error instanceof CapabilityError) {
    console.error("This model can't see images. Try gpt-4o.");
  } else if (error instanceof RateLimitError) {
    console.warn("Slowing down...");
    await sleep(5000);
  } else {
    // Re-throw unknown errors
    throw error;
  }
}
```

## Accessing Response Details

`APIError` instances contain details about the failed request.

```ts
try {
  await chat.ask("Create a...");
} catch (error) {
  if (error instanceof APIError) {
    console.log(`Status: ${error.status}`); // e.g. 500
    console.log(`Provider: ${error.provider}`); // e.g. "openai"
    console.log(`Raw Body:`, error.body); // { error: { message: "..." } }
  }
}
```

## Automatic Retries

`node-llm` automatically retries transient errors (Rate Limits, 5xx Server Errors) using an exponential backoff strategy. You can configure this globally.

```ts
NodeLLM.configure({
  retry: {
    attempts: 3,      // Max retries (default: 3)
    delayMs: 1000,    // Initial delay (default: 1000ms)
    multiplier: 2     // Exponential factor
  }
});
```

The library will **not** retry non-transient errors like `BadRequestError` (400) or `AuthenticationError` (401).

## Debugging

If you are stuck, enable debug logs to see the exact request and response payloads associated with an error.

```bash
export NODELLM_DEBUG=true
```
