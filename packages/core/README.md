<p align="left">
  <a href="https://node-llm.eshaiju.com/">
    <img src="https://github.com/node-llm/node-llm/raw/main/docs/assets/images/logo.jpg" alt="NodeLLM logo" width="300" />
  </a>
</p>

# NodeLLM

**An opinionated architectural layer for integrating Large Language Models in Node.js.**

**Provider-agnostic by design.**

Most LLM SDKs **tightly couple** your application to vendors, APIs, and churn. NodeLLM provides a unified, production-oriented API for interacting with over 540+ models across multiple providers (OpenAI, Gemini, Anthropic, DeepSeek, OpenRouter, Ollama, etc.) without the SDK fatigue.

<p align="left">
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai-text.svg" height="22" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="18" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-text.svg" height="20" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-text.svg" height="20" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter-text.svg" height="22" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama-text.svg" height="18" />
</p>

<br/>

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/package/@node-llm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 🛑 What NodeLLM is NOT

NodeLLM represents a clear architectural boundary between your system and LLM vendors.

NodeLLM is **NOT**:
 - A wrapper around a single provider SDK (like `openai` or `@google/generative-ai`)
 - A prompt-engineering framework
 - An agent playground or experimental toy

---

## 🏗️ Why NodeLLM?

Most AI integrations today are provider-specific, SDK-driven, and leaky at abstraction boundaries. This creates long-term architectural risk. **LLMs should be treated as infrastructure**, and NodeLLM exists to help you integrate them without vendor lock-in.

NodeLLM exists to solve **architectural problems**, not just provide API access. It is the core architectural layer for LLMs in the Node.js ecosystem.

### Strategic Goals
- **Provider Isolation**: Decouple your services from vendor SDKs.
- **Production-Ready**: Native support for streaming, retries, and unified error handling.
- **Predictable API**: Consistent behavior for Tools, Vision, and Structured Outputs across all models.

---

## ⚡ The Architectural Path

```ts
import { NodeLLM } from "@node-llm/core";

// 1. Configure once
NodeLLM.configure({ provider: "openai" });

// 2. Chat (High-level request/response)
const chat = NodeLLM.chat("gpt-4o");
const response = await chat.ask("Explain event-driven architecture");
console.log(response.content);

// 3. Streaming (Standard AsyncIterator)
for await (const chunk of chat.stream("Explain event-driven architecture")) {
  process.stdout.write(chunk.content);
}
```


---

## 🔧 Strategic Configuration

NodeLLM provides a flexible configuration system designed for enterprise usage:

```ts
// Recommended for multi-provider pipelines
NodeLLM.configure((config) => {
  config.openaiApiKey = process.env.OPENAI_API_KEY;
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  config.ollamaApiBase = process.env.OLLAMA_API_BASE;
});

// Switch providers at the framework level
NodeLLM.configure({ provider: "anthropic" });

// Support for Custom Endpoints (e.g., Azure or LocalAI)
NodeLLM.configure({
  openaiApiKey: process.env.AZURE_KEY,
  openaiApiBase: "https://your-resource.openai.azure.com/openai/deployments/...",
});
```

