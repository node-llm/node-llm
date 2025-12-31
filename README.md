# @node-llm/core

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/package/@node-llm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A provider-agnostic LLM core for Node.js, heavily inspired by the elegant design of [ruby-llm](https://github.com/crmne/ruby_llm).

`node-llm` focuses on clean abstractions, minimal magic, and a streaming-first design. It provides a unified interface to interact with various LLM providers without being locked into their specific SDKs.

---

## 🚀 Features

- **Provider-Agnostic**: Switch between OpenAI, Anthropic, and others with a single line of config.
- **Streaming-First**: Native `AsyncIterator` support for real-time token delivery.
- **Tool Calling**: Automatic execution loop for model-requested functions.
- **Content Moderation**: Built-in safety checks for user input and model output.
- **Multi-modal & Smart Files**: Built-in support for Vision (images), Audio, and Text files.
- **Fluent API**: Chainable methods like `.withTool()` for dynamic registration.
- **Resilient**: Configurable retry logic at the execution layer.
- **Type-Safe**: Written in TypeScript with full ESM support.

---

## 📦 Installation

```bash
npm install @node-llm/core
# or
pnpm add @node-llm/core
```

---

## 🛠️ Quick Start

### 1. Configure the Provider

```ts
import { LLM } from "@node-llm/core";
import "dotenv/config";

LLM.configure({
  provider: "openai", // Uses OPENAI_API_KEY from env
  retry: { attempts: 3, delayMs: 500 },
  defaultModerationModel: "text-moderation-latest",
  defaultTranscriptionModel: "whisper-1",
  defaultEmbeddingModel: "text-embedding-3-small"
});
```

### 2. Basic Chat

```ts
const chat = LLM.chat("gpt-4o-mini", {
  systemPrompt: "You are a helpful assistant."
});

const response = await chat.ask("What is Node.js?");

// Use as a string directly
console.log(response);

// Or access metadata (RubyLLM style)
console.log(response.content);
console.log(`Model: ${response.model_id}`);
console.log(`Tokens: ${response.input_tokens} in, ${response.output_tokens} out`);
```

### 3. Streaming Responses

```ts
for await (const chunk of chat.stream("Write a poem")) {
  process.stdout.write(chunk.content);
}
```

### 4. Image Generation (Paint)

Generate images and interact with them using a rich API.

```ts
const image = await LLM.paint("a sunset over mountains", {
  model: "dall-e-3"
});

// Use as a URL string
console.log(`URL: ${image}`);

// Or use rich methods
await image.save("sunset.png");
console.log(`Format: ${image.mimeType}`);
```

### 5. Token Usage Tracking

Track tokens for individual turns or the entire conversation.

```ts
const response = await chat.ask("Hello!");

console.log(response.input_tokens);  // 10
console.log(response.output_tokens); // 5

// Access aggregated usage for the whole session
console.log(chat.totalUsage.total_tokens);
```

### 6. Embeddings

Generate vector representations of text for semantic search, clustering, and similarity comparisons.

```ts
// Single text embedding
const embedding = await LLM.embed("Ruby is a programmer's best friend");

console.log(embedding.vector);        // Array of floats (e.g., 1536 dimensions)
console.log(embedding.dimensions);    // 1536
console.log(embedding.model);         // "text-embedding-3-small"
console.log(embedding.input_tokens);  // Token count

// Batch embeddings
const embeddings = await LLM.embed([
  "First text",
  "Second text",
  "Third text"
]);

console.log(embeddings.vectors);      // Array of vectors
console.log(embeddings.vectors.length); // 3

// Custom model and dimensions
const customEmbedding = await LLM.embed("Semantic search text", {
  model: "text-embedding-3-large",
  dimensions: 256  // Reduce dimensions for faster processing
});
```

### 7. Audio Transcription (Transcribe)

Convert audio files to text using specialized models like Whisper.

```ts
const text = await LLM.transcribe("meeting.mp3");
console.log(text);
```

### 7. Content Moderation (Moderate)

Check if text content violates safety policies.

```ts
const result = await LLM.moderate("I want to help everyone!");
if (result.flagged) {
  console.log(`❌ Flagged for: ${result.flaggedCategories.join(", ")}`);
} else {
  console.log("✅ Content appears safe");
}
```

Learn how to implement [custom risk thresholds](./examples/openai/12-risk-assessment.mjs) for more granular control.

### 8. Chat Event Handlers

Hook into the chat lifecycle for logging, UI updates, or auditing.

```ts
chat
  .onNewMessage(() => console.log("AI started typing..."))
  .onToolCall((tool) => console.log(`Calling ${tool.function.name}...`))
  .onToolResult((result) => console.log(`Tool returned: ${result}`))
  .onEndMessage((response) => console.log(`Done. Usage: ${response.total_tokens}`));

await chat.ask("What's the weather?");
```

### 9. System Prompts (Instructions)

Guide the AI's behavior, personality, or constraints.

```ts
// Set initial instructions
chat.withInstructions("You are a helpful assistant that explains simply.");

// Update instructions mid-conversation (replace: true removes previous ones)
chat.withInstructions("Now assume the persona of a pirate.", { replace: true });

await chat.ask("Hello");
// => "Ahoy matey!"
```

### 10. Temperature Control (Creativity)

Adjust the randomness of the model's responses.

```ts
// Factual (0.0 - 0.3)
const factual = LLM.chat("gpt-4o").withTemperature(0.2);

// Creative (0.7 - 1.0)
const creative = LLM.chat("gpt-4o").withTemperature(0.9);
```

---

## 📚 Examples

Check the [examples](./examples) directory for focused scripts organized by provider:

### OpenAI Examples
| Example | Description |
| :--- | :--- |
| [Basic Chat](./examples/openai/01-basic-chat.mjs) | Simple completion request |
| [Streaming](./examples/openai/02-streaming.mjs) | Real-time token streaming |
| [Tool Calling](./examples/openai/03-tool-calling.mjs) | Automatic tool execution loop |
| [Vision](./examples/openai/04-vision.mjs) | Image analysis |
| [List Models](./examples/openai/05-list-models.mjs) | Enumerate available models |
| [Paint](./examples/openai/06-paint.mjs) | Image generation with DALL-E |
| [Image Features](./examples/openai/07-image-features.mjs) | Saving and processing generated images |
| [Token Usage](./examples/openai/08-token-usage.mjs) | Detailed stats for turns and conversations |
| [Transcribe](./examples/openai/09-transcribe.mjs) | Audio to text transcription |
| [Capabilities](./examples/openai/10-capabilities.mjs) | Dynamic model specs and pricing |
| [Moderate](./examples/openai/11-moderate.mjs) | Content safety moderation |
| [Risk Assessment](./examples/openai/12-risk-assessment.mjs) | Custom thresholds and risk levels |
| [Chat Events](./examples/openai/13-chat-events.mjs) | Lifecycle hooks (onNewMessage, onToolCall etc) |
| [System Prompts](./examples/openai/15-system-prompts.mjs) | Dynamic system instructions |
| [Temperature](./examples/openai/16-temperature.mjs) | Control creativity vs determinism |
| [Multi-File](./examples/openai/17-multi-file.mjs) | Analyze multiple files at once |
| [Embeddings](./examples/openai/18-embeddings.mjs) | Generate vector embeddings for semantic search |


To run an example:
```bash
node examples/openai/01-basic-chat.mjs
```

---

## 🔌 Advanced Usage

### Tool Calling (Function Calling)

Define your tools and let the library handle the execution loop automatically.

```ts
const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    parameters: {
      type: 'object',
      properties: { location: { type: 'string' } }
    }
  },
  handler: async ({ location }) => {
    return JSON.stringify({ location, temp: 22, unit: 'celsius' });
  }
};

// Use the fluent API to add tools on the fly
const reply = await chat
  .withTool(weatherTool)
  .ask("What is the weather in London?");
```

### Multi-modal & File Support

Pass local paths or URLs directly. The library handles reading, MIME detection, and encoding for a wide variety of file types.

**Supported File Types:**
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Videos**: `.mp4`, `.mpeg`, `.mov`
- **Audio**: `.wav`, `.mp3`
- **Documents**: `.csv`, `.json`
- **Code**: `.js`, `.mjs`, `.cjs`, `.ts`, `.py`, `.rb`, `.go`, `.java`, `.c`, `.cpp`, `.rs`, `.swift`, `.kt`
- **Text**: `.txt`, `.md`, `.html`, `.css`, `.xml`, `.yml`, `.yaml`

```ts
// Vision
await chat.ask("What's in this image?", {
  files: ["./screenshot.png"]
});

// Audio
await chat.ask("Transcribe this", {
  files: ["./meeting.mp3"]
});

// Code Analysis
await chat.ask("Explain this code", {
  files: ["./app.ts"]
});

// Multiple files at once
await chat.ask("Analyze these files", {
  files: ["diagram.png", "data.json", "notes.txt"]
});
```

### Custom HTTP Headers (Proxies/Observability)

Inject custom headers into requests, useful for tools like Helicone or Portkey.

```ts
chat.withRequestOptions({
  headers: {
    "Helicone-Auth": "Bearer my-key",
    "X-Custom-Trace": "123"
  }
});
```

### Model Capabilities & Pricing

Get up-to-date information about context windows, pricing, and capabilities directly from the Parsera API.

```javascript
// Refresh model information from the API
await LLM.models.refresh();

// Use the data programmatically
const model = LLM.models.find("gpt-4o-mini");
console.log(model.context_window);    // => 128000
console.log(model.capabilities);      // => ["function_calling", "structured_output", "streaming", "batch"]
console.log(model.pricing.text_tokens.standard.input_per_million); // => 0.15
```

---

## 📋 Supported Providers

| Provider | Status | Notes |
| :--- | :--- | :--- |
| **OpenAI** | ✅ Supported | Chat, Streaming, Tools, Vision, Audio, Images, Transcription, Moderation |
| **Anthropic** | 🏗️ Roadmap | Coming soon |
| **Azure OpenAI** | 🏗️ Roadmap | Coming soon |

---

## 🧠 Design Philosophy

- **Explicit over Implicit**: No hidden side effects.
- **Minimal Dependencies**: Lightweight core with zero bloat.
- **Developer Experience**: Inspired by Ruby's elegance, built for Node's performance.
- **Production Ready**: Built-in retries and strict type checking.

---

## 🧪 Testing

`node-llm` uses VCR-style testing (via Polly.js) for robust, deterministic integration tests. This allows us to record real LLM provider interactions once and replay them during tests without making actual API calls.

- **Replay Mode (Default)**: Runs tests using recorded cassettes. Fast, deterministic, and requires no API keys.
  ```bash
  npm test
  ```

- **Record Mode**: Hits real APIs and updates cassettes. Requires a valid API key.
  ```bash
  VCR_MODE=record OPENAI_API_KEY=your_key npm test
  ```

*All recordings are automatically scrubbed of sensitive data (API keys, org IDs) before being saved to disk.*

---

## 📄 License

MIT © [node-llm contributors]
