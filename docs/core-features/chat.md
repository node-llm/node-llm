---
layout: default
title: Chat
parent: Core Features
nav_order: 1
description: A unified interface for stateful conversations across all providers. Learn how to manage history, instructions, and lifecycle hooks.
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

`NodeLLM` provides a unified chat interface across all providers (OpenAI, Gemini, Anthropic). It normalizes the differences in their APIs, allowing you to use a single set of methods for interacting with them.

---

## Starting a Conversation

The core entry point is `NodeLLM.chat(model_id?, options?)`.

```ts
import "dotenv/config";
import { NodeLLM } from "@node-llm/core";

// 1. Get a chat instance
// (No setup required if NODELLM_PROVIDER is in env)
const chat = NodeLLM.chat("gpt-4o-mini");

// 2. Ask a question
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

---

## System Prompts (Instructions)

Guide the AI's behavior, personality, or constraints using system prompts. You can set this when creating the chat or update it later.

```ts
// Option 1: Set at initialization
const chat = llm.chat("gpt-4o", {
  systemPrompt: "You are a helpful assistant that answers in rhyming couplets."
});

// Option 2: Set or update later
chat.withInstructions("Now speak like a pirate.");

// Option 3: Standard Alias <span style="background-color: #0d47a1; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.6.0</span>
chat.system("You are a helpful assistant.");

await chat.ask("Hello");
// => "Ahoy matey! The seas are calm today."
```

---

## Manual History Management <span style="background-color: #0d47a1; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.6.0</span>

While NodeLLM handles history automatically during a session, you can manually inject messages into the conversation. This is especially useful for **Session Rehydration** from a database.

```ts
const chat = NodeLLM.chat("gpt-4o");

// Rehydrate previous turns from your DB
chat
  .add("user", "What is my name?")
  .add("assistant", "You told me your name is Alice.");

const response = await chat.ask("What did I just say?");
// => "You asked me what your name is."
```

The `.add()` method correctly isolates `system` and `developer` roles while maintaining chronological order for `user` and `assistant` messages.

---

## Custom HTTP Headers

Some providers offer beta features or require specific headers (like for observability proxies).

```ts
// Enable Anthropic's beta features
const chat = llm.chat("claude-3-5-sonnet").withRequestOptions({
  headers: {
    "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15"
  }
});

await chat.ask("Tell me about the weather");
```

---

## Raw Content Blocks (Advanced)

For advanced use cases like **Anthropic Prompt Caching**, you can pass provider-specific content blocks directly. `NodeLLM` attempts to pass array content through to the provider.

```ts
// Example: Anthropic Prompt Caching
const systemBlock = {
  type: "text",
  text: "You are a coding assistant. (Cached context...)",
  cache_control: { type: "ephemeral" }
};

const chat = llm.chat("claude-3-5-sonnet", {
  systemPrompt: systemBlock as any // Cast if strict types complain
});
```

---

## Working with Multiple Providers

### Isolation and Multi-Tenancy

`NodeLLM` is a **frozen, immutable instance**. It cannot be mutated at runtime. This design ensures that configurations (like API keys) do not leak between different parts of your application, making it safe for multi-tenant environments like SaaS or serverless functions.

If you need isolated configurations for different users or requests, use `createLLM()` or `NodeLLM.withProvider()`.

```ts
import { createLLM } from "@node-llm/core";

// Safe for multi-tenant apps
const userA = createLLM({ provider: "openai", openaiApiKey: "..." });
const userB = createLLM({ provider: "anthropic", anthropicApiKey: "..." });

await userA.chat().ask("Hello!"); // Uses User A's key
await userB.chat().ask("Hello!"); // Uses User B's key
```

### ⚡ Scoped Instances

Use `withProvider()` to create isolated instances with their own configuration. Each instance maintains separate state without affecting others.

```ts
// ✅ SAFE: Each instance is isolated
const tenant1 = NodeLLM.withProvider("openai", {
  openaiApiKey: tenant1Key,
  requestTimeout: 30000
});

const tenant2 = NodeLLM.withProvider("openai", {
  openaiApiKey: tenant2Key,
  requestTimeout: 60000
});

