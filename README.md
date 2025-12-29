# node-llm

A provider-agnostic LLM core for Node.js, inspired by ruby-llm.

node-llm focuses on:
- clean abstractions
- minimal magic
- streaming-first design
- no SDK lock-in

This is a core library, not a framework.

---

## Features (current)

- Provider-agnostic chat API
- Ruby-LLM-style configuration
- Streaming responses using AsyncIterator
- Tool calling (function calling) support
- Retry support (pre-chat execution layer)
- Strict ESM and TypeScript
- Testable core with fake providers

---

## Installation

```bash
pnpm add @node-llm/core
```

---

## Configuration

### Environment variables

```text
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

Load environment variables in your application:

```ts
import "dotenv/config";
```

---

## Basic Chat Usage

```ts
import { LLM } from "@node-llm/core";

LLM.configure({
  provider: "openai",
});

const chat = LLM.chat("gpt-4o-mini", {
  systemPrompt: "You are a concise assistant",
});

const reply = await chat.ask("Explain HTTP in one sentence");
console.log(reply);
```

---

## Streaming Responses

Streaming uses the native AsyncIterator pattern.

```ts
import { LLM } from "@node-llm/core";

LLM.configure({ provider: "openai" });

const chat = LLM.chat("gpt-4o-mini");

let full = "";

for await (const token of chat.stream("Explain HTTP in one sentence")) {
  process.stdout.write(token);
  full += token;
}

console.log("\nFinal response:", full);
```

Streaming behavior:
- Tokens arrive progressively
- Final assistant message is stored in chat history
- No SDKs or frameworks required

---

## Tool Calling

You can define tools and pass them to the chat instance. The model will decide when to call them, and the library handles the execution loop automatically.

```ts
import { LLM, Tool } from "@node-llm/core";

// 1. Define a tool
const weatherTool: Tool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
      },
      required: ['location']
    }
  },
  // 2. Implement the handler
  handler: async ({ location, unit = 'celsius' }) => {
    // Call your real API here
    return JSON.stringify({ location, temperature: 22, unit, condition: "Sunny" });
  }
};

// 3. Initialize chat with tools
const chat = LLM.chat("gpt-4o-mini", {
  tools: [weatherTool]
});

// 4. Ask a question
const reply = await chat.ask("What is the weather in London?");
console.log(reply); 
// Output: "The weather in London is currently 22°C and sunny."
```

---

## Vision Support

You can send images to models that support vision (like `gpt-4o`) by passing an `images` array in the options.

```ts
const reply = await chat.ask("What's in this image?", {
  images: ["https://example.com/image.jpg"]
});
console.log(reply);
```

---

## Retry Support

Retries are applied before chat execution, not inside providers.

```ts
LLM.configure({
  provider: "openai",
  retry: {
    attempts: 3,
    delayMs: 500,
  },
});
```

Retry behavior:
- Only transient failures are retried
- Chat and providers remain clean
- Designed for future timeouts and circuit breakers

---

## Development

```bash
pnpm install
pnpm --filter @node-llm/core build
node test-openai.mjs
```

---

## Design Philosophy

- Explicit over implicit
- Provider-agnostic core
- No hidden side effects
- Ruby-LLM mental model with Node-native execution
- Suitable for libraries, services, and frameworks

---

## Roadmap

- Tool and function calling
- Streaming with tools
- Azure OpenAI provider
- Observability hooks
- CLI utilities

---

## License

MIT
