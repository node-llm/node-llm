---
layout: default
title: Configuration
nav_order: 3
parent: Getting Started
permalink: /getting-started/configuration
description: Learn how to configure NodeLLM with API keys, custom base URLs, security limits, and per-request overrides.
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

`NodeLLM` provides three ways to configure providers: **Zero-Config** (via environment variables), **Explicit Factory** (via `createLLM`), and **Isolated Branching** (via `.withProvider`).

## 1. Zero-Config (The "Direct" Pattern)

The simplest way to use NodeLLM is by relying on environment variables. NodeLLM will automatically snapshot your environment at load time.

**Environment variables (`.env`):**

```env
NODELLM_PROVIDER=openai
OPENAI_API_KEY=sk-....
```

**Code:**

```typescript
import "dotenv/config";
import { NodeLLM } from "@node-llm/core";

// Zero setup required
const chat = NodeLLM.chat();
```

---

## 2. Explicit Factory (`createLLM`)

Recommended for production applications where you want to explicitly define provider behavior or manage multiple providers in one application.

## Switching Providers

Since `NodeLLM` is immutable, you switch providers by creating a new instance using `createLLM()` or `withProvider()`.

```typescript
// Create an Anthropic instance
const llm = createLLM({
  provider: "anthropic",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY
});
```

## Provider Configuration

### API Keys

Configure API keys in the configuration object.

```typescript
const llm = createLLM({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY
});
```

### Custom Base URLs

Override the default API endpoints for custom deployments (e.g., Azure OpenAI):

```typescript
const llm = createLLM({
  provider: "openai",
  openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
  openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT
});
```

### Loop Protection & Security Limits

Prevent runaway costs, infinite loops, and hanging requests by setting execution and timeout limits:

```typescript
const llm = createLLM({
  maxToolCalls: 5, // Stop after 5 sequential tool execution turns
  maxRetries: 2, // Retry network/server errors 2 times
  requestTimeout: 30000, // Timeout requests after 30 seconds (default)
  maxTokens: 4096 // Limit output to 4K tokens (default)
});
```

**Security Benefits:**

- **`maxToolCalls`**: Prevents infinite tool execution loops
- **`maxRetries`**: Prevents retry storms that could exhaust resources
- **`requestTimeout`**: Prevents hanging requests and DoS attacks
- **`maxTokens`**: Prevents excessive output generation and cost overruns

## Supported Configuration Keys

| Key                         | Description                         | Default                           |
| --------------------------- | ----------------------------------- | --------------------------------- |
| `openaiApiKey`              | OpenAI API key                      | `process.env.OPENAI_API_KEY`      |
| `openaiApiBase`             | OpenAI API base URL                 | `process.env.OPENAI_API_BASE`     |
| `anthropicApiKey`           | Anthropic API key                   | `process.env.ANTHROPIC_API_KEY`   |
| `anthropicApiBase`          | Anthropic API base URL              | `process.env.ANTHROPIC_API_BASE`  |
| `geminiApiKey`              | Google Gemini API key               | `process.env.GEMINI_API_KEY`      |
| `geminiApiBase`             | Gemini API base URL                 | `process.env.GEMINI_API_BASE`     |
| `deepseekApiKey`            | DeepSeek API key                    | `process.env.DEEPSEEK_API_KEY`    |
| `deepseekApiBase`           | DeepSeek API base URL               | `process.env.DEEPSEEK_API_BASE`   |
| `openrouterApiKey`          | OpenRouter API key                  | `process.env.OPENROUTER_API_KEY`  |
| `openrouterApiBase`         | OpenRouter API base URL             | `process.env.OPENROUTER_API_BASE` |
| `defaultChatModel`          | Default model for `.chat()`         | Provider default                  |
| `defaultTranscriptionModel` | Default model for `.transcribe()`   | Provider default                  |
| `defaultModerationModel`    | Default model for `.moderate()`     | Provider default                  |
| `defaultEmbeddingModel`     | Default model for `.embed()`        | Provider default                  |
| `maxToolCalls`              | Max sequential tool execution turns | `5`                               |
| `maxRetries`                | Max retries for provider errors     | `2`                               |
| `requestTimeout`            | Request timeout in milliseconds     | `30000` (30s)                     |
| `maxTokens`                 | Max output tokens per request       | `4096`                            |
| `retry`                     | Retry configuration (legacy)        | `{ attempts: 1, delayMs: 0 }`     |

## Inspecting Configuration

You can inspect the current internal configuration at any time.

```typescript
console.log(NodeLLM.config.openaiApiKey);
```

## Error Handling

Attempting to use an unconfigured provider will raise a clear error:

```typescript
// If API key is not set
const llm = createLLM({ provider: "openai" });
// Error: openaiApiKey is not set in config...
```

### Snapshotting & Instance Initialization

When you create an LLM instance (including the default `NodeLLM` export), it **snapshots** all relevant environment variables.

In the global `NodeLLM` instance, this initialization is **lazy**. It only snapshots `process.env` the first time you access a property or method (like `.chat()`). This makes it safe to use with `dotenv/config` or similar libraries in ESM, even if they are imported after the core library.

```typescript
// ✅ Safe in NodeLLM v1.6.0+: Initialized on first call
import { NodeLLM } from "@node-llm/core";
import "dotenv/config";

const chat = NodeLLM.chat(); // Snapshots environment NOW
```

## Best Practices

1. **Use dotenv for local development**:

   ```typescript
   import "dotenv/config";
   import { createLLM } from "@node-llm/core";

   const llm = createLLM({ provider: "openai" });
   ```

2. **Configure once at startup**:
   ```typescript
   // app.ts
   const llm = createLLM({
     openaiApiKey: process.env.OPENAI_API_KEY,
     anthropicApiKey: process.env.ANTHROPIC_API_KEY
   });
   ```

### Scoped Configuration (Isolation)

`NodeLLM` is a **frozen, immutable instance**. It cannot be mutated at runtime. This design ensures that configurations do not leak between parallel requests, making it safe for multi-tenant applications.

Use `createLLM()` or `.withProvider()` to create an **isolated context**.

#### 1. Isolated Provider State

Run multiple providers in parallel safely without any side effects:

```ts
const [gpt, claude] = await Promise.all([
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt)
]);
```

#### 2. Scoped Credentials

You can also pass a second argument to `withProvider` to override configuration keys (like API keys) for that specific instance only. This is useful for multi-tenant applications.

```ts
const userA = NodeLLM.withProvider("openai", {
  openaiApiKey: "USER_A_KEY"
});

const userB = NodeLLM.withProvider("openai", {
  openaiApiKey: "USER_B_KEY"
});

// These calls use different API keys simultaneously
const [resA, resB] = await Promise.all([
  userA.chat().ask("Hello from A"),
  userB.chat().ask("Hello from B")
]);
```

This ensures each parallel call uses the correct provider and credentials without interfering with others.
