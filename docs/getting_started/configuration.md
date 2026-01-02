---
layout: default
title: Configuration
nav_order: 3
parent: Getting Started
---

# Configuration Guide

`node-llm` uses a simple configuration object to set API keys and active providers.

## Quick Start

The simplest configuration sets your API keys and the active provider:

```typescript
import { LLM } from "@node-llm/core";

// Configure OpenAI
LLM.configure({
  provider: "openai",
  openaiApiKey: process.env.OPENAI_API_KEY,
});
```

That's it. `node-llm` uses sensible defaults for everything else.

## Switching Providers

You can switch providers at any time by calling `configure` again.

```typescript
// Switch to Anthropic
LLM.configure({
  provider: "anthropic",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});
```

## Provider Configuration

### API Keys

Configure API keys in the configuration object.

```typescript
LLM.configure({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
});
```

### Custom Base URLs

Override the default API endpoints for custom deployments (e.g., Azure OpenAI):

```typescript
LLM.configure({
  provider: "openai",
  openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
  openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT,
});
```

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

## Inspecting Configuration

You can inspect the current internal configuration at any time.

```typescript
console.log(LLM.config.openaiApiKey);
```

## Error Handling

Attempting to use an unconfigured provider will raise a clear error:

```typescript
// If API key is not set
LLM.configure({ provider: "openai" });
// Error: openaiApiKey is not set in config...
```

## Environment Variables

By default, `node-llm` automatically loads configuration from environment variables. You can override these programmatically:

```typescript
// Environment variable takes precedence initially
// OPENAI_API_KEY=sk-env-key

// Override programmatically
LLM.configure({
  openaiApiKey: "sk-programmatic-key" // This wins
});
```

## Best Practices

1. **Use dotenv for local development**:
   ```typescript
   import "dotenv/config";
   import { LLM } from "@node-llm/core";
   
   LLM.configure({ provider: "openai" });
   ```

2. **Configure once at startup**:
   ```typescript
   // app.ts
   LLM.configure({
     openaiApiKey: process.env.OPENAI_API_KEY,
     anthropicApiKey: process.env.ANTHROPIC_API_KEY
   });
   ```

3. **Switch providers dynamically**:
   ```typescript
   // Use OpenAI for one task
   LLM.configure({ provider: "openai" });
   const chat1 = LLM.chat("gpt-4o");
   
   // Switch to Anthropic for another
   LLM.configure({ provider: "anthropic" });
   const chat2 = LLM.chat("claude-3-5-sonnet-20241022");
   ```
