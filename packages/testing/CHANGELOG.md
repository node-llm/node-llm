# Changelog

## [0.5.0] - 2026-02-07

### Added

- **Agent Testing Support**:
  - `mocker.callsTools()`: Mock responses that trigger multiple tool calls in one response.
  - `mocker.sequence()`: Return different responses for multi-turn agent conversations.
  - `mocker.times(n)`: Limit mock matches with fallthrough to next matching mock.
- **Improved Matching**: Changed from last-match to first-match semantics, enabling `times()` fallthrough patterns.

### Documentation

- Added "Testing Agents & AgentSessions" section to README.
- Added doc tests for `callsTools()`, `sequence()`, and `times()` methods.

## [0.2.0] - 2026-01-26

### Added

- **Call Verification**: Added `mocker.history`, `mocker.getCalls()`, and `mocker.getLastCall()` for spy-style assertions.
- **Prompt Snapshots**: Added `mocker.getLastCall().prompt` convenience accessor for snapshot testing of request structures.
- **Rich Type Persistence**: VCR now faithfully records and replays `Date`, `Map`, `Set`, `Buffer`, `RegExp`, `Infinity`, `NaN`, and `Error` objects using a new Smart Serializer.
- **Deep Scrubbing**: `Scrubber` now recurses into `Map` and `Set` collections to redact sensitive data.
- **Modern Cloning**: Switched to `structuredClone` for high-performance in-memory operations.

### Security

- **Hardened Scrubbing**: Fixed potential leak where secrets inside nested Maps/Sets were skipped by the scrubber.

### Improvements

- **Documentation**: Added comprehensive "Testing" section to project documentation and `llms.txt`.
- **Reliability**: VCR no longer corrupts binary data (Buffers) during recording.

## [0.1.0]

### Added

- Initial release
- VCR record/replay
- Fluent mocking
- CI-safe defaults
