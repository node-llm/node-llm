---
layout: default
title: Overview
nav_order: 1
parent: Getting Started
permalink: /getting-started/overview
description: High-level overview of NodeLLM components, design principles, and how the framework works.
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

`NodeLLM` provides a seamless, unified interface for interacting with multiple Large Language Model (LLM) providers. Whether you are building a simple chat bot or a complex multi-modal agentic workflow, `NodeLLM` abstracts away the provider-specific complexities.

## Core Components

Understanding these components will help you use the framework effectively.

### 1. Chat

The primary interface for conversational AI. `NodeLLM.chat()` creates a stateful object that manages conversation history.

```ts
const chat = llm.chat("gpt-4o");
```

### 2. Providers

Adapters that translate the unified `NodeLLM` format into provider-specific API calls (OpenAI, Anthropic, Gemini). You rarely interact with them directly; the library handles this based on the model ID you choose.

### 3. Tools

Functions that the AI can execute. You define the schema and the handler, and `NodeLLM` manages the execution loop automatically.

### 4. Configuration

Global settings for API keys and defaults.

```ts
const llm = createLLM({
  openaiApiKey: "sk-...",
  provider: "openai"
});
```

## Design Principles

### Unified Interface

Every provider works differently. `NodeLLM` normalizes inputs (messages, images) and outputs (content, usage stats) so your code doesn't change when you switch models.

### Streaming First

AI responses are slow. `NodeLLM` is built around `AsyncIterator` to make streaming text to the user as easy as a `for await` loop.

### Progressive Disclosure

Start simple with `NodeLLM.chat().ask("Hello")`. As your needs grow, you can access advanced features like raw API responses, custom headers, and token usage tracking without breaking your initial code.

## How it Works

1.  **Normalization**: Your inputs (text, images, files) are converted into a standardized format.
2.  **Configuration**: The library uses the provider and model you specify (e.g., GPT-4o with OpenAI).
3.  **Execution**: The request is sent. If tools are called, the library executes them and feeds the result back to the model.
4.  **Response**: The final response is normalized into a consistent object.
