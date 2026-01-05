---
layout: default
title: Chat
parent: Core Features
nav_order: 1
---

# Chat

`NodeLLM` provides a unified chat interface across all providers (OpenAI, Gemini, Anthropic). It normalizes the differences in their APIs, allowing you to use a single set of methods for interacting with them.

## Starting a Conversation

The core entry point is `NodeLLM.chat(model_id, options?)`.

```ts
import { NodeLLM } from "@node-llm/core";

// Create a chat instance
const chat = NodeLLM.chat("gpt-4o-mini");

// Ask a question
const response = await chat.ask("What is the capital of France?");

console.log(response.content); // "The capital of France is Paris."
```

### Continuing the Conversation

The `chat` object maintains a history of the conversation, so you can ask follow-up questions naturally.

```ts
await chat.ask("What is the capital of France?");
// => "Paris"

await chat.ask("What is the population there?");
// => "The population of Paris is approximately..."
```

## System Prompts (Instructions)

Guide the AI's behavior, personality, or constraints using system prompts. You can set this when creating the chat or update it later.

```ts
// Option 1: Set at initialization
const chat = NodeLLM.chat("gpt-4o", {
  systemPrompt: "You are a helpful assistant that answers in rhyming couplets."
});

// Option 2: Set or update later
chat.withInstructions("Now speak like a pirate.");

await chat.ask("Hello");
// => "Ahoy matey! The seas are calm today."
```

## Custom HTTP Headers

Some providers offer beta features or require specific headers (like for observability proxies).

```ts
// Enable Anthropic's beta features
const chat = NodeLLM.chat("claude-3-5-sonnet")
  .withRequestOptions({
    headers: {
      "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15"
    }
  });

await chat.ask("Tell me about the weather");
```

## Raw Content Blocks (Advanced)

For advanced use cases like **Anthropic Prompt Caching**, you can pass provider-specific content blocks directly. `NodeLLM` attempts to pass array content through to the provider.

```ts
// Example: Anthropic Prompt Caching
const systemBlock = {
  type: "text",
  text: "You are a coding assistant. (Cached context...)",
  cache_control: { type: "ephemeral" }
};

const chat = NodeLLM.chat("claude-3-5-sonnet", {
  systemPrompt: systemBlock as any // Cast if strict types complain
});
```

## Working with Multiple Providers

You can switch providers globally or use scoped instances for parallel execution without side effects.

### Global Switching
Global configuration affects all subsequent calls.

```ts
// OpenAI
NodeLLM.configure({ provider: "openai" });
const gpt = NodeLLM.chat("gpt-4o");

// Switch to Anthropic
NodeLLM.configure({ provider: "anthropic" });
const claude = NodeLLM.chat("claude-3-5-sonnet");
```

### ⚡ Scoped Parallelism (Recommended)
Run multiple providers in parallel safely without global configuration side effects using isolated contexts via `withProvider`.

```ts
const [gpt, claude] = await Promise.all([
  // Each call branches off into its own isolated context
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt),
]);
```

## Temperature & Creativity

Adjust the randomness of the model's responses using `.withTemperature(0.0 - 1.0)`.

```ts
// Deterministic / Factual (Low Temperature)
const factual = NodeLLM.chat("gpt-4o").withTemperature(0.0);

// Creative / Random (High Temperature)
const creative = NodeLLM.chat("gpt-4o").withTemperature(0.9);
```

## Lifecycle Events

Hook into the chat lifecycle for logging, UI updates, audit trails, or debugging.

```ts
chat
  .onNewMessage(() => console.log("AI started typing..."))
  .onToolCall((tool) => console.log(`Calling tool: ${tool.function.name}`))
  .onToolResult((result) => console.log(`Tool result: ${result}`))
  .onEndMessage((response) => {
    console.log(`Finished. Total tokens: ${response.total_tokens}`);
  });

await chat.ask("What's the weather?");
```

## Next Steps

- [Multi-modal Capabilities](/core-features/multimodal.html) (Images, Audio, Files)
- [Structured Output](/core-features/structured_output.html) (JSON Schemas, Zod)
- [Tool Calling](/core-features/tools.html)
- [Reasoning](/core-features/reasoning.html) (DeepSeek R1, OpenAI o1/o3)
