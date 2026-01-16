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

| Example                                                                                                                         | Description                                                                                                                                                 |
| :------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`examples/brand-perception-checker/`](https://github.com/node-llm/node-llm/tree/main/examples/brand-perception-checker)        | **Brand Perception Auditor** — A full-stack (Node+React) app demonstrating multi-provider orchestration, tool calling (Google SERP), and structured output. |
| [`examples/real-world-support-agent.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/real-world-support-agent.mjs) | **Real-world Travel Support AI Agent** using Context Isolation, Auto-executing Tools, and Structured Output.                                                |
| [`examples/content-policy-hooks.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/content-policy-hooks.mjs)         | **Content Policy & Security** using `beforeRequest` and `afterResponse` hooks for PII redaction.                                                            |
| [`examples/security-tool-policies.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/security-tool-policies.mjs)     | **Advanced Tool Security** using `confirm` and `dry-run` modes for human-in-the-loop auditing.                                                              |

## OpenAI Examples

| Example                                                                                                                                   | Description                         |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- |
| [`examples/openai/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/basic.mjs)                         | Basic chat with streaming           |
| [`examples/openai/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/events.mjs)                       | Lifecycle hooks (onNewMessage, etc) |
| [`examples/openai/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/tools.mjs)                         | Automatic tool execution            |
| [`examples/openai/chat/tool-dsl.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/tool-dsl.mjs)                   | Class-based Tool DSL                |
| [`examples/openai/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/structured.mjs)               | Zod schema validation               |
| [`examples/openai/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/multimodal/vision.mjs)           | Image analysis via URL              |
| [`examples/openai/multimodal/files.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/multimodal/files.mjs)             | Analyzing local files               |
| [`examples/openai/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/images/generate.mjs)               | DALL-E 3 Generation                 |
| [`examples/openai/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/safety/moderation.mjs)           | Custom safety thresholds            |
| [`examples/openai/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/embeddings/create.mjs)           | Creating text embeddings            |
| [`examples/openai/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/usage.mjs)                         | Token usage tracking                |
| [`examples/openai/chat/parallel-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/parallel-tools.mjs)       | Parallel tool execution             |
| [`examples/openai/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/max-tokens.mjs)               | Controlling output length           |
| [`examples/openai/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/streaming-tools.mjs)     | Tool use with streaming             |
| [`examples/openai/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/instructions.mjs)           | System prompt instructions          |
| [`examples/openai/chat/reasoning.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/reasoning.mjs)                 | Reasoning capabilities (o1)         |
| [`examples/openai/chat/params.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/params.mjs)                       | Custom model parameters             |
| [`examples/openai/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/chat/streaming.mjs)                 | Advanced streaming examples         |
| [`examples/openai/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/discovery/models.mjs)             | Listing available models            |
| [`examples/openai/multimodal/transcribe.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/multimodal/transcribe.mjs)   | Audio transcription                 |
| [`examples/openai/multimodal/multi-image.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openai/multimodal/multi-image.mjs) | Multiple image analysis             |

## Gemini Examples

| Example                                                                                                                                   | Description                    |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| [`examples/gemini/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/basic.mjs)                         | Streaming chat with Gemini 1.5 |
| [`examples/gemini/chat/json_mode.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/json_mode.mjs)                 | Native JSON mode               |
| [`examples/gemini/multimodal/video.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/multimodal/video.mjs)             | Analyzing video files          |
| [`examples/gemini/multimodal/audio.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/multimodal/audio.mjs)             | Native audio understanding     |
| [`examples/gemini/multimodal/files.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/multimodal/files.mjs)             | Multi-file context             |
| [`examples/gemini/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/embeddings/create.mjs)           | Creating text embeddings       |
| [`examples/gemini/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/structured.mjs)               | Structured output with Zod     |
| [`examples/gemini/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/usage.mjs)                         | Token usage tracking           |
| [`examples/gemini/chat/parallel-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/parallel-tools.mjs)       | Parallel tool execution        |
| [`examples/gemini/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/max-tokens.mjs)               | Controlling output length      |
| [`examples/gemini/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/streaming-tools.mjs)     | Tool use with streaming        |
| [`examples/gemini/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/instructions.mjs)           | System prompt instructions     |
| [`examples/gemini/chat/params.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/params.mjs)                       | Custom model parameters        |
| [`examples/gemini/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/streaming.mjs)                 | Advanced streaming             |
| [`examples/gemini/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/tools.mjs)                         | Tool execution                 |
| [`examples/gemini/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/chat/events.mjs)                       | Chat lifecycle events          |
| [`examples/gemini/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/images/generate.mjs)               | Imagen 3 Generation            |
| [`examples/gemini/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/discovery/models.mjs)             | Listing available models       |
| [`examples/gemini/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/safety/moderation.mjs)           | Content safety settings        |
| [`examples/gemini/multimodal/transcribe.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/multimodal/transcribe.mjs)   | Audio transcription            |
| [`examples/gemini/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/multimodal/vision.mjs)           | Image analysis                 |
| [`examples/gemini/multimodal/multi-image.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/gemini/multimodal/multi-image.mjs) | Multiple image analysis        |

## Anthropic Examples

| Example                                                                                                                                         | Description                     |
| :---------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| [`examples/anthropic/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/basic.mjs)                         | Claude 3.5 Sonnet Chat          |
| [`examples/anthropic/chat/tool_use.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/tool_use.mjs)                   | Tool calling with Claude        |
| [`examples/anthropic/multimodal/pdf.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/multimodal/pdf.mjs)                 | Native PDF analysis             |
| [`examples/anthropic/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/multimodal/vision.mjs)           | Image understanding             |
| [`examples/anthropic/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/embeddings/create.mjs)           | Creating embeddings (Voyage AI) |
| [`examples/anthropic/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/structured.mjs)               | Structured output (Tool use)    |
| [`examples/anthropic/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/usage.mjs)                         | Token usage tracking            |
| [`examples/anthropic/chat/parallel-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/parallel-tools.mjs)       | Parallel tool execution         |
| [`examples/anthropic/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/max-tokens.mjs)               | Controlling output length       |
| [`examples/anthropic/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/streaming-tools.mjs)     | Tool use with streaming         |
| [`examples/anthropic/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/instructions.mjs)           | System instructions             |
| [`examples/anthropic/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/streaming.mjs)                 | Streaming chat                  |
| [`examples/anthropic/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/chat/events.mjs)                       | Lifecycle events                |
| [`examples/anthropic/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/images/generate.mjs)               | Image generation                |
| [`examples/anthropic/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/discovery/models.mjs)             | Listing models                  |
| [`examples/anthropic/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/safety/moderation.mjs)           | Content moderation              |
| [`examples/anthropic/multimodal/transcribe.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/multimodal/transcribe.mjs)   | Audio transcription             |
| [`examples/anthropic/multimodal/multi-image.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/multimodal/multi-image.mjs) | Multiple image analysis         |
| [`examples/anthropic/multimodal/files.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/anthropic/multimodal/files.mjs)             | Multi-file context              |

## Ollama Examples

| Example                                                                                                                                 | Description                     |
| :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| [`examples/ollama/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/ollama/chat/basic.mjs)                       | Local model chat                |
| [`examples/ollama/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/ollama/chat/streaming.mjs)               | Streaming local inference       |
| [`examples/ollama/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/ollama/chat/tools.mjs)                       | Function calling with Llama 3.1 |
| [`examples/ollama/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/ollama/multimodal/vision.mjs)         | Multi-modal local analysis      |
| [`examples/ollama/embeddings/similarity.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/ollama/embeddings/similarity.mjs) | Vector similarity search        |
| [`examples/ollama/discovery/list.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/ollama/discovery/list.mjs)               | Inspecting local model library  |

## DeepSeek Examples

| Example                                                                                                                                   | Description                    |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| [`examples/deepseek/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/basic.mjs)                     | Basic chat with DeepSeek       |
| [`examples/deepseek/chat/reasoning.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/reasoning.mjs)             | DeepSeek-R1 reasoning tracking |
| [`examples/deepseek/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/streaming.mjs)             | Streaming chat responses       |
| [`examples/deepseek/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/tools.mjs)                     | Function calling with DeepSeek |
| [`examples/deepseek/chat/structured.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/structured.mjs)           | Structured JSON output         |
| [`examples/deepseek/embeddings/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/embeddings/basic.mjs)         | Generating embeddings          |
| [`examples/deepseek/chat/usage.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/usage.mjs)                     | Token usage tracking           |
| [`examples/deepseek/chat/max-tokens.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/max-tokens.mjs)           | Controlling output length      |
| [`examples/deepseek/chat/streaming-tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/streaming-tools.mjs) | Tool use with streaming        |
| [`examples/deepseek/chat/instructions.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/instructions.mjs)       | System prompt instructions     |
| [`examples/deepseek/chat/params.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/params.mjs)                   | Custom model parameters        |
| [`examples/deepseek/chat/events.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/chat/events.mjs)                   | Lifecycle hooks                |
| [`examples/deepseek/images/generate.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/images/generate.mjs)           | Image generation               |
| [`examples/deepseek/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/discovery/models.mjs)         | Listing models                 |
| [`examples/deepseek/safety/moderation.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/safety/moderation.mjs)       | Content moderation             |
| [`examples/deepseek/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/deepseek/multimodal/vision.mjs)       | Vision (V3)                    |

## OpenRouter Examples

| Example                                                                                                                                 | Description                          |
| :-------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| [`examples/openrouter/chat/basic.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openrouter/chat/basic.mjs)               | Multi-model chat gateway             |
| [`examples/openrouter/chat/streaming.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openrouter/chat/streaming.mjs)       | Unified streaming across 300+ models |
| [`examples/openrouter/chat/tools.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openrouter/chat/tools.mjs)               | Cross-provider function calling      |
| [`examples/openrouter/chat/reasoning.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openrouter/chat/reasoning.mjs)       | Accessing DeepSeek & o1 reasoning    |
| [`examples/openrouter/discovery/models.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openrouter/discovery/models.mjs)   | Exploring the global model library   |
| [`examples/openrouter/multimodal/vision.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openrouter/multimodal/vision.mjs) | Unified vision API for all models    |
| [`examples/openrouter/embeddings/create.mjs`](https://github.com/node-llm/node-llm/blob/main/examples/openrouter/embeddings/create.mjs) | Aggregated embedding services        |
