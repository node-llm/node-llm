---
layout: default
title: Error Handling
parent: Advanced
nav_order: 3
description: Build resilient AI applications with NodeLLM's descriptive error hierarchy and unified error reporting across all providers.
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
NodeLLM provides a descriptive exception hierarchy to help you handle failures gracefully. All errors inherit from the base `LLMError` class.

## Error Hierarchy

All errors raised by NodeLLM inherit from `LLMError`. Specific errors map to HTTP status codes or library-specific issues:

```
LLMError                        # Base error class
├── APIError                    # Base for all provider API issues
│   ├── BadRequestError         # 400: Invalid request parameters
│   │   └── ContextWindowExceededError # 400: Prompt/output exceeds token limits
│   ├── UnauthorizedError       # 401: Invalid or missing API key
│   ├── PaymentRequiredError    # 402: Billing issues
│   ├── ForbiddenError          # 403: Permission denied
│   ├── RateLimitError          # 429: Rate limit exceeded
│   │   └── InsufficientQuotaError     # 429: Out of credits or monthly quota
│   ├── ServerError             # 500+: Provider server error
│   │   └── ServiceUnavailableError  # 502/503/529: Overloaded
│   └── AuthenticationError     # 401/403 (deprecated, use specific classes)
├── ConfigurationError          # Missing API key or invalid config
├── NotFoundError               # Model or provider not found
│   └── InvalidModelError       # 404: Requested model ID is unknown
├── CapabilityError             # Model doesn't support feature (e.g. vision)
├── ToolError                   # Tool execution failed (has `fatal` property)
├── ProviderNotConfiguredError  # No provider set
├── UnsupportedFeatureError     # Provider doesn't support feature
└── ModelCapabilityError        # Model doesn't support capability
```

---

## Basic Error Handling

Catch the base `LLMError` for generic handling:

```typescript
import { LLMError, ConfigurationError } from "@node-llm/core";

try {
  const response = await chat.ask("Hello");
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error("Check your API key configuration");
  } else if (error instanceof LLMError) {
    console.error("AI error:", error.message);
  } else {
    throw error;
  }
}
```

---

## Handling Specific Errors

For granular control, catch specific error classes:

```typescript
import {
  UnauthorizedError,
  PaymentRequiredError,
  ForbiddenError,
  RateLimitError,
  ServerError,
  CapabilityError
} from "@node-llm/core";

try {
  await chat.ask("Analyze this image", { files: ["image.png"] });
} catch (error) {
  if (error instanceof UnauthorizedError) {
    console.error("Invalid API key. Check your configuration.");
  } else if (error instanceof PaymentRequiredError) {
    console.error("Billing issue. Check your provider account.");
  } else if (error instanceof ForbiddenError) {
    console.error("Permission denied. Check API key scopes.");
  } else if (error instanceof RateLimitError) {
    console.warn("Rate limited. Waiting before retry...");
    await sleep(5000);
  } else if (error instanceof CapabilityError) {
    console.error("This model doesn't support images. Try gpt-4o.");
  } else if (error instanceof ServerError) {
    console.error("Provider is having issues. Try again later.");
  } else {
    throw error;
  }
}
```

---

## Accessing Response Details

`APIError` instances contain details about the failed request:

```typescript
import { APIError } from "@node-llm/core";

try {
  await chat.ask("Something that fails");
} catch (error) {
  if (error instanceof APIError) {
    console.log(`Status: ${error.status}`);       // e.g. 429
    console.log(`Provider: ${error.provider}`);   // e.g. "openai"
    console.log(`Model: ${error.model}`);         // e.g. "gpt-4o"
    console.log(`Body:`, error.body);             // Raw error response
  }
}
```

---

## Error Handling During Streaming

When streaming, errors can occur after some chunks have been received. NodeLLM will throw after the stream ends or is interrupted:

```typescript
let accumulated = "";

try {
  for await (const chunk of chat.stream("Tell me a long story")) {
    accumulated += chunk.content || "";
    process.stdout.write(chunk.content || "");
  }
} catch (error) {
  console.error("\nStream failed:", error.message);
  console.log("Partial content received:", accumulated);
}
```

Your loop will process chunks received before the error. Always handle partial content when streaming.

---

## Handling Errors Within Tools

When building tools, decide how errors should surface:

### Return Error to LLM (Recoverable)

If the LLM might fix the issue (e.g., bad parameters), return an error object:

```typescript
class WeatherTool extends Tool {
  async execute({ location }) {
    if (!location) {
      return { error: "Location is required. Please provide a city name." };
    }
    // ... call API
  }
}
```

### Throw Error (Fatal)

If the error is unrecoverable, throw it to stop the agent loop:

```typescript
import { ToolError } from "@node-llm/core";

class DatabaseTool extends Tool {
  async execute({ query }) {
    if (query.includes("DROP")) {
      throw new ToolError("Dangerous query blocked", "database", true);
    }
    // ...
  }
}
```

See [Tool Error Handling](../core-features/tools.html#error-handling--flow-control-) for more patterns.

---

## Automatic Retries

NodeLLM automatically retries transient errors:

- **Retried**: `RateLimitError` (429), `ServerError` (500+), `ServiceUnavailableError`
- **Not retried**: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `ContextWindowExceededError`, `InsufficientQuotaError`

> **Why not retry on Context Window Overflows?**
> A `ContextWindowExceededError` (400) is considered a client-side logic error. Retrying with the same payload would consistently fail. By identifying this specific error, developers can implement smarter recovery logic, such as trimming chat history or summarizing previous turns before retrying manually.

Configure retry behavior:

```typescript
const llm = createLLM({
  provider: "openai",
  maxRetries: 3  // Default: 3
});
```

---

## Debugging

Enable debug logging to see detailed request/response information:

```bash
export NODELLM_DEBUG=true
```

This logs API calls, headers, and responses (with sensitive data filtered).

---

## Best Practices

1. **Be Specific**: Catch specific error classes for tailored recovery logic.

2. **Log Context**: Include model, provider, and (safe) input data in logs.

3. **User Feedback**: Show friendly messages, not raw API errors.

4. **Fallbacks**: Consider trying a different model or returning cached data.

5. **Monitor**: Track error frequency in production to identify patterns.

---

## Next Steps

- [Tool Calling](../core-features/tools.html) — Build tools with proper error handling
- [Streaming](../core-features/streaming.html) — Handle streaming responses
- [Security](security.html) — Protect your application with rate limits and guards
