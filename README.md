# @node-llm/core

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/package/@node-llm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A provider-agnostic LLM core for Node.js, heavily inspired by the elegant design of [ruby-llm](https://github.com/crmne/ruby_llm).

`node-llm` focuses on clean abstractions, minimal magic, and a streaming-first design. It provides a unified interface to interact with various LLM providers without being locked into their specific SDKs.

---

## 🚀 Features

- **Provider-Agnostic**: Switch between OpenAI (GPT-4o), Anthropic (Claude 3.5), and Gemini (2.0) with a single line of config.
- **Streaming-First**: Native `AsyncIterator` support for real-time token delivery.
- **Tool Calling**: Automatic execution loop for model-requested functions (OpenAI, Anthropic, Gemini).
- **Structured Output**: Strict Zod-based JSON schema enforcement across all major providers.
- **Multi-modal & Smart Files**: Built-in support for Vision (images), Audio, and Documents (PDFs for Claude).
- **Fluent API**: Chainable methods like `.withTool()` and `.withSchema()` for dynamic registration.
- **Resilient**: Configurable retry logic and detailed error handling for API outages.
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
  provider: "openai", // or "anthropic", "gemini"
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
console.log(`Cost: $${response.cost}`);
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
console.log(response.cost);          // 0.000185

// Access aggregated usage for the whole session
console.log(chat.totalUsage.total_tokens);
console.log(chat.totalUsage.cost);
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

### 11. Provider-Specific Parameters

Access unique provider features while maintaining the unified interface. Parameters passed via `withParams()` will override any defaults set by the library.

```ts
// OpenAI: Set seed for deterministic output
const chat = LLM.chat("gpt-4o-mini")
  .withParams({ 
    seed: 42,
    user: "user-123",
    presence_penalty: 0.5 
  });

// Gemini: Configure safety settings and generation params
const geminiChat = LLM.chat("gemini-2.0-flash")
  .withParams({
    generationConfig: { topP: 0.8, topK: 40 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" }
    ]
  });

// Anthropic: Custom headers or beta features
const claudeChat = LLM.chat("claude-3-5-sonnet-20241022")
  .withParams({ 
    top_k: 50,
    top_p: 0.9
  });
```

**⚠️ Important Notes:**
- Parameters from `withParams()` take precedence over library defaults
- Always consult the provider's API documentation for supported parameters
- The library passes these parameters through without validation
- Enable debug mode to see the exact request: `process.env.NODELLM_DEBUG = "true"`

See examples: [OpenAI](./examples/openai/chat/params.mjs) | [Gemini](./examples/gemini/chat/params.mjs)

---

## 📚 Examples

Check the [examples](./examples) directory for focused scripts organized by provider:

### OpenAI Examples

#### 💬 Chat
| Example | Description |
| :--- | :--- |
| [Basic & Streaming](./examples/openai/chat/basic.mjs) | Standard completions and real-time streaming |
| [System Instructions](./examples/openai/chat/instructions.mjs) | Tuning behavior with system prompts and temperature |
| [Tool Calling](./examples/openai/chat/tools.mjs) | Automatic execution of model-requested functions |
| [Parallel Tool Calling](./examples/openai/chat/parallel-tools.mjs) | Executing multiple tools in a single turn |
| [Lifecycle Events](./examples/openai/chat/events.mjs) | Hooks for specific chat events (onNewMessage, onToolCall) |
| [Token Usage](./examples/openai/chat/usage.mjs) | Tracking costs and token counts |
| [Max Tokens](./examples/openai/chat/max-tokens.mjs) | Limiting response length with `maxTokens` |
| [Structured Output](./examples/openai/chat/structured.mjs) | Zod-based JSON schema enforcement |

#### 🖼️ Multimodal
| Example | Description |
| :--- | :--- |
| [Vision Analysis](./examples/openai/multimodal/vision.mjs) | Analyzing images via URLs |
| [Multi-Image Analysis](./examples/openai/multimodal/multi-image.mjs) | Comparing multiple images in one request |
| [File Context](./examples/openai/multimodal/files.mjs) | Reading and analyzing local project files |
| [Audio Transcription](./examples/openai/multimodal/transcribe.mjs) | Converting audio files to text (Whisper) |

#### 🎨 Images
| Example | Description |
| :--- | :--- |
| [Generate & Save](./examples/openai/images/generate.mjs) | Creating images with DALL-E 3 and saving to disk |

#### 🛡️ Safety
| Example | Description |
| :--- | :--- |
| [Moderation](./examples/openai/safety/moderation.mjs) | Content safety checks and risk assessment |

#### 🧠 Discovery
| Example | Description |
| :--- | :--- |
| [Models & Capabilities](./examples/openai/discovery/models.mjs) | Listing models and inspecting their specs |
| [Embeddings](./examples/openai/embeddings/create.mjs) | Generating semantic vector embeddings |

### Gemini Examples

#### 💬 Chat
| Example | Description |
| :--- | :--- |
| [Basic & Streaming](./examples/gemini/chat/basic.mjs) | Standard completions and real-time streaming |
| [System Instructions](./examples/gemini/chat/instructions.mjs) | Behavior tuning and creativity control |
| [Tool Calling](./examples/gemini/chat/tools.mjs) | Function calling with automatic execution |
| [Lifecycle Events](./examples/gemini/chat/events.mjs) | Event hooks for chat interactions |
| [Token Usage](./examples/gemini/chat/usage.mjs) | Tracking conversation costs |
| [Structured Output](./examples/gemini/chat/structured.mjs) | Native JSON schema support |

#### 🖼️ Multimodal
| Example | Description |
| :--- | :--- |
| [Vision Analysis](./examples/gemini/multimodal/vision.mjs) | Understanding images |
| [File Context](./examples/gemini/multimodal/files.mjs) | Reading multiple local files |
| [Audio Transcription](./examples/gemini/multimodal/transcribe.mjs) | Native audio understanding |

#### 🎨 Images
| Example | Description |
| :--- | :--- |
| [Generate & Save](./examples/gemini/images/generate.mjs) | Creating images with Imagen |

#### 🧠 Discovery
| Example | Description |
| :--- | :--- |
| [Models & Capabilities](./examples/gemini/discovery/models.mjs) | Listing models and inspecting their specs |
| [Embeddings](./examples/gemini/embeddings/create.mjs) | Generating semantic vector embeddings |

### Anthropic Examples

#### 💬 Chat
| Example | Description |
| :--- | :--- |
| [Basic & Streaming](./examples/anthropic/chat/basic.mjs) | Chatting with Claude 3.5 Models |
| [Tool Calling](./examples/anthropic/chat/tools.mjs) | Native tool use with automatic execution |
| [Parallel Tools](./examples/anthropic/chat/parallel-tools.mjs) | Handling multiple tool requests in one turn |
| [Token Usage](./examples/anthropic/chat/usage.mjs) | Tracking Claude-specific token metrics |
| [Structured Output](./examples/anthropic/chat/structured.mjs) | Prompt-based JSON schema enforcement |

#### 🖼️ Multimodal
| Example | Description |
| :--- | :--- |
| [Vision Analysis](./examples/anthropic/multimodal/vision.mjs) | Analyzing images with Claude Vision |
| [PDF Analysis](./examples/anthropic/multimodal/pdf.mjs) | Native PDF document processing |
| [File Context](./examples/anthropic/multimodal/files.mjs) | Passing local file contents to Claude |


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

### Structured Output (Schemas)

Ensure the AI returns data exactly matching a specific structure. Supports strict schema validation using Zod.

**Using Zod (Recommended):**

```ts
import { LLM, z } from "@node-llm/core";

const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  hobbies: z.array(z.string())
});

const response = await chat
  .withSchema(personSchema)
  .ask("Generate a person named Alice who likes hiking");

// Type-safe access to parsed data
const person = response.parsed;
console.log(person.name); // "Alice"
```

**Using Manual JSON Schema:**

```ts
const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" }
  },
  required: ["name", "age"],
  additionalProperties: false // Required for strict mode in OpenAI
};

const response = await chat
  .withSchema(schema)
  .ask("Generate a person");

console.log(response.parsed); // { name: "...", age: ... }
```

### JSON Mode

Guarantee valid JSON output without enforcing a strict schema.

```ts
chat.withRequestOptions({
  responseFormat: { type: "json_object" }
});

const response = await chat.ask("Generate a JSON object with a greeting");
console.log(response.parsed); // { greeting: "..." }
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

// Use the data programmatically
const model = LLM.models.find("gpt-4o-mini");
if (model) {
  console.log(model.context_window);    // => 128000
  console.log(model.capabilities);      // => ["function_calling", "structured_output", "streaming", "batch", "json_mode"]
  console.log(model.pricing.text_tokens.standard.input_per_million); // => 0.15
}
```

---

## 📋 Supported Providers

| Provider | Status | Notes |
| :--- | :--- | :--- |
| **OpenAI** | ✅ Supported | Chat, Streaming, Tools, Vision, Audio, Images, Transcription, Moderation |
| **Gemini** | ✅ Supported | Chat, Streaming, Tools, Vision, Audio, Video, Embeddings, Transcription |
| **Anthropic** | ✅ Supported | Chat, Streaming, Tools, Vision, PDF Support, Structured Output |

---

## 🌐 Custom OpenAI-Compatible Endpoints

Connect to any OpenAI-compatible service (Azure, LiteLLM, Ollama) by configuring the base URL.

### Generic Configuration

Set `OPENAI_API_BASE` to your custom endpoint:

```bash
# LiteLLM
export OPENAI_API_KEY="your-litellm-key"
export OPENAI_API_BASE="https://your-proxy.litellm.ai/v1"

# Ollama (Local)
export OPENAI_API_KEY="not-needed"
export OPENAI_API_BASE="http://localhost:11434/v1"
```

### Azure OpenAI

For Azure, point `OPENAI_API_BASE` to your specific deployment URL. The library correctly handles URL construction even with query parameters.

```bash
export OPENAI_API_KEY="your-azure-key"
# Include the full path to your deployment
export OPENAI_API_BASE="https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT?api-version=2024-08-01-preview"
```

Then, pass the `api-key` header manually when creating the chat instance:

```typescript
import { LLM } from '@node-llm/core';

LLM.configure({ provider: 'openai' });

const chat = LLM.chat('gpt-4').withRequestOptions({
  headers: { 'api-key': process.env.OPENAI_API_KEY }
});

const response = await chat.ask('Hello Azure!');
```

See [`examples/custom-endpoints-example.mjs`](./examples/custom-endpoints-example.mjs) for a complete reference.

---

## 🛠️ Using Custom Models (assumeModelExists)

If you use a model ID not in the built-in registry (e.g., custom Azure names or new models), use `assumeModelExists: true` to bypass validation.

```typescript
const chat = LLM.chat('my-company-gpt-4', {
  assumeModelExists: true,
  // Provider is typically required if not already configured globally
  provider: 'openai' 
});

await chat.ask("Hello");
```

This flag is available on all major methods:

```typescript
// Embeddings
await LLM.embed('text', {
  model: 'custom-embedder',
  assumeModelExists: true
});

// Image Generation
await LLM.paint('prompt', {
  model: 'custom-dalle',
  assumeModelExists: true
});
```

**Note:** When using this flag, strict capability checks (e.g., whether a model supports vision) are skipped. You are responsible for ensuring the model supports the requested features.

---

## 🧠 Design Philosophy

- **Explicit over Implicit**: No hidden side effects.
- **Minimal Dependencies**: Lightweight core with zero bloat.
- **Developer Experience**: Inspired by Ruby's elegance, built for Node's performance.
- **Production Ready**: Built-in retries and strict type checking.

---

`node-llm` features a comprehensive test suite including high-level integration tests and granular unit tests.

- **Unit Tests**: Test core logic and provider handlers in isolation without hitting any APIs.
  ```bash
  npm run test:unit
  ```

- **Integration Tests (VCR)**: Uses Polly.js to record and replay real LLM interactions.
  - **Replay Mode (Default)**: Runs against recorded cassettes. Fast and requires no API keys.
    ```bash
    npm run test:integration
    ```
  - **Record Mode**: Update cassettes by hitting real APIs (requires API keys).
    ```bash
    VCR_MODE=record npm run test:integration
    ```

*All recordings are automatically scrubbed of sensitive data (API keys, org IDs) before being saved to disk.*

---

## 📄 License

MIT © [node-llm contributors]
