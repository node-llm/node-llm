# Changelog

## 1.1.0 (2026-01-03)

🎉 ** Official Release of @node-llm/core**

This is the first **recommended** stable release of `@node-llm/core`, a production-ready, provider-agnostic LLM library for Node.js.

> **Note**: Version `1.0.0` was an early experimental release. `1.1.0` is the first version recommended for production use.

### Core Features

*   **Unified API Across 6 Providers:**
    *   OpenAI (GPT-4o, o1, o3, DALL-E 3, Whisper, etc.)
    *   Anthropic (Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3 Haiku)
    *   Google Gemini (Gemini 1.5 Pro, Flash, etc.)
    *   DeepSeek (Chat V3, Reasoning R1)
    *   OpenRouter (540+ models aggregator)
    *   Ollama (Local inference)

*   **Chat & Streaming:**
    *   Standardized `chat()` and `stream()` APIs across all providers.
    *   Full conversation history management.
    *   Support for system prompts, temperature, max tokens.

*   **Multimodal Support:**
    *   Vision: Images (URLs, base64, local files)
    *   Audio: Transcription via Whisper
    *   Video: Gemini video analysis
    *   PDF: Claude 3.5 PDF analysis
    *   Intelligent file loading with automatic MIME type detection

*   **Tool Calling:**
    *   Automatic recursive tool execution loop.
    *   Provider-agnostic tool definition format.
    *   Support for multiple tools per request.

*   **Structured Output:**
    *   Zod schema validation with `.withSchema()`
    *   Automatic JSON parsing into `response.parsed`
    *   Support for OpenAI's strict mode

*   **Advanced Capabilities:**
    *   **Reasoning Models:** Direct access to chain-of-thought via `.reasoning` property (DeepSeek R1, OpenAI o1/o3)
    *   **Image Generation:** `NodeLLM.paint()` for DALL-E 3
    *   **Embeddings:** `NodeLLM.embed()` for semantic search
    *   **Moderation:** `NodeLLM.moderate()` for content safety
    *   **Model Discovery:** `NodeLLM.listModels()` for dynamic model enumeration

*   **Enterprise Features:**
    *   Custom endpoint support (Azure OpenAI, LiteLLM, LocalAI)
    *   `assumeModelExists` flag for private deployments
    *   Flexible configuration system (callback or object-based)
    *   Comprehensive retry logic

### Architecture

*   **Provider Isolation:** Zero coupling to vendor SDKs
*   **Type Safety:** Full TypeScript support with strict typing
*   **Standard Streams:** AsyncIterator-based streaming (no vendor-specific events)
*   **Capability Detection:** Runtime model capability validation

### Documentation