// No interference - each has its own config
await Promise.all([tenant1.chat("gpt-4o").ask(prompt), tenant2.chat("gpt-4o").ask(prompt)]);
```

**Multi-provider parallelism:**

```ts
const [gpt, claude, gemini] = await Promise.all([
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt),
  NodeLLM.withProvider("gemini").chat("gemini-2.0-flash").ask(prompt)
]);
```

**Per-request isolation in Express/Fastify:**

```ts
app.post("/chat", async (req, res) => {
  const userApiKey = req.user.openaiApiKey; // From database

  // Create isolated instance per request
  const llm = NodeLLM.withProvider("openai", {
    openaiApiKey: userApiKey
  });

  const response = await llm.chat("gpt-4o").ask(req.body.message);
  res.json(response);
});
```

---

## Temperature & Creativity

Adjust the randomness of the model's responses using `.withTemperature(0.0 - 1.0)`.

```ts
// Deterministic / Factual (Low Temperature)
const factual = NodeLLM.chat("gpt-4o").withTemperature(0.0);

// Creative / Random (High Temperature)
const creative = NodeLLM.chat("gpt-4o").withTemperature(0.9);
```

---

## Lifecycle Events <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">Enhanced in v1.5.0</span>

Hook into the chat lifecycle for logging, UI updates, audit trails, or debugging.

```ts
chat
  .onNewMessage(() => console.log("AI started typing..."))
  .onToolCallStart((call) => console.log(`Starting tool: ${call.function.name}`))
  .onToolCallEnd((call, res) => console.log(`Tool ${call.id} finished with: ${res}`))
  .onToolCallError((call, err) =>
    console.error(`Tool ${call.function.name} failed: ${err.message}`)
  )
  .onEndMessage((response) => {
    console.log(`Finished. Total tokens: ${response.total_tokens}`);
  });

await chat.ask("What's the weather?");
```

---

## 🛡️ Content Policy Hooks

NodeLLM allows you to plug in custom security and compliance logic through asynchronous hooks. This is useful for PII detection, redaction, and enterprise moderation policies.

- **`beforeRequest(handler)`**: Analyze or modify the message history before it is sent to the provider.
- **`afterResponse(handler)`**: Analyze or modify the AI's response before it is returned to your application.

```ts
chat
  .beforeRequest(async (messages) => {
    // Redact SSNs from user input
    return messages.map((m) => ({
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

---

## Retry Logic & Safety 🛡️

By default, `NodeLLM` handles network instabilities or temporary provider errors (like 500s or 429 Rate Limits) by retrying the request.

- **Default Retries**: 2 retries (3 total attempts).
- **Request Timeout**: 30 seconds (prevents hanging requests).
- **Loop Guard**: Tool calling is limited to 5 turns to prevent infinite loops.

You can configure these limits globally:

```ts
const llm = createLLM({
  maxRetries: 3, // Increase retries for unstable connections
  maxToolCalls: 10, // Allow deeper tool calling sequences
  requestTimeout: 60000 // 60 second timeout for long-running requests
});
```

Or override per-request:

```ts
// Long-running task with extended timeout
await chat.ask("Analyze this large dataset", {
  requestTimeout: 120000 // 2 minutes
});
```

### Request Cancellation <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.3+</span>

You can cancel long-running requests using the standard `AbortController` API. This is useful for interactive UIs where users might navigate away or click "Stop".

```ts
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const response = await chat.ask("Write a very long essay...", {
    signal: controller.signal
  });
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was cancelled");
  }
}
```

The signal is propagated through all tool-calling turns, so even multi-step agentic workflows can be cancelled cleanly.

See the [Configuration Guide](/getting-started/configuration) for more details.

---

## 🧱 Smart Context Isolation

NodeLLM provides **Zero-Config Context Isolation** to ensure maximum instruction following and security.

Inspired by modern LLM architectures (like OpenAI's Developer Role), NodeLLM internally separates your system instructions from the conversation history. This prevents "instruction drift" as the conversation grows and provides a strong layer of protection against prompt injection.

### How It Works

- **Implicit Untangling**: If you pass a mixed array of messages to the Chat constructor, NodeLLM automatically identifies and isolates system-level instructions.
- **Dynamic Role Mapping**: On the official OpenAI API, instructions for modern models (`gpt-4o`, `o1`, `o3`) are automatically promoted to the high-privilege `developer` role.
- **Safe Fallbacks**: For older models or local providers (like Ollama or DeepSeek), NodeLLM safely maps instructions back to the standard `system` role to ensure perfect compatibility.

This behavior is **enabled by default** for all chats.
