# Changelog

## 0.4.0 (2025-01-01)

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
