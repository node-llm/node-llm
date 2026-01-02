---
layout: default
title: Ollama
parent: Providers
nav_order: 5
---

# Ollama Provider

Allows you to run large language models locally using [Ollama](https://ollama.com/).

## Configuration

Standard configuration for local inference (defaults to `http://localhost:11434/v1`):

```javascript
import { LLM } from "@node-llm/core";

// Simplest setup (defaults to localhost)
LLM.configure({
  provider: "ollama",
});
```

### Custom URL

If your Ollama instance is running elsewhere:

```javascript
LLM.configure({
  provider: "ollama",
  ollamaApiBase: "http://192.168.1.10:11434/v1", // Note the /v1 suffix
});
```

## Features

Since `node-llm` interacts with Ollama's OpenAI-compatible API, most features are supported out-of-the-box.

### Chat & Streaming

```javascript
const chat = LLM.chat("llama3");
const response = await chat.ask("Hello from local model!");
console.log(response.content);
```

### Vision (Multimodal)

Use vision-capable models like `llava` or `llama3.2-vision`.

```javascript
const chat = LLM.chat("llama3.2-vision");
const response = await chat.ask("Describe this image", {
  files: ["./image.png"]
});
```

### Tools (Function Calling)

Ollama models that support tool calling (like `llama3.1`) work automatically with `node-llm`'s unified tool system.

```javascript
// ... define tools ...
await chat.withTools(tools).ask("What's the weather?");
```
