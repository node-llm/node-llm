---
layout: default
title: Error Handling
parent: Advanced
nav_order: 3
description: Build resilient AI applications using our descriptive exception hierarchy and unified error reporting across all providers.
---

# {{ page.title }}

{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents

{: .no_toc .text-delta }

1. TOC
{:toc}

---

\`NodeLLM\` provides a rich exception hierarchy to help you handle failures gracefully. All errors inherit from the base \`LLMError\` class.

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
  - `ToolError`: Failure during tool execution. Includes `fatal` property for loop control.

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

`NodeLLM` automatically retries transient errors (Rate Limits, 5xx Server Errors) using an exponential backoff strategy. You can configure this globally.

```ts
const llm = createLLM({
  provider: "openai",
  retry: {
    attempts: 3, // Max retries (default: 3)
    delayMs: 1000, // Initial delay (default: 1000ms)
    multiplier: 2 // Exponential factor
  }
});
```

The library will **not** retry non-transient errors like `BadRequestError` (400) or `AuthenticationError` (401).

## Tool Loop Flow Control 🔄 <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.1+</span>

When a tool fails inside a `Chat.ask()` or `Chat.stream()` loop, `NodeLLM` uses a strategy to stop infinite recursion.

### Automatic Logic

The agent loop will **short-circuit and crash** immediately if:

1.  An `AuthenticationError` (401/403) occurs.
2.  A `ToolError` is thrown with `fatal: true`.

### Manual Control

You can override this behavior using the `onToolCallError` hook in `ChatOptions`:

```ts
const chat = llm.chat("gpt-4o", {
  onToolCallError: (toolCall, error) => {
    if (isCritical(toolCall)) return "STOP"; // Crash immediately
    if (isOptional(toolCall)) return "CONTINUE"; // Swallow error and proceed
    // return void to let NodeLLM decide
  }
});
```

See the [Tool Calling documentation](../core-features/tools.html#error-handling--flow-control-) for more examples.
