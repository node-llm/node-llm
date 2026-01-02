---
layout: default
title: Overview
nav_order: 1
parent: Getting Started
---

# Overview

`node-llm` provides a seamless, unified interface for interacting with multiple Large Language Model (LLM) providers. Whether you are building a simple chat bot or a complex multi-modal agentic workflow, `node-llm` abstracts away the provider-specific complexities.

## Core Components

Understanding these components will help you use the framework effectively.

### 1. Chat
The primary interface for conversational AI. `LLM.chat()` creates a stateful object that manages conversation history.

```ts
const chat = LLM.chat("gpt-4o");
```

### 2. Providers
Adapters that translate the unified `node-llm` format into provider-specific API calls (OpenAI, Anthropic, Gemini). You rarely interact with them directly; the library handles this based on the model ID you choose.

### 3. Tools
Functions that the AI can execute. You define the schema and the handler, and `node-llm` manages the execution loop automatically.

### 4. Configuration
Global settings for API keys and defaults.

```ts
LLM.configure({
  openaiApiKey: "sk-...",
  defaultModel: "gpt-4o"
});
```

## Design Principles

### Unified Interface
Every provider works differently. `node-llm` normalizes inputs (messages, images) and outputs (content, usage stats) so your code doesn't change when you switch models.

### Streaming First
AI responses are slow. `node-llm` is built around `AsyncIterator` to make streaming text to the user as easy as a `for await` loop.

### Progressive Disclosure
Start simple with `LLM.chat().ask("Hello")`. As your needs grow, you can access advanced features like raw API responses, custom headers, and token usage tracking without breaking your initial code.

## How it Works

1.  **Normalization**: Your inputs (text, images, files) are converted into a standardized format.
2.  **Routing**: The library detects which provider to use based on the model ID (e.g., `claude-*` -> Anthropic).
3.  **Execution**: The request is sent. If tools are called, the library executes them and feeds the result back to the model.
4.  **Response**: The final response is normalized into a consistent object.
