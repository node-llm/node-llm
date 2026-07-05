---
layout: default
title: Introduction
nav_order: 1
permalink: /docs/intro
---

<p align="left">
  <img src="/assets/images/logo.png" alt="NodeLLM" width="200" />
</p>

# One API for every LLM provider

[![npm version](https://badge.fury.io/js/@node-llm%2Fcore.svg)](https://www.npmjs.com/package/@node-llm/core)
[![GitHub Repository](https://img.shields.io/badge/GitHub-node--llm-blue?logo=github)](https://github.com/node-llm/node-llm)
[![CI](https://github.com/node-llm/node-llm/actions/workflows/cicd.yml/badge.svg)](https://github.com/node-llm/node-llm/actions/workflows/cicd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**NodeLLM is the backend runtime for building reliable, testable, provider-agnostic AI systems in Node.js.** Nine providers, one predictable API — with normalized streaming, automatic tool loops, deterministic testing, and first-class observability built in.

```bash
npm install @node-llm/core
```

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "anthropic" });
const chat = llm.chat("claude-sonnet-5");

// Same code works for OpenAI, Gemini, Bedrock, Ollama, and more —
// switch providers with config, not a rewrite.
const response = await chat.ask("Explain event-driven architecture");
console.log(response.content);

// Streaming is a standard AsyncIterator on every provider
for await (const chunk of chat.stream("Now explain it to a five-year-old")) {
  process.stdout.write(chunk.content);
}
```

<p class="fs-4 text-grey-dk-000 mb-3">Unified support for</p>
<div class="provider-icons">
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" alt="OpenAI">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai-text.svg" alt="">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" alt="Anthropic">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" alt="Gemini">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-text.svg" alt="" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" alt="DeepSeek">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-text.svg" alt="" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" alt="OpenRouter">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter-text.svg" alt="">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" alt="Ollama">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama-text.svg" alt="">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-color.svg" alt="Bedrock">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-text.svg" alt="" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/xai.svg" alt="xAI">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/xai-text.svg" alt="" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/mistral-color.svg" alt="Mistral">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/mistral-text.svg" alt="" class="logo-small">
  </div>
</div>

[Quick Start](/getting-started/quick-start){: .btn .btn-primary .mr-2 }
[View on GitHub](https://github.com/node-llm/node-llm){: .btn }

---

## Why NodeLLM?

Most AI SDKs optimize for getting a response to the user fast (frontend/edge). NodeLLM optimizes for **system reliability** — it's built for API servers, workers, cron jobs, and agents, where the hard problems are infrastructure problems:

- **Decoupling** — isolate business logic from the rapid churn of model versions. Switch providers via config, not code rewrites.
- **Production safety** — timeouts that protect the event loop, circuit breaking, redaction, and audit logging.
- **Determinism** — record/replay your AI interactions with VCR cassettes; unit-test agents with a fluent mocker.
- **One mental model** — identical behavior for streaming, tool loops, structured output, and vision across every provider.

| Feature            | NodeLLM                       | Official SDKs               | Impact                    |
| :----------------- | :---------------------------- | :-------------------------- | :------------------------ |
| **Provider Logic** | Transparently handled         | Exposed to your code        | **Low coupling**          |
| **Streaming**      | Standard `AsyncIterator`      | Vendor-specific events      | **Predictable data flow** |
| **Tool Loops**     | Automated recursion           | Manual implementation       | **Less boilerplate**      |
| **Files/Vision**   | Intelligent path/URL handling | Base64/Buffer management    | **Cleaner service layer** |
| **Configuration**  | Centralized & global          | Per-instance initialization | **Easier lifecycle mgmt** |

NodeLLM is **not** a thin wrapper around vendor SDKs, a UI streaming library like Vercel AI SDK, or a prompt-engineering framework. It sits between your app and the providers, and owns the messy middle:

```text
                Your App
                   ↓
NodeLLM (Unified API + State + Security)
                   ↓
 OpenAI | Anthropic | Gemini | Bedrock | xAI | Ollama | ...
```

---

## What you can build with it

### Auto-executing tools

Define a tool once with the class-based DSL; NodeLLM runs the recursive execution loop for you — no manual "check for tool_calls, execute, re-send" plumbing.

```ts
import { Tool, z } from "@node-llm/core";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get current weather";
  schema = z.object({ loc: z.string() });

  async handler({ loc }) {
    return `Sunny in ${loc}`;
  }
}

await chat.withTool(WeatherTool).ask("Weather in Tokyo?");
```

### Model Context Protocol (MCP)

Connect to external data sources and tools over the industry-standard [MCP](/mcp.html). Discover tools, resources, and prompt templates from any server dynamically.

```ts
import { MCP } from "@node-llm/mcp";

const mcp = (await MCP.connect({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"]
})).onLog(e => console.log(e.message));

const tools = await mcp.discoverTools();
await chat.withTools(tools).ask("List my repos");
```

### Extended thinking

Direct, unified access to the reasoning of models like Claude, DeepSeek R1, and OpenAI's o-series — one interface, every provider.

```ts
const res = await chat
  .withThinking({ budget: 16000 })
  .ask("Solve this logical puzzle");

console.log(res.thinking.text); // Full chain-of-thought
```

### Persistence with your database

Track chat history, tool executions, and API metrics automatically with [@node-llm/orm](/orm/prisma) — Postgres, MySQL, or SQLite via Prisma, including extended-thinking persistence.

```ts
import { createChat } from "@node-llm/orm/prisma";

const chat = await createChat(prisma, llm, { model: "claude-sonnet-5" });
await chat.withThinking({ budget: 16000 }).ask("Develop a strategy");
```

### Deterministic testing

No more flaky, expensive AI tests. Record real interactions once with **VCR cassettes**, replay them forever; mock tool-calling flows with the **fluent mocker** — powered by [@node-llm/testing](/core-features/testing).

```ts
import { vcr, Mocker } from "@node-llm/testing";

// Integration tests: record once, replay deterministically
await vcr.useCassette("pricing_flow", async () => {
  const res = await chat.ask("How much?");
  expect(res.content).toContain("$20/mo");
});

// Unit tests: no network at all
const mock = new Mocker()
  .chat("Next step?")
  .respond("Login User")
  .callsTool("getCurrentUser", { id: 1 });
```

### Multi-provider parallelism

Run providers side by side with isolated contexts — no global-config side effects.

```ts
const [gpt, claude] = await Promise.all([
  NodeLLM.withProvider("openai").chat("gpt-5").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-sonnet-5").ask(prompt)
]);
```

### Images, embeddings, audio, and more

The same `llm` handle covers [image generation](/core-features/image-generation.html), [embeddings](/core-features/embeddings.html), [transcription](/core-features/audio-transcription.html), [moderation](/core-features/moderation.html), and [structured output](/core-features/structured_output.html) — see the full [Core Features](/core-features) section.

### Security & compliance

Plug custom security, PII detection, and compliance logic into asynchronous [`beforeRequest` and `afterResponse` hooks](/advanced/security) — enforce policy at the framework level, not per call site.

---

## Supported providers

| Provider                                                                                                                             | Supported Features                                                                             |
| :------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> **OpenAI**            | Chat, Streaming, Tools, Vision, Audio, Images, Transcription, Reasoning, Smart Developer Role  |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> **Anthropic** | Chat, Streaming, Tools, Vision, PDF, Structured Output, Extended Thinking, Prompt Caching      |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> **Gemini**      | Chat, Streaming, Tools, Vision, Audio, Video, Embeddings                                       |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> **DeepSeek**  | Chat, Extended Thinking (R1), Tools, Streaming                                                 |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-color.svg" height="18"> **Bedrock**    | Chat, Streaming, Tools, Image Gen, Embeddings, Prompt Caching                                  |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" height="18"> **OpenRouter**    | Aggregator: Chat, Streaming, Tools, Vision, Embeddings, Reasoning                              |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/xai.svg" height="18"> **xAI**                  | Chat, Streaming, Tools, Vision, Images, Reasoning                                              |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="18"> **Ollama**            | Local Inference: Chat, Streaming, Tools, Vision, Embeddings                                    |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/mistral-color.svg" height="18"> **Mistral**    | Chat, Streaming, Tools, Vision, Embeddings, Transcription, Moderation, Reasoning               |

The [model registry](/available-models) tracks current model IDs, capabilities, and pricing across all providers — kept in sync automatically.

---

## Next steps

- [Quick Start](/getting-started/quick-start) — chat, images, and embeddings in 5 minutes
- [Configuration](/getting-started/configuration) — API keys, defaults, and per-request overrides
- [Tool Calling](/core-features/tools) — give your AI the ability to execute code
- [Testing](/core-features/testing) — reliable, zero-cost integration tests
- [Examples](/examples.html) — complete, runnable scripts for every feature

---

## Contributing & credits

We welcome contributions — see the [Contributing Guide](https://github.com/node-llm/node-llm/blob/main/CONTRIBUTING.md) to get started.

NodeLLM is heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/). 🫶
