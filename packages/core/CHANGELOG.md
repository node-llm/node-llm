# Changelog
 
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
    *   Users can now import `z` directly: `import { LLM, z } from "@node-llm/core"`.

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
