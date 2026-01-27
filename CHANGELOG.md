# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-01-27 (@node-llm/orm)

### Features

- **Type-Safe Schema Support**: Updated `BaseChat` to handle generic types for structured outputs, mirroring core package improvements.
- **Dependency Update**: Bumped peer dependency for `@node-llm/core` to `^1.9.0`.

## [0.3.0] - 2026-01-27 (@node-llm/testing)

### Features

- **Mocker History**: Added internal call history tracking to the `Mocker` class.
- **Enhanced Verification**: Added `getCalls()` and `getLastCall()` methods for detailed assertion of mock interactions during tests.
- **Type Safety**: Improved type definitions for mock matchers and responses.

## [1.9.0] - 2026-01-27 (@node-llm/core)

### Features

- **Type-Safe Structured Outputs**: Enhanced `.withSchema(schema)` to return a generic `Chat<T>` instance, providing full TypeScript intellisense for validated data.
- **Robust JSON Extraction**: New `extractJson` utility that handles conversational filler and markdown code blocks, ensuring reliable parsing even from "chatty" models.
- **ActiveRecord-style Response Validation**:
  - Added `.data` property to `ChatResponseString` with automatic Zod validation.
  - Added `.safeData` (null on failure) and `.isValid` helpers for elegant error handling.
- **Community Governance**:
  - Added `SECURITY.md` with an "Agentic Zero Trust" philosophy and formal reporting process.
  - Added `CODE_OF_CONDUCT.md` based on the Contributor Covenant.

## [1.8.0] - 2026-01-24 (@node-llm/core)

### Features

- **AWS Bedrock Provider**: Complete integration with Amazon Bedrock service.
  - Support for Converse API with custom SigV4 authentication.
  - Nova model family support (nova-lite, nova-pro, nova-micro).
  - Streaming responses for real-time text generation.
  - Multimodal vision capabilities for image understanding.
  - Native reasoning support for advanced model capabilities.
  - Embeddings support for text vectorization.
  - Image generation using Amazon Titan models.
  - Prompt caching for improved performance and cost efficiency.
  - Guardrails support for content safety and compliance.
  - User-friendly error mapping for billing and access issues.
  - Model listing functionality for available Bedrock models.

### Improvements

- **Token Calculation**: Fixed token usage calculation for better accuracy.
- **Documentation**: Added comprehensive documentation for Bedrock provider.
- **Test Stability**: Improved VCR infrastructure for multi-provider support and stabilized test suite.

## [1.7.0] - 2026-01-22 (@node-llm/core)

### Features

- **Extended Thinking**: Standardized support for reasoning-focused models like OpenAI o1/o3, Anthropic Claude 3.7, and DeepSeek R1.
  - Added `.withThinking({ budget })` and `.withEffort(level)` fluent methods to `Chat`.
  - Structured `ThinkingResult` in responses containing `text`, `signature`, and `tokens`.
  - Multi-provider support: OpenAI (reasoning effort), Anthropic (thinking budget), Gemini (thought parts), and DeepSeek (reasoning content).
  - Streaming support for thinking chunks across all supported providers.

## [0.2.0] - 2026-01-22 (@node-llm/orm)

### Features

- **Thinking Persistence**: Added support for persisting extended thinking data.
  - New fields in `LlmMessage`: `thinkingText`, `thinkingSignature`, and `thinkingTokens`.
  - New field in `LlmToolCall`: `thoughtSignature`.
  - Fluent `.withThinking()` and `.withEffort()` methods added to `BaseChat`.
  - Automatic aggregation and storage of thinking results in both standard and streaming (`askStream`) modes.
