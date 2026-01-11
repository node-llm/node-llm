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

## Lifecycle Events <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">Enhanced in v1.5.0</span>

Hook into the chat lifecycle for logging, UI updates, audit trails, or debugging.

```ts
chat
  .onNewMessage(() => console.log("AI started typing..."))
  .onToolCallStart((call) => console.log(`Starting tool: ${call.function.name}`))
  .onToolCallEnd((call, res) => console.log(`Tool ${call.id} finished with: ${res}`))
  .onToolCallError((call, err) => console.error(`Tool ${call.function.name} failed: ${err.message}`))
  .onEndMessage((response) => {
    console.log(`Finished. Total tokens: ${response.total_tokens}`);
  });

await chat.ask("What's the weather?");
```

## 🛡️ Content Policy Hooks

NodeLLM allows you to plug in custom security and compliance logic through asynchronous hooks. This is useful for PII detection, redaction, and enterprise moderation policies.

- **`beforeRequest(handler)`**: Analyze or modify the message history before it is sent to the provider.
- **`afterResponse(handler)`**: Analyze or modify the AI's response before it is returned to your application.

```ts
chat
  .beforeRequest(async (messages) => {
    // Redact SSNs from user input
    return messages.map(m => ({
      ...m,
      content: m.content.replace(/\d{3}-\d{2}-\d{4}/g, "[REDACTED]")
    }));
  })
  .afterResponse(async (response) => {
    // Block responses containing prohibited words
    if (response.content.includes("Prohibited")) {
       throw new Error("Compliance Violation");
    }
  });
```

## Retry Logic & Safety 🛡️

By default, `NodeLLM` handles network instabilities or temporary provider errors (like 500s or 429 Rate Limits) by retrying the request.

*   **Default Retries**: 2 retries (3 total attempts).
*   **Request Timeout**: 30 seconds (prevents hanging requests).
*   **Loop Guard**: Tool calling is limited to 5 turns to prevent infinite loops.

You can configure these limits globally:

```ts
NodeLLM.configure({
  maxRetries: 3,        // Increase retries for unstable connections
  maxToolCalls: 10,     // Allow deeper tool calling sequences
  requestTimeout: 60000 // 60 second timeout for long-running requests
});
```

Or override per-request:

```ts
// Long-running task with extended timeout
await chat.ask("Analyze this large dataset", { 
  requestTimeout: 120000  // 2 minutes
});
```

See the [Configuration Guide](/getting-started/configuration) for more details.
 
## 🧱 Smart Context Isolation
 
NodeLLM provides **Zero-Config Context Isolation** to ensure maximum instruction following and security. 
 
Inspired by modern LLM architectures (like OpenAI's Developer Role), NodeLLM internally separates your system instructions from the conversation history. This prevents "instruction drift" as the conversation grows and provides a strong layer of protection against prompt injection.
 
### How it works:
- **Implicit Untangling**: If you pass a mixed array of messages to the Chat constructor, NodeLLM automatically identifies and isolates system-level instructions.
- **Dynamic Role Mapping**: On the official OpenAI API, instructions for modern models (`gpt-4o`, `o1`, `o3`) are automatically promoted to the high-privilege `developer` role.
- **Safe Fallbacks**: For older models or local providers (like Ollama or DeepSeek), NodeLLM safely maps instructions back to the standard `system` role to ensure perfect compatibility.
 
This behavior is **enabled by default** for all chats.
 
## Next Steps

- [Multi-modal Capabilities](/core-features/multimodal.html) (Images, Audio, Files)
- [Structured Output](/core-features/structured_output.html) (JSON Schemas, Zod)
- [Tool Calling](/core-features/tools.html)
- [Reasoning](/core-features/reasoning.html) (DeepSeek R1, OpenAI o1/o3)
- [Security & Compliance](/advanced/security.html)
