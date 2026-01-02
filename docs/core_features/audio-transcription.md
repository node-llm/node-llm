---
layout: default
title: Audio Transcription
nav_order: 6
parent: Core Features
---

# Audio Transcription

Convert audio files to text using models like OpenAI's Whisper or Google's Gemini. `node-llm` supports both raw transcription and multimodal chat analysis.

## Basic Transcription

Use `LLM.transcribe()` for direct speech-to-text conversion.

```ts
const text = await LLM.transcribe("meeting.mp3", {
  model: "whisper-1"
});

console.log(text.toString());
```

## Advanced Options

### Speed vs Accuracy
You can choose different models or parameters depending on your needs.

```ts
await LLM.transcribe("audio.mp3", {
  model: "whisper-1",
  language: "en",           // ISO-639-1 code hint to improve accuracy
  prompt: "ZyntriQix, API"  // Guide the model with domain-specific terms
});
```

### Accessing Segments & Timestamps

The `transcribe` method returns a `Transcription` object that contains more than just text. You can access detailed timing information if supported by the provider (e.g., using `response_format: 'verbose_json'` with OpenAI).

```ts
const response = await LLM.transcribe("interview.mp3", {
  params: { response_format: "verbose_json" }
});

console.log(`Duration: ${response.duration}s`);

for (const segment of response.segments) {
  console.log(`[${segment.start}s - ${segment.end}s]: ${segment.text}`);
}
```

## Multimodal Chat vs. Transcription

There are two ways to work with audio:

1.  **Transcription (`LLM.transcribe`)**: Best when you need the verbatim text.
    *   *Result*: "Hello everyone today we are..."
2.  **Multimodal Chat (`chat.ask`)**: Best when you need to **analyze** or **summarize** the audio directly, without seeing the raw text first. Supported by models like `gemini-1.5-pro` and `gpt-4o`.

```ts
// Multimodal Chat Example
const chat = LLM.chat("gemini-1.5-pro");

await chat.ask("What is the main topic of this podcast?", {
  files: ["podcast.mp3"]
});
```

## Error Handling

Audio files can be large and prone to timeouts.

```ts
try {
  await LLM.transcribe("large-file.mp3");
} catch (error) {
  console.error("Transcription failed:", error.message);
}
```