- **Incremental Migrations**: Formalized database management workflow.
  - Shifted from `db push` to professional **Prisma Migrate** workflow for safe, versioned schema updates.
  - Added repository-wide `prisma/migrations` folder for reproducible deployments.
  - New built-in scripts: `npm run db:migrate`, `npm run db:deploy`, and `npm run db:status`.
  - Comprehensive [Database Migration Guide](https://node-llm.eshaiju.com/orm/migrations) for application scaling.

## [1.6.2] - 2026-01-21 (@node-llm/core)

### Extensibility

- **fetchWithTimeout Export**: Exported `fetchWithTimeout` utility from the core package to support custom providers that need manual request signing while maintaining library-standard timeout protections.

## [0.1.2] - 2026-01-21 (@node-llm/orm)

### Compatibility

- **Custom Provider Support**: Verified and improved support for custom LLM providers. Custom providers registered via `NodeLLM.registerProvider()` now work seamlessly with the ORM's automated persistence layer.

## [1.6.1] - 2026-01-19 (@node-llm/core)

### Documentation & Examples

- **Example Reorganization**: Better structure for examples, separating full applications from scripts.
- **Improved READMEs**: Updated examples to use absolute GitHub URLs for better compatibility with npm.
- **ORM Integration**: Added references to the new `@node-llm/orm` package.
- **Test Stability**: Fixed integration test paths for vision and audio examples after reorganization.

## [0.1.1] - 2026-01-19 (@node-llm/orm)

### Fixed

- **Broken Links**: Corrected documentation and example links in README.

## [0.1.0] - 2026-01-18 (@node-llm/orm)

### Added

- **Initial Release**: Comprehensive persistence layer for NodeLLM using Prisma.
- **Chat Persistence**: Automatic tracking of chat sessions, messages, and history.
- **Streaming Support**: `chat.askStream()` with automatic token persistence.
- **Tool Audit Trail**: Tracking of every tool execution, parameters, and results.
- **API Metrics**: Automatic logging of latency, token usage, and cost.

## [1.6.0] - 2026-01-16 (@node-llm/core)

### Major Changes

- **Rename LLM to NodeLLM**: Standardized naming across the library. `createLLM` now returns a `NodeLLM` instance.
- **Singleton Removal**: Moved away from global singleton patterns to support multiple independent LLM instances.
- **Improved Factory Pattern**: Refactored `createLLM()` for better provider initialization and type safety.

## [1.5.4] - 2026-01-15

### Fixed

- **Async I/O Safety**: Refactored internal file loading utilities (`Binary.ts`, `FileLoader.ts`) to strictly use non-blocking `fs.promises` for all file operations, eliminating potential event loop blocking in high-throughput node servers.

### Changed

- **Centralized Logging**: Replaced scattered `console.log/error/warn` calls with a unified `Logger` adapter. All internal library logs now respect `NODELLM_DEBUG=true` configuration and use a consistent format, preventing log pollution in production environments.

## [1.5.3] - 2026-01-15

### Fixed

- **Multi-turn Tool Loop State Loss (CRITICAL)**: Fixed a critical bug where `response_format` (Structured Outputs), `temperature`, `max_tokens`, and provider-specific `params` were being dropped after the first tool call in agentic workflows. This caused the model to revert to plain text or markdown in subsequent turns, resulting in empty or malformed data when using `withSchema()`. The fix ensures all configuration state is maintained across all tool-calling turns in `Chat.ask()`.
- **ToolHandler Serialization**: Ensuring tool return values are always stringified before being sent back to the LLM. This fixes issues where tools returning objects would cause provider errors, enabling better "AI Self-Correction" workflows where the model sees the raw object data.

### Added

- **AbortSignal Support**: Added proper cancellation support for long-running LLM requests via `signal?: AbortSignal` in `AskOptions`. Users can now abort requests using standard `AbortController`, enabling proper cleanup in interactive applications and server environments. The signal is propagated through all tool-calling turns and underlying fetch requests.

## [1.5.2] - 2026-01-15

### Fixed

- **ESM & Dotenv Safety**: Implemented lazy initialization for all environment-backed configuration (like `OPENAI_API_KEY`). This resolves race conditions where `process.env` might be accessed before `dotenv.config()` is called in ESM modules.
- **OpenAI o1/o3-mini Compatibility**: Automatically map `max_tokens` to `max_completion_tokens` for OpenAI reasoning models, which are required for these specific models.
- **withProvider Inheritance**: Fixed a bug where scoped instances created via `withProvider()` failed to inherit global defaults due to getter-based property enumeration.
- **Process Lifecycle Protection**: Added unreferenced timers and explicit exit handling to prevent Node.js processes from hanging after completion.
- **Ollama Base URL**: Fixed a typo in the `ollamaApiBase` configuration setter.

### Added

- **Reasoning Content Capture**: Support for capturing and returning `reasoning_content` (thinking text) from OpenAI reasoning models.
- **Enhanced Usage Tracking**: Precise capture of `reasoning_tokens` and `cached_tokens` in usage metadata for supported providers.

### Changed

- **Internal Architecture Cleanup**: Refactored shared validation and tool execution logic between `Chat.ask()` and `Chat.stream()` for 100% feature parity and better maintainability.
- **Configuration Snapshotting**: Enhanced the internal configuration system to support dynamic property discovery and cloning for custom providers.

## [1.5.0] - 2026-01-12

### Added

- **🚦 Tool Execution Policies**: Introduced granular control over tool execution with three modes:
  - `auto` (default): Tools execute automatically as proposed by the LLM
  - `confirm`: Human-in-the-loop approval via `onConfirmToolCall` hook before each tool execution
  - `dry-run`: Model proposes tools but execution is prevented, returning the plan for inspection
- **ToolExecutionMode Enum**: New exported enum for type-safe execution mode configuration
- **Tool Call Inspection**: Added `tool_calls` property to `ChatResponseString` for inspecting proposed tool executions
- **Enhanced Observability**: New audit hooks for comprehensive tool execution tracking:
  - `onToolCallStart`: Triggered when a tool call begins
  - `onToolCallEnd`: Triggered when a tool call completes successfully
  - `onToolCallError`: Triggered when a tool call fails
- **Security Documentation**: New comprehensive [Security & Compliance](https://node-llm.eshaiju.com/advanced/security.html) guide covering:
  - Smart Context Isolation
  - Content Policy Hooks
  - Tool Execution Policies
  - Observability as Security
  - Loop Protection & Resource Limits (new section)
- **🛡️ Request Timeout Security**: Comprehensive timeout protection across all API operations
  - Global `requestTimeout` configuration (default: 30 seconds)
  - Per-chat and per-request timeout overrides
  - Applies to: chat, streaming, image generation, transcription, embeddings, and moderation
  - Prevents DoS attacks, hanging requests, and resource exhaustion
- **🛡️ Global MaxTokens Configuration**: Cost control and output limiting for text generation
  - Global `maxTokens` configuration (default: 4096 tokens)
  - Per-chat and per-request token limit overrides
  - Prevents excessive output generation and cost overruns
  - Resolution order: per-request → chat-level → global config → default
- **🛡️ Complete Security Framework**: Four-pillar defense-in-depth protection
  - `requestTimeout`: DoS protection (new)
  - `maxRetries`: Retry storm prevention
  - `maxToolCalls`: Infinite loop prevention
  - `maxTokens`: Cost control (new)
- **Custom Provider Timeout Support**: Updated custom provider documentation with `fetchWithTimeout` utility guidance
- **Real-World Example**: Added `examples/security-tool-policies.mjs` demonstrating human-in-the-loop security patterns

### Changed

- **Deprecated Hook Aliases**: `onToolCall` and `onToolResult` now internally map to `onToolCallStart` and `onToolCallEnd` for backward compatibility

### Documentation

- Updated configuration guide with security limits section
- Enhanced security documentation with Loop Protection & Resource Limits section
- Updated README with four-pillar security framework
- Added timeout handling to custom provider guide
- Updated tool calling documentation with execution policy examples
- Added tool execution policies to security documentation
- Enhanced README with observability and security features
- Added comprehensive security examples to documentation site

## [1.4.0] - 2026-01-06

### Added

- **Plugin System for Custom Providers**: Introduced `NodeLLM.registerProvider()` and exported `BaseProvider`, allowing developers to easily add proprietary or custom LLM services at runtime.
- **Improved Extensibility Documentation**: Dedicated "Custom Providers" guide with real-world patterns for handling provider-specific configurations and extra fields.
- **Community Health Patterns**: Added standardized GitHub issue templates (`bug_report.yml`, `feature_request.yml`), contributing guide, and pull request templates.

## [1.3.0] - 2026-01-05

### Added

- **Class-based Tool DSL**: Official documentation and examples for creating tools using a clean, class-based syntax extending `Tool`.
- **Enhanced Example Library**: Added missing runnable examples to the documentation, covering embeddings, usage tracking, and provider-specific features.
- **Improved Documentation Navigation**: Fixed internal linking and integrated all examples directly into the documentation site.

### Changed

- **Documentation Imports**: Updated all documentation and examples to recommend importing `z` directly from `@node-llm/core` instead of `zod`, promoting a more unified API surface.
- **Example Paths**: Converted all example file paths in the documentation into direct GitHub links for easier access.
- **Provider Consistency**: Ensured all providers (OpenAI, Gemini, Anthropic, DeepSeek) have a consistent set of documented examples.

## [1.2.0] - 2026-01-04

### Added

- **🚀 Streaming with Tool Calling**: Revolutionary feature enabling automatic tool execution during streaming across all providers (OpenAI, Anthropic, Gemini, DeepSeek). Tools are executed transparently and the stream continues with the model's final response.
- **🔍 Comprehensive Debug Logging**: Added detailed HTTP request/response logging for every feature and provider. Enable with `NODELLM_DEBUG=true` to see method, URL, status, and full payloads.
  - Coverage: Chat, Streaming, Images, Embeddings, Transcription, Moderation
  - Providers: OpenAI, Anthropic, Gemini, DeepSeek, Ollama
- **Enhanced Logger**: New `logRequest()` and `logResponse()` methods for structured logging
- **Tool Event Handlers in Streaming**: `onToolCall()` and `onToolResult()` now work seamlessly during streaming
- **Comprehensive Examples**: Added streaming + tools examples for all providers

### Changed

- Updated `ChatChunk` interface to support `tool_calls` field
- Enhanced `ChatStream` to handle multi-round tool execution loops
- All streaming providers now parse and yield tool calls

### Documentation

- Updated streaming documentation with tool calling examples
- Enhanced tools documentation to highlight streaming support
- Improved debugging documentation with comprehensive coverage details
- Updated README with streaming + tools examples and debug logging section

## [1.0.0] - 2026-01-03

### Added

- **Major Stable Release**: Consolidated architectural foundation for production-ready LLM integrations.
- **Advanced Streaming API**: Introduced a powerful global `Stream` utility supporting `.tee()`, `.toArray()`, and native `.abort()`.
- **Comprehensive Model Registry**: Synchronized with `models.dev` for verified models across OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, and Ollama.
- **First-class OpenRouter Support**: High-performance implementation with automated capability detection and discovery.
- **Enhanced Local LLM Support**: Deep integration with Ollama, including vision and tool-calling models.
- **Rich Documentation**: Complete documentation overhaul with dedicated provider guides, examples, and architectural deep-dives.

### Changed

- Refactored `Chat.stream()` to return the advanced `Stream` object.
- Standardized provider registration and error handling architecture.

## [0.8.0] - 2026-01-02

### Added

- **Ollama Provider**: Native support for local inference via Ollama.
- **Model Discovery**: Ability to list and inspect local models using `NodeLLM.listModels()`.
- **DeepSeek V3 and R1**: Full support for DeepSeek's latest chat and reasoning models.
- **Enhanced Model Registry**: Now includes Gemini 1.5 Flash 8B and popular local models with accurate pricing and capabilities.
- **Rich Documentation**: New guides and examples for local integration, vision, and tool-calling.

## [0.7.0] - 2026-01-02

### Added

- Unified configuration system via `NodeLLM.configure`.
- Better support for custom endpoints.

## [0.6.0] - 2026-01-01

### Added

- Initial support for DeepSeek R1 reasoning.
- Enhanced tool execution logic.
