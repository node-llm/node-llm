# node-llm

A provider-agnostic LLM core for Node.js, inspired by ruby-llm.

## Status
Early development (core chat + OpenAI provider working)

## Goals
- Provider-agnostic
- Minimal abstractions
- Streaming-first design
- No SDK lock-in

## Development

```bash
pnpm install
pnpm --filter @node-llm/core build
node test-openai.mjs
