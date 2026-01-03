# Changelog

All notable changes to this project will be documented in this file.

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