**[Full Configuration Guide →](https://node-llm.eshaiju.com/getting-started/configuration)**

---

---

## 🔮 Capabilities

### 💬 Unified Chat
Stop rewriting code for every provider. `NodeLLM` normalizes inputs and outputs into a single, predictable mental model.
```ts
const chat = NodeLLM.chat(); // Defaults to GPT-4o
await chat.ask("Hello world");
```

### 👁️ Smart Vision & Files
Pass images, PDFs, or audio files directly. We handle the heavy lifting: fetching remote URLs, base64 encoding, and MIME type mapping.
```ts
await chat.ask("Analyze this interface", { 
  files: ["./screenshot.png", "https://example.com/spec.pdf"] 
});
```

### 🛠️ Auto-Executing Tools
Define tools once;`NodeLLM` manages the recursive execution loop for you, keeping your controller logic clean. **Works seamlessly with both regular chat and streaming!**

```ts
import { Tool, z } from "@node-llm/core";

// Class-based DSL
class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get current weather";
  schema = z.object({ location: z.string() });

  async handler({ location }) { 
    return `Sunny in ${location}`; 
  }
}

// Now the model can use it automatically
await chat.withTool(WeatherTool).ask("What's the weather in Tokyo?");
```

### 🛡️ Loop Protection & Resource Limits
Prevent runaway costs, infinite loops, and hanging requests with comprehensive protection against resource exhaustion.

NodeLLM provides **defense-in-depth** security that you can configure globally or per-request:

```ts
// 1. Global config
NodeLLM.configure({ 
  requestTimeout: 30000, // Timeout requests after 30 seconds (default)
  maxToolCalls: 5,       // Stop after 5 sequential tool execution turns
  maxRetries: 2,         // Retry provider-level errors up to 2 times
  maxTokens: 4096        // Limit output to 4K tokens (default)
});

// 2. Per request override
await chat.ask("Deep search task", { 
  requestTimeout: 120000, // 2 minutes for this request
  maxToolCalls: 10,
  maxTokens: 8192         // 8K tokens for this request
});
```

**Security Benefits:**
- **`requestTimeout`**: Prevents DoS attacks and hanging requests
- **`maxToolCalls`**: Prevents infinite tool execution loops
- **`maxRetries`**: Prevents retry storms during outages
- **`maxTokens`**: Prevents excessive output and cost overruns

### 🔍 Comprehensive Debug Logging
Enable detailed logging for all API requests and responses across every feature and provider:
```ts
// Set environment variable
process.env.NODELLM_DEBUG = "true";

// Now see detailed logs for every API call:
// [NodeLLM] [OpenAI] Request: POST https://api.openai.com/v1/chat/completions
// { "model": "gpt-4o", "messages": [...] }
// [NodeLLM] [OpenAI] Response: 200 OK
// { "id": "chatcmpl-123", ... }
```
**Covers:** Chat, Streaming, Images, Embeddings, Transcription, Moderation - across all providers!

### 🛡️ Content Policy Hooks
NodeLLM provides pluggable hooks to implement custom security, compliance, and moderation logic. Instead of hard-coded rules, you can inject your own policies at the edge.

- **`beforeRequest()`**: Intercept and modify messages before they hit the LLM (e.g., PII detection/redaction).
- **`afterResponse()`**: Process the final response before it returns to your code (e.g., output masking or compliance checks).

```ts
chat
  .beforeRequest(async (messages) => {
    // Detect PII and redact
    return redactSSN(messages);
  })
  .afterResponse(async (response) => {
    // Ensure output compliance
    return response.withContent(maskSensitiveData(response.content));
  });
```

### 🧱 Smart Context Isolation
Stop worrying about prompt injection or instruction drift. NodeLLM automatically separates system instructions from the conversation history, providing a higher level of protection and strictness.

- **Zero-Config Security**: Enabled by default for all chats. No special flags required.
- **Smart Model Mapping**: Automatically uses OpenAI's modern `developer` role for compatible models (GPT-4o, o1, o3) while safely falling back to the standard `system` role for older or local models (Ollama, DeepSeek, etc.).
- **Universal Context**: Instructions stay separated internally, ensuring they are always prioritized by the model and never accidentally overridden by user messages.
- **Provider Agnostic**: Write instructions once; NodeLLM handles the specific role requirements for every major provider (OpenAI, Anthropic, Gemini).

### 🔍 Observability & Tool Auditing
For enterprise compliance, NodeLLM provides deep visibility into the tool execution lifecycle. You can monitor, log, and audit every step of a tool's execution.

```ts
chat
  .onToolCallStart((call) => log(`Starting tool: ${call.function.name}`))
  .onToolCallEnd((call, res) => log(`Tool ${call.id} finished with: ${res}`))
  .onToolCallError((call, err) => alert(`Tool ${call.function.name} failed: ${err.message}`));
```

### ✨ Structured Output
Get type-safe, validated JSON back using **Zod** schemas.
```ts
import { z } from "@node-llm/core";
const Product = z.object({ name: z.string(), price: z.number() });

const res = await chat.withSchema(Product).ask("Generate a gadget");
console.log(res.parsed.name); // Full type-safety
```

### 🎨 Image Generation
```ts
await NodeLLM.paint("A cyberpunk city in rain");
```

### 🎤 Audio Transcription
```ts
await NodeLLM.transcribe("meeting-recording.wav");
```

### ⚡ Scoped Parallelism
Run multiple providers in parallel safely without global configuration side effects using isolated contexts.
```ts
const [gpt, claude] = await Promise.all([
  // Each call branch off into its own isolated context
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt),
]);
```

### 🧠 Deep Reasoning
Direct access to the thought process of models like **DeepSeek R1** or **OpenAI o1/o3** using the `.reasoning` field.
```ts
const res = await NodeLLM.chat("deepseek-reasoner").ask("Solve this logical puzzle");
console.log(res.reasoning); // Chain-of-thought
```

---

## 🚀 Why use this over official SDKs?

| Feature | NodeLLM | Official SDKs | Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Provider Logic** | Transparently Handled | Exposed to your code | **Low Coupling** |
| **Streaming** | Standard `AsyncIterator` | Vendor-specific Events | **Predictable Data Flow** |
| **Streaming + Tools** | Automated Execution | Manual implementation | **Seamless UX** |
| **Tool Loops** | Automated Recursion | Manual implementation | **Reduced Boilerplate** |
| **Files/Vision** | Intelligent Path/URL handling | Base64/Buffer management | **Cleaner Service Layer** |
| **Configuration** | Centralized & Global | Per-instance initialization | **Easier Lifecycle Mgmt** |

---

## 📋 Supported Providers

| Provider | Supported Features |
| :--- | :--- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> **OpenAI** | Chat, **Streaming + Tools**, Vision, Audio, Images, Transcription, **Reasoning**, **Smart Developer Role** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> **Gemini** | Chat, **Streaming + Tools**, Vision, Audio, Video, Embeddings |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> **Anthropic** | Chat, **Streaming + Tools**, Vision, PDF, Structured Output |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> **DeepSeek** | Chat (V3), **Reasoning (R1)**, **Streaming + Tools** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" height="18"> **OpenRouter** | **Aggregator**, Chat, Streaming, Tools, Vision, Embeddings, **Reasoning** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="18"> **Ollama** | **Local Inference**, Chat, Streaming, Tools, Vision, Embeddings |

---

## 📚 Documentation & Installation

```bash
npm install @node-llm/core
```

**[View Full Documentation ↗](https://node-llm.eshaiju.com/)**

---

## 🤝 Contributing

We welcome contributions! Please see our **[Contributing Guide](https://github.com/node-llm/node-llm/blob/main/CONTRIBUTING.md)** for more details on how to get started.

---

## 🫶 Credits

Heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/).

---

## 📄 License

MIT © [NodeLLM contributors]
