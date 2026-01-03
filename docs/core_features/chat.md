---
layout: default
title: Chat
parent: Core Features
nav_order: 1
---

# Chat

`node-llm` provides a unified chat interface across all providers (OpenAI, Gemini, Anthropic). It normalizes the differences in their APIs, allowing you to use a single set of methods for interacting with them.

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

For advanced use cases like **Anthropic Prompt Caching**, you can pass provider-specific content blocks directly. `node-llm` attempts to pass array content through to the provider.

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

## Working with Different Models
To switch providers, you must re-configure the `NodeLLM` instance.

```ts
// OpenAI
NodeLLM.configure({ provider: "openai" });
const gpt = NodeLLM.chat("gpt-4o");

// Anthropic
NodeLLM.configure({ provider: "anthropic" });
const claude = NodeLLM.chat("claude-3-5-sonnet-20241022");
```

For advanced multi-provider applications, it is recommended to manage separate `LLMCore` instances or re-configure as needed before requests.

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

- [Multi-modal Capabilities](./multimodal) (Images, Audio, Files)
- [Structured Output](./structured-output) (JSON Schemas, Zod)
- [Tool Calling](./tools)
- [Reasoning](./reasoning) (DeepSeek R1, OpenAI o1/o3)
