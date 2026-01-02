---
layout: default
title: Examples
nav_order: 7
---

# Examples

A comprehensive list of runnable examples available in the [examples/](https://github.com/eshaiju/node-llm/tree/main/examples) directory of the repository.

## OpenAI Examples

| Example | Description |
| :--- | :--- |
| `examples/openai/chat/basic.mjs` | Basic chat with streaming |
| `examples/openai/chat/events.mjs` | Lifecycle hooks (onNewMessage, etc) |
| `examples/openai/chat/tools.mjs` | Automatic tool execution |
| `examples/openai/chat/structured.mjs` | Zod schema validation |
| `examples/openai/multimodal/vision.mjs` | Image analysis via URL |
| `examples/openai/multimodal/files.mjs` | Analyzing local files |
| `examples/openai/images/generate.mjs` | DALL-E 3 Generation |
| `examples/openai/safety/moderation.mjs` | Custom safety thresholds |

## Gemini Examples

| Example | Description |
| :--- | :--- |
| `examples/gemini/chat/basic.mjs` | Streaming chat with Gemini 1.5 |
| `examples/gemini/chat/json_mode.mjs` | Native JSON mode |
| `examples/gemini/multimodal/video.mjs` | Analyzing video files |
| `examples/gemini/multimodal/audio.mjs` | Native audio understanding |
| `examples/gemini/multimodal/files.mjs` | Multi-file context |

## Anthropic Examples

| Example | Description |
| :--- | :--- |
| `examples/anthropic/chat/basic.mjs` | Claude 3.5 Sonnet Chat |
| `examples/anthropic/chat/tool_use.mjs` | Tool calling with Claude |
| `examples/anthropic/multimodal/pdf.mjs` | Native PDF analysis |
| `examples/anthropic/multimodal/vision.mjs` | Image understanding |

## Ollama Examples

| Example | Description |
| :--- | :--- |
| `examples/ollama/chat/basic.mjs` | Local model chat |
| `examples/ollama/chat/streaming.mjs` | Streaming local inference |
| `examples/ollama/chat/tools.mjs` | Function calling with Llama 3.1 |
| `examples/ollama/multimodal/vision.mjs` | Multi-modal local analysis |
| `examples/ollama/embeddings/similarity.mjs` | Vector similarity search |
| `examples/ollama/discovery/list.mjs` | Inspecting local model library |

## DeepSeek Examples

| Example | Description |
| :--- | :--- |
| `examples/deepseek/chat/basic.mjs` | Basic chat with DeepSeek |
| `examples/deepseek/chat/reasoning.mjs` | DeepSeek-R1 reasoning tracking |
| `examples/deepseek/chat/streaming.mjs` | Streaming chat responses |
| `examples/deepseek/chat/tools.mjs` | Function calling with DeepSeek |
| `examples/deepseek/chat/structured.mjs` | Structured JSON output |
| `examples/deepseek/embeddings/basic.mjs` | Generating embeddings |
