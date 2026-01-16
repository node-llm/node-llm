---
layout: default
title: Audio Transcription
parent: Core Features
nav_order: 6
description: Convert speech to text using specialized models like Whisper or leverage multimodal models for native audio understanding and analysis.
---

# {{ page.title }}

{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents

{: .no_toc .text-delta }

1. TOC
{:toc}

---

Convert audio files to text using models like OpenAI's Whisper or Google's Gemini. \`NodeLLM\` supports both raw transcription and multimodal chat analysis.

## Basic Transcription

Use `NodeLLM.transcribe()` for direct speech-to-text conversion.

```ts
const text = await NodeLLM.transcribe("meeting.mp3", {
  model: "whisper-1"
});

console.log(text.toString());
```

## Advanced Options

### Speed vs Accuracy

You can choose different models or parameters depending on your needs.

```ts
await NodeLLM.transcribe("audio.mp3", {
  model: "whisper-1",
  language: "en", // ISO-639-1 code hint to improve accuracy
  prompt: "ZyntriQix, API" // Guide the model with domain-specific terms
});
```

### Accessing Segments & Timestamps

The `transcribe` method returns a `Transcription` object that contains more than just text. You can access detailed timing information if supported by the provider (e.g., using `response_format: 'verbose_json'` with OpenAI).

```ts
const response = await NodeLLM.transcribe("interview.mp3", {
  params: { response_format: "verbose_json" }
});

console.log(`Duration: ${response.duration}s`);

for (const segment of response.segments) {
  console.log(`[${segment.start}s - ${segment.end}s]: ${segment.text}`);
}
```

## Multimodal Chat vs. Transcription

There are two ways to work with audio:

1.  **Transcription (`NodeLLM.transcribe`)**: Best when you need the verbatim text.
    - _Result_: "Hello everyone today we are..."
2.  **Multimodal Chat (`chat.ask`)**: Best when you need to **analyze** or **summarize** the audio directly, without seeing the raw text first. Supported by models like `gemini-1.5-pro` and `gpt-4o`.

```ts
// Multimodal Chat Example
const chat = NodeLLM.chat("gemini-1.5-pro");

await chat.ask("What is the main topic of this podcast?", {
  files: ["podcast.mp3"]
});
```

## Error Handling

Audio files can be large and prone to timeouts.

```ts
try {
  await NodeLLM.transcribe("large-file.mp3");
} catch (error) {
  console.error("Transcription failed:", error.message);
}
```
