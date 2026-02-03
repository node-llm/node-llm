---
layout: default
title: OpenTelemetry
parent: Monitor & Observability
nav_order: 3
permalink: /monitor/otel
description: Zero-code instrumentation for AI observability. Extract AI metrics from Vercel AI SDK and other OTel-compliant libraries.
---

# {{ page.title }}
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

---

## Overview

OpenTelemetry (OTel) is the industry standard for observability. However, standard OTel spans often lack the specific metadata needed for AI applications, such as model names, token counts, and tool execution details.

The `@node-llm/monitor-otel` package bridges this gap. It provides a specialized `NodeLLMSpanProcessor` that intercepts OTel spans, extracts AI-specific telemetry, and routes it directly to your NodeLLM Monitor dashboard.

---

## Installation

```bash
pnpm add @node-llm/monitor @node-llm/monitor-otel
```

## Basic Setup

To enable OTel tracking, simply add the `NodeLLMSpanProcessor` to your OpenTelemetry `NodeTracerProvider`.

```typescript
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { Monitor } from "@node-llm/monitor";
import { NodeLLMSpanProcessor } from "@node-llm/monitor-otel";

// 1. Initialize your monitor store
const monitor = Monitor.memory();

// 2. Configure OTel
const provider = new NodeTracerProvider();

// 3. Register the AI-aware processor
provider.addSpanProcessor(new NodeLLMSpanProcessor(monitor.getStore()));
provider.register();
```

---

## Vercel AI SDK Integration

The [Vercel AI SDK](https://sdk.vercel.ai/docs) has built-in support for OpenTelemetry. To track your calls, enable the `experimental_telemetry` option:

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "Write a haiku about monitoring.",
  experimental_telemetry: {
    isEnabled: true,
    functionId: "my-completion-function", // Optional: appear in traces
  },
});
```

The spans emitted by the AI SDK will be automatically converted into NodeLLM Monitor events, including:
- **Model Name**: (e.g., `gpt-4o`)
- **Usage**: Input/Output/Total tokens
- **Cost**: Calculated based on the detected model
- **TTFT**: Time-to-First-Token for streaming requests
- **Tool Calls**: Full breakdown of tool execution within the span

---

## Advanced Configuration

The `NodeLLMSpanProcessor` accepts an optional configuration object:

```typescript
new NodeLLMSpanProcessor(monitor.getStore(), {
  /**
   * Whether to capture prompt/completion content in the spans.
   * Default: false
   */
  captureContent: true,

  /**
   * Custom filter function to skip certain spans.
   */
  filter: (span) => {
    return span.name.startsWith("ai.");
  },

  /**
   * Custom error handler for processing failures.
   */
  onError: (error, span) => {
    console.error("Failed to process AI span:", error);
  },
});
```

---

## Multi-Provider Support

The processor automatically handles spans from various AI SDK providers:
- **OpenAI**
- **Anthropic**
- **Google Gemini**
- **Mistral**
- **Azure OpenAI**

It maps standard OTel attributes (e.g., `gen_ai.usage.input_tokens`) to NodeLLM Monitor metrics seamlessly.
