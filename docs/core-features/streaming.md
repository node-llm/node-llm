---
layout: default
title: Stream Responses
nav_order: 2
parent: Core Features
description: Implement real-time user experiences with low-latency responses using standard AsyncIterators and seamless tool execution loops.
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

For real-time interactions, \`NodeLLM\` supports streaming responses via standard JavaScript \`AsyncIterator\`s. This allows you to display text to the user as it's being generated, reducing perceived latency.

## Basic Streaming

Use the `stream()` method on a chat instance to get an iterator.

```ts
const chat = NodeLLM.chat("gpt-4o");

process.stdout.write("Assistant: ");

for await (const chunk of chat.stream("Write a haiku about code.")) {
  // Most chunks contain content
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
// => Code flows like water
//    Logic builds a new world now
//    Bugs swim in the stream
```

## Understanding Chunks

Each chunk passed to your loop contains partial information about the response.

- `content`: The text fragment for this specific chunk. Can be empty contextually.
- `role`: Usually "assistant".
- `model`: The model ID.
- `usage`: (Optional) Token usage stats. Usually only present in the final chunk (provider dependent).

```ts
for await (const chunk of chat.stream("Hello")) {
  console.log(chunk);
  // { content: "He", role: "assistant", ... }
  // { content: "llo", role: "assistant", ... }
}
```

## Streaming with Tools ✨

**NEW:** Tools now work seamlessly with streaming! When a model decides to call a tool during streaming, `NodeLLM` automatically:

1. **Executes the tool** with the provided arguments
2. **Adds the result** to the conversation history
3. **Continues streaming** the model's final response

This all happens transparently - you just iterate over chunks as usual!

```ts
class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get current weather";
  schema = z.object({
    location: z.string().describe("The city e.g. Paris")
  });

  async execute({ location }) {
    return { location, temp: 22, condition: "sunny" };
  }
}

const chat = NodeLLM.chat("gpt-4o").withTool(WeatherTool);

// Tool is automatically executed during streaming!
for await (const chunk of chat.stream("What's the weather in Paris?")) {
  process.stdout.write(chunk.content || "");
}
// Output: "The weather in Paris is currently 22°C and sunny."
```

### Tool Events in Streaming

You can also listen to tool execution events:

```ts
const chat = NodeLLM.chat("gpt-4o")
  .withTool(WeatherTool)
  .onToolCall((call) => {
    console.log(`\n[Tool Called: ${call.function.name}]`);
  })
  .onToolResult((result) => {
    console.log(`[Tool Result: ${JSON.stringify(result)}]\n`);
  });

for await (const chunk of chat.stream("Weather in Tokyo?")) {
  process.stdout.write(chunk.content || "");
}
```

**Supported Providers:** OpenAI, Anthropic, Gemini, DeepSeek

## Multimodal & Structured Streaming ✨

**NEW:** `chat.stream()` now supports the same advanced features as `chat.ask()`.

### Multimodal Streaming

Pass images, audio, or documents just like you would with a standard request.

```ts
const chat = NodeLLM.chat("gpt-4o");

for await (const chunk of chat.stream("What's in this image?", {
  images: ["./analysis.png"]
})) {
  process.stdout.write(chunk.content || "");
}
```

### Structured Streaming (Validated JSON)

Get streaming JSON that is automatically validated against a Zod schema.

```ts
const personSchema = z.object({
  name: z.string(),
  hobbies: z.array(z.string())
});

for await (const chunk of chat.withSchema(personSchema).stream("Generate a person profile")) {
  // Chunks will contain partial content that cumulatively forms valid JSON
  // Once the stream completes, history will contain the validated object
  process.stdout.write(chunk.content || "");
}
```

## Error Handling

Stream interruptions (network failure, rate limits) will throw an error within the `for await` loop. Always wrap in a `try/catch` block.

```ts
try {
  for await (const chunk of chat.stream("Generate a long story...")) {
    process.stdout.write(chunk.content);
  }
} catch (error) {
  console.error("\n[Stream Error]", error.message);
}
```

## Web Application Integration

Streaming is essential for modern web apps. Here is a simple example using **Express**:

```ts
import express from "express";
import { NodeLLM } from "@node-llm/core";

const app = express();

app.get("/chat", async (req, res) => {
  // Set headers for streaming text
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  const chat = NodeLLM.chat("gpt-4o-mini");

  try {
    for await (const chunk of chat.stream(req.query.q as string)) {
      if (chunk.content) {
        res.write(chunk.content);
      }
    }
    res.end();
  } catch (error) {
    res.write(`\nError: ${error.message}`);
    res.end();
  }
});
```
