---
layout: default
title: Stream Responses
nav_order: 2
parent: Core Features
---

# Stream Responses

For real-time interactions, `node-llm` supports streaming responses via standard JavaScript `AsyncIterator`s. This allows you to display text to the user as it's being generated, reducing perceived latency.

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

## Streaming with Tools

When tools are involved, `node-llm` handles the complexity for you. The stream will:

1.  **Initial Text**: Stream any text preceding the tool call.
2.  **Pause**: Pause (yield nothing) while the tool executes automatically.
3.  **Resume**: Resume streaming the model's response *after* it sees the tool result.

You don't need to manually handle tool execution loops during streaming; the iterator abstracts this away.

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
import express from 'express';
import { NodeLLM } from '@node-llm/core';

const app = express();

app.get('/chat', async (req, res) => {
  // Set headers for streaming text
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

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