*   Full documentation site: [node-llm.eshaiju.com](https://node-llm.eshaiju.com)
*   Comprehensive examples for all providers and features
*   Migration guides and configuration references

### Testing

*   258+ passing tests (unit + integration)
*   VCR-based integration tests for deterministic CI
*   Full coverage of all providers and features

---

## 0.7.0 (2025-01-02)

### Features

*   **DeepSeek Provider Support:**
    *   Full integration of DeepSeek models (Chat V3).
    *   **Reasoning Support:** Added dedicated support for DeepSeek R1 reasoning models (access via `.reasoning` property).
    *   Implemented Chat, Streaming, Tools, and Context Caching.
    *   Added comprehensive examples and integration tests.

*   **Official Documentation Site:**
    *   Launched full documentation website at [node-llm.eshaiju.com](https://node-llm.eshaiju.com).
    *   Added custom domain (CNAME) support and GitHub Pages deployment workflow.

### Improvements & Refactoring

*   **Standardized Configuration:**
    *   Renamed configuration properties to `camelCase` (e.g., `openaiApiKey`) for better TypeScript/JavaScript alignment.
    *   Refactored `NodeLLM.configure` to enforce this single, idiomatic standard.
    *   Updated all documentation, examples, and tests to reflect this cleaner API.

*   **DeepSeek Integration Logic:**
    *   Fixed API key handling consistency and resolved test coverage issues for reasoning models.

*   **Documentation Branding:**
    *   Added official project logo and visual assets.
    *   Updated READMEs with comprehensive DeepSeek support guides.
 
## 0.6.0 (2025-01-01)

### Features

*   **Custom Endpoint Support (Azure & Custom Proxies):**
    *   Unified `OpenAIProvider` to seamlessly support Azure OpenAI, LiteLLM, Ollama, and other compatible endpoints via `OPENAI_API_BASE`.
    *   Implemented intelligent URL handling that correctly manages Azure-style endpoints with query parameters.
    *   Added support for manual header injection (e.g., `api-key`) required for Azure authentication.

*   **"Assume Model Exists" Mode:**
    *   Introduced `assumeModelExists: true` flag in `ChatOptions` and `LLMCore` methods.
    *   Allows usage of custom model IDs or private deployments (common in Azure) by bypassing internal registry validation checks.
    *   Enables full flexibility while retaining type safety and interface consistency.

*   **Documentation & Examples:**
    *   Added `custom-endpoints-example.mjs` demonstrating Chat, Streaming, Embeddings, and more with custom endpoints.
    *   Updated README with detailed guides for Azure configuration and custom model usage.
## 0.5.0 (2025-01-01)
 
### Features
 
*   **Anthropic Provider Support:**
    *   Added full support for Anthropic models (`claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-haiku`, etc.).
    *   Implemented Chat, Streaming, Vision, and native Tool Calling.
    *   Added support for PDF analysis (Claude 3.5 exclusive).
    *   Implemented automated JSON schema enforcement via custom instruction injection for reliable structured outputs.

*   **Unified Structured Output (Zod & JSON Schema):**
    *   Standardized `.withSchema()` functionality across all providers (OpenAI, Gemini, Anthropic).
    *   Enabled both Zod-based schemas and manual JSON Schema objects.
    *   Enhanced `response.parsed` to automatically handle response parsing for all supported providers.

*   **Simplified API Exports:**
    *   Added `z` (Zod) as a direct export from `@node-llm/core` to simplify downstream dependency management.
    *   Users can now import `z` directly: `import { NodeLLM, z } from "@node-llm/core"`.

### Improvements

*   **Expanded Test Coverage:**
    *   Implemented comprehensive unit test suites for all individual provider components (Capabilities, Errors, Utils, Chat, Models).
    *   Verified full coverage for Anthropic, Gemini, and OpenAI handlers.

*   **Robust Documentation:**
    *   Added new `structured.mjs` examples for all providers.
    *   Updated READMEs with clearer configuration steps and expanded feature matrices.


## 0.4.1 (2025-01-01)

### Features

*   **Gemini Provider Support:**
    *   Added full support for Google's Gemini models (`gemini-1.5-pro`, `gemini-1.5-flash`, etc.).
    *   Implemented `chat`, `stream`, `embed`, `vision`, and `tool-calling` capabilities.
    *   Added `sanitizeSchema` utility to handle provider-specific schema requirements.

*   **Structured Output & JSON Mode:**
    *   Added robust support for Structured Output using Zod schemas via `.withSchema()`.
    *   Added JSON Mode support via `responseFormat: { type: "json_object" }`.
    *   Implemented automatic parsing of JSON responses into `response.parsed`.
    *   *Note: Currently fully supported on OpenAI. Gemini support is fenced with clear error messages until API stabilizes.*

*   **Capability Management:**
    *   Refined `Capabilities` system to accurately report model features (vision, tools, etc.).
    *   Added validation to throw clear errors if a requested feature is not supported by the selected model.

### Improvements

*   **Test Suite Reorganization:**
    *   Restructured `packages/core/test/integration` to mirror the `examples/` directory structure.
    *   Moved pure unit tests to `packages/core/test/unit`.
    *   Categorized tests by feature (chat, multimodal, safety, discovery, etc.).

*   **Documentation:**
    *   Updated README with detailed examples for Structured Output, JSON Mode, and Gemini usage.
