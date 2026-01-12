---
layout: default
title: Configuration
nav_order: 3
parent: Getting Started
permalink: /getting-started/configuration
---

# Configuration Guide

`NodeLLM` uses a simple configuration object to set API keys and active providers.

## Quick Start

The simplest configuration sets your API keys and the active provider:

```typescript
import { NodeLLM } from "@node-llm/core";

// Configure OpenAI
NodeLLM.configure({
  provider: "openai",
  openaiApiKey: process.env.OPENAI_API_KEY,
});
```

That's it. `NodeLLM` uses sensible defaults for everything else.

## Switching Providers

You can switch providers at any time by calling `configure` again.

```typescript
// Switch to Anthropic
NodeLLM.configure({
  provider: "anthropic",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});
```

## Provider Configuration

### API Keys

Configure API keys in the configuration object.

```typescript
NodeLLM.configure({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
});
```

### Custom Base URLs

Override the default API endpoints for custom deployments (e.g., Azure OpenAI):

```typescript
NodeLLM.configure({
  provider: "openai",
  openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
  openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT,
});
```

### Loop Protection & Security Limits

Prevent runaway costs, infinite loops, and hanging requests by setting execution and timeout limits:

```typescript
NodeLLM.configure({
  maxToolCalls: 5,      // Stop after 5 sequential tool execution turns
  maxRetries: 2,        // Retry network/server errors 2 times
  requestTimeout: 30000,// Timeout requests after 30 seconds (default)
  maxTokens: 4096       // Limit output to 4K tokens (default)
});
```

**Security Benefits:**
- **`maxToolCalls`**: Prevents infinite tool execution loops
- **`maxRetries`**: Prevents retry storms that could exhaust resources
- **`requestTimeout`**: Prevents hanging requests and DoS attacks
- **`maxTokens`**: Prevents excessive output generation and cost overruns

## Supported Configuration Keys

| Key | Description | Default |
|-----|-------------|---------|
| `openaiApiKey` | OpenAI API key | `process.env.OPENAI_API_KEY` |
| `openaiApiBase` | OpenAI API base URL | `process.env.OPENAI_API_BASE` |
| `anthropicApiKey` | Anthropic API key | `process.env.ANTHROPIC_API_KEY` |
| `anthropicApiBase` | Anthropic API base URL | `process.env.ANTHROPIC_API_BASE` |
| `geminiApiKey` | Google Gemini API key | `process.env.GEMINI_API_KEY` |
| `geminiApiBase` | Gemini API base URL | `process.env.GEMINI_API_BASE` |
| `deepseekApiKey` | DeepSeek API key | `process.env.DEEPSEEK_API_KEY` |
| `deepseekApiBase` | DeepSeek API base URL | `process.env.DEEPSEEK_API_BASE` |
| `openrouterApiKey` | OpenRouter API key | `process.env.OPENROUTER_API_KEY` |
| `openrouterApiBase` | OpenRouter API base URL | `process.env.OPENROUTER_API_BASE` |
| `defaultChatModel` | Default model for `.chat()` | Provider default |
| `defaultTranscriptionModel` | Default model for `.transcribe()` | Provider default |
| `defaultModerationModel` | Default model for `.moderate()` | Provider default |
| `defaultEmbeddingModel` | Default model for `.embed()` | Provider default |
| `maxToolCalls` | Max sequential tool execution turns | `5` |
| `maxRetries` | Max retries for provider errors | `2` |
| `requestTimeout` | Request timeout in milliseconds | `30000` (30s) |
| `maxTokens` | Max output tokens per request | `4096` |
| `retry` | Retry configuration (legacy) | `{ attempts: 1, delayMs: 0 }` |

## Inspecting Configuration

You can inspect the current internal configuration at any time.

```typescript
console.log(NodeLLM.config.openaiApiKey);
```

## Error Handling

Attempting to use an unconfigured provider will raise a clear error:

```typescript
// If API key is not set
NodeLLM.configure({ provider: "openai" });
// Error: openaiApiKey is not set in config...
```

## Environment Variables

By default, `NodeLLM` automatically loads configuration from environment variables. You can override these programmatically:

```typescript
// Environment variable takes precedence initially
// OPENAI_API_KEY=sk-env-key

// Override programmatically
NodeLLM.configure({
  openaiApiKey: "sk-programmatic-key" // This wins
});
```

## Best Practices

1. **Use dotenv for local development**:
   ```typescript
   import "dotenv/config";
   import { NodeLLM } from "@node-llm/core";
   
   NodeLLM.configure({ provider: "openai" });
   ```

2. **Configure once at startup**:
   ```typescript
   // app.ts
   NodeLLM.configure({
     openaiApiKey: process.env.OPENAI_API_KEY,
     anthropicApiKey: process.env.ANTHROPIC_API_KEY
   });
   ```

### Scoped Configuration (Parallel Execution)

By default, `NodeLLM` is a singleton. If you need to use multiple providers in parallel, or if you need to use different API keys for the same provider, calling `NodeLLM.configure()` concurrently can lead to race conditions.

Use `.withProvider()` to create a **scoped context**. This returns an isolated instance of `NodeLLM` that inherits your global configuration but allows for local overrides.

#### 1. Isolated Provider State
Run multiple providers in parallel safely without global configuration side effects:

```ts
const [gpt, claude] = await Promise.all([
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt),
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
  userB.chat().ask("Hello from B"),
]);
```

This ensures each parallel call uses the correct provider and credentials without interfering with others.

