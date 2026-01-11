# Changelog

All notable changes to this project will be documented in this file.

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
- **Comprehensive Model Registry**: Synchronized with `ruby_llm` to include **540+ models** across OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, and Ollama.
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
