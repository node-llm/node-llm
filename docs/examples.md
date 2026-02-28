---
layout: default
title: Examples
nav_order: 7
description: Explore a comprehensive collection of runnable examples demonstrating every feature from basic chat to advanced multi-agent security policies.
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

A comprehensive list of runnable examples available in the [examples/](https://github.com/node-llm/node-llm/tree/main/examples) directory of the repository.

## 🌟 Showcase

| Example                                                                                                                                                 | Description                                                                                                                                                 |
| :------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`examples/applications/brand-perception-checker/`](https://github.com/node-llm/node-llm/tree/main/examples/applications/brand-perception-checker)      | **Brand Perception Auditor** — A full-stack (Node+React) app demonstrating multi-provider orchestration, tool calling (Google SERP), and structured output. |
| [`examples/applications/hr-chatbot-rag/`](https://github.com/node-llm/node-llm/tree/main/examples/applications/hr-chatbot-rag)                        | **HR Chatbot RAG** — A production Next.js chatbot featuring `@node-llm/orm`, streaming, and persistence.                                                    |
| [`examples/scripts/openai/core/support-agent.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/core/support-agent.mjs)       | **Real-world Travel Support AI Agent** using Context Isolation, Auto-executing Tools, and Structured Output.                                                |
| [`examples/scripts/openai/security/content-policy-hooks.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/security/content-policy-hooks.mjs) | **Content Policy & Security** using `beforeRequest` and `afterResponse` hooks for PII redaction.                                                            |
| [`examples/scripts/openai/security/tool-policies.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/security/tool-policies.mjs) | **Advanced Tool Security** using `confirm` and `dry-run` modes for human-in-the-loop auditing.                                                              |

## OpenAI Examples

| Example                                                                                                                                   | Description                         |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- |
| [`examples/scripts/openai/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/basic.mjs)                         | Basic chat with streaming           |
| [`examples/scripts/openai/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/events.mjs)                       | Lifecycle hooks (onNewMessage, etc) |
| [`examples/scripts/openai/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/tools.mjs)                         | Automatic tool execution            |
| [`examples/scripts/openai/chat/tool-dsl.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/tool-dsl.mjs)                   | Class-based Tool DSL                |
| [`examples/scripts/openai/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/structured.mjs)               | Zod schema validation               |
| [`examples/scripts/openai/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/multimodal/vision.mjs)           | Image analysis via URL              |
| [`examples/scripts/openai/multimodal/files.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/multimodal/files.mjs)             | Analyzing local files               |
| [`examples/scripts/openai/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/images/generate.mjs)               | DALL-E 3 Generation                 |
| [`examples/scripts/openai/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/safety/moderation.mjs)           | Custom safety thresholds            |
| [`examples/scripts/openai/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/embeddings/create.mjs)           | Creating text embeddings            |
| [`examples/scripts/openai/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/usage.mjs)                         | Token usage tracking                |
| [`examples/scripts/openai/chat/parallel-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/parallel-tools.mjs)       | Parallel tool execution             |
| [`examples/scripts/openai/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/max-tokens.mjs)               | Controlling output length           |
| [`examples/scripts/openai/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/streaming-tools.mjs)     | Tool use with streaming             |
| [`examples/scripts/openai/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/instructions.mjs)           | System prompt instructions          |
| [`examples/scripts/openai/chat/reasoning.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/reasoning.mjs)                 | Reasoning capabilities (o1)         |
| [`examples/scripts/openai/chat/params.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/params.mjs)                       | Custom model parameters             |
| [`examples/scripts/openai/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/streaming.mjs)                 | Advanced streaming examples         |
| [`examples/scripts/openai/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/discovery/models.mjs)             | Listing available models            |
| [`examples/scripts/openai/multimodal/transcribe.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/multimodal/transcribe.mjs)   | Audio transcription                 |
| [`examples/scripts/openai/multimodal/multi-image.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/multimodal/multi-image.mjs) | Multiple image analysis             |

### Gemini

| Example | Description |
| :--- | :--- |
| [`examples/scripts/gemini/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/basic.mjs) | Streaming chat with Gemini 1.5 |
| [`examples/scripts/gemini/chat/json_mode.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/json_mode.mjs) | Native JSON mode |
| [`examples/scripts/gemini/multimodal/video.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/multimodal/video.mjs) | Analyzing video files |
| [`examples/scripts/gemini/multimodal/audio.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/multimodal/audio.mjs) | Native audio understanding |
| [`examples/scripts/gemini/multimodal/files.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/multimodal/files.mjs) | Multi-file context |
| [`examples/scripts/gemini/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/embeddings/create.mjs) | Creating text embeddings |
| [`examples/scripts/gemini/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/structured.mjs) | Structured output with Zod |
| [`examples/scripts/gemini/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/usage.mjs) | Token usage tracking |
| [`examples/scripts/gemini/chat/parallel-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/parallel-tools.mjs) | Parallel tool execution |
| [`examples/scripts/gemini/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/max-tokens.mjs) | Controlling output length |
| [`examples/scripts/gemini/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/streaming-tools.mjs) | Tool use with streaming |
| [`examples/scripts/gemini/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/instructions.mjs) | System prompt instructions |
| [`examples/scripts/gemini/chat/params.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/params.mjs) | Custom model parameters |
| [`examples/scripts/gemini/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/streaming.mjs) | Advanced streaming |
| [`examples/scripts/gemini/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/tools.mjs) | Tool execution |
| [`examples/scripts/gemini/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/chat/events.mjs) | Chat lifecycle events |
| [`examples/scripts/gemini/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/images/generate.mjs) | Imagen 3 Generation |
| [`examples/scripts/gemini/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/discovery/models.mjs) | Listing available models |
| [`examples/scripts/gemini/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/safety/moderation.mjs) | Content safety settings |
| [`examples/scripts/gemini/multimodal/transcribe.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/multimodal/transcribe.mjs) | Audio transcription |
| [`examples/scripts/gemini/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/multimodal/vision.mjs) | Image analysis |
| [`examples/scripts/gemini/multimodal/multi-image.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/gemini/multimodal/multi-image.mjs) | Multiple image analysis |

### Anthropic

| Example | Description |
| :--- | :--- |
| [`examples/scripts/anthropic/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/basic.mjs) | Claude 3.5 Sonnet Chat |
| [`examples/scripts/anthropic/chat/tool_use.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/tool_use.mjs) | Tool calling with Claude |
| [`examples/scripts/anthropic/multimodal/pdf.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/multimodal/pdf.mjs) | Native PDF analysis |
| [`examples/scripts/anthropic/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/multimodal/vision.mjs) | Image understanding |
| [`examples/scripts/anthropic/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/embeddings/create.mjs) | Creating embeddings (Voyage AI) |
| [`examples/scripts/anthropic/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/structured.mjs) | Structured output (Tool use) |
| [`examples/scripts/anthropic/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/usage.mjs) | Token usage tracking |
| [`examples/scripts/anthropic/chat/parallel-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/parallel-tools.mjs) | Parallel tool execution |
| [`examples/scripts/anthropic/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/max-tokens.mjs) | Controlling output length |
| [`examples/scripts/anthropic/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/streaming-tools.mjs) | Tool use with streaming |
| [`examples/scripts/anthropic/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/instructions.mjs) | System instructions |
| [`examples/scripts/anthropic/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/streaming.mjs) | Streaming chat |
| [`examples/scripts/anthropic/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/chat/events.mjs) | Lifecycle events |
| [`examples/scripts/anthropic/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/images/generate.mjs) | Image generation |
| [`examples/scripts/anthropic/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/discovery/models.mjs) | Listing models |
| [`examples/scripts/anthropic/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/safety/moderation.mjs) | Content moderation |
| [`examples/scripts/anthropic/multimodal/transcribe.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/multimodal/transcribe.mjs) | Audio transcription |
| [`examples/scripts/anthropic/multimodal/multi-image.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/multimodal/multi-image.mjs) | Multiple image analysis |
| [`examples/scripts/anthropic/multimodal/files.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/anthropic/multimodal/files.mjs) | Multi-file context |

### Ollama Examples

| Example | Description |
| :--- | :--- |
| [`examples/scripts/ollama/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/ollama/chat/basic.mjs) | Local model chat |
| [`examples/scripts/ollama/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/ollama/chat/streaming.mjs) | Streaming local inference |
| [`examples/scripts/ollama/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/ollama/chat/tools.mjs) | Function calling with Llama 3.1 |
| [`examples/scripts/ollama/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/ollama/multimodal/vision.mjs) | Multi-modal local analysis |
| [`examples/scripts/ollama/embeddings/similarity.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/ollama/embeddings/similarity.mjs) | Vector similarity search |
| [`examples/scripts/ollama/discovery/list.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/ollama/discovery/list.mjs) | Inspecting local model library |

### DeepSeek Examples

| Example | Description |
| :--- | :--- |
| [`examples/scripts/deepseek/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/basic.mjs) | Basic chat with DeepSeek |
| [`examples/scripts/deepseek/chat/reasoning.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/reasoning.mjs) | DeepSeek-R1 reasoning tracking |
| [`examples/scripts/deepseek/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/streaming.mjs) | Streaming chat responses |
| [`examples/scripts/deepseek/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/tools.mjs) | Function calling with DeepSeek |
| [`examples/scripts/deepseek/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/structured.mjs) | Structured JSON output |
| [`examples/scripts/deepseek/embeddings/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/embeddings/basic.mjs) | Generating embeddings |
| [`examples/scripts/deepseek/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/usage.mjs) | Token usage tracking |
| [`examples/scripts/deepseek/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/max-tokens.mjs) | Controlling output length |
| [`examples/scripts/deepseek/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/streaming-tools.mjs) | Tool use with streaming |
| [`examples/scripts/deepseek/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/instructions.mjs) | System prompt instructions |
| [`examples/scripts/deepseek/chat/params.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/params.mjs) | Custom model parameters |
| [`examples/scripts/deepseek/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/chat/events.mjs) | Lifecycle hooks |
| [`examples/scripts/deepseek/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/images/generate.mjs) | Image generation |
| [`examples/scripts/deepseek/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/discovery/models.mjs) | Listing models |
| [`examples/scripts/deepseek/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/safety/moderation.mjs) | Content moderation |
| [`examples/scripts/deepseek/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/deepseek/multimodal/vision.mjs) | Vision (V3) |

### OpenRouter Examples

| Example | Description |
| :--- | :--- |
| [`examples/scripts/openrouter/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openrouter/chat/basic.mjs) | Multi-model chat gateway |
| [`examples/scripts/openrouter/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openrouter/chat/streaming.mjs) | Unified streaming across 300+ models |
| [`examples/scripts/openrouter/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openrouter/chat/tools.mjs) | Cross-provider function calling |
| [`examples/scripts/openrouter/chat/reasoning.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openrouter/chat/reasoning.mjs) | Accessing DeepSeek & o1 reasoning |
| [`examples/scripts/openrouter/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openrouter/discovery/models.mjs) | Exploring the global model library |
| [`examples/scripts/openrouter/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openrouter/multimodal/vision.mjs) | Unified vision API for all models |
| [`examples/scripts/openrouter/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openrouter/embeddings/create.mjs) | Aggregated embedding services |

### xAI Examples

| Example | Description |
| :--- | :--- |
| [`examples/scripts/xai/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/xai/chat/basic.mjs) | Basic chat with Grok-3 |
| [`examples/scripts/xai/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/xai/chat/streaming.mjs) | Streaming chat responses |
| [`examples/scripts/xai/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/xai/chat/structured.mjs) | Structured output with Zod schema |
| [`examples/scripts/xai/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/xai/multimodal/vision.mjs) | Image analysis with Grok Vision |
| [`examples/scripts/xai/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/scripts/xai/images/generate.mjs) | Image generation with Aurora |

