---
layout: default
title: Multi-modal
parent: Core Features
nav_order: 2
---

# Multi-modal Capabilities

Modern LLMs can understand more than just text. `node-llm` provides a unified way to pass images, audio, video, and documents to models that support them.

## Smart File Handling

You can pass local paths or URLs directly to the `ask` method using the `files` option. `node-llm` automatically detects the file type and formats it correctly for the specific provider.

**Supported File Types:**
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Videos**: `.mp4`, `.mpeg`, `.mov`, `.avi`, `.webm`
- **Audio**: `.wav`, `.mp3`, `.ogg`, `.flac`
- **Documents**: `.pdf`, `.csv`, `.json`, `.xml`, `.md`, `.txt`
- **Code**: `.js`, `.ts`, `.py`, `.rb`, `.go`, etc.

## Working with Images (Vision)

Vision-capable models (like `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`) can analyze images.

```ts
const chat = NodeLLM.chat("gpt-4o");

// Analyze a local image
await chat.ask("What's in this image?", {
  files: ["./screenshot.png"]
});

// Analyze an image from a URL
await chat.ask("Describe this logo", {
  files: ["https://example.com/logo.png"]
});

// Compare multiple images
await chat.ask("Compare the design of these two apps", {
  files: ["./v1-screenshot.png", "./v2-screenshot.png"]
});
```

## Working with Audio

Audio-capable models (like `gemini-1.5-flash`) can listen to audio files and answer questions about them.

```ts
const chat = NodeLLM.chat("gemini-1.5-flash");

// Summarize a meeting recording
await chat.ask("Summarize the key decisions in this meeting", {
  files: ["./meeting.mp3"]
});

// Transcribe and analyze
await chat.ask("What was the tone of the speaker?", {
  files: ["./voicemail.wav"]
});
```

*Note: For pure transcription without chat, see [Audio Transcription](./audio-transcription).*

## Working with Videos

Video analysis is currently supported primarily by Google Gemini and limited OpenAI models. `node-llm` handles the upload and reference process seamlessly.

```ts
const chat = NodeLLM.chat("gemini-1.5-pro");

await chat.ask("What happens in this video?", {
  files: ["./demo_video.mp4"]
});
```

## Working with Documents (PDFs & Text)

You can provide full documents for analysis.

### Text & Code Files
For text-based files, `node-llm` reads the content and passes it as text context to the model.

```ts
const chat = NodeLLM.chat("claude-3-5-sonnet");

// Analyze code
await chat.ask("Explain potential bugs in this code", {
  files: ["./app/auth.ts"]
});
```

### PDFs
For PDFs, providers handled differently:
- **Anthropic**: Supports native PDF blocks (up to 10MB). `node-llm` handles the base64 encoding.
- **Gemini**: Supports PDF via File API.
- **OpenAI**: Often requires text extraction first (unless using Assistants API, which `node-llm` core interacts with as Chat). *Note: Ensure your provider supports the PDF modality directly or use a text extractor.*

```ts
await chat.ask("Summarize this contract", {
  files: ["./contract.pdf"]
});
```

## Automatic Type Detection

You don't need to specify the file type; `node-llm` infers it from the extension.

```ts
// Mix and match types
await chat.ask("Analyze these project resources", {
  files: [
    "diagram.png",       // Image
    "spec.pdf",          // Document
    "meeting.mp3",       // Audio
    "backend.ts"         // Code
  ]
});
```
