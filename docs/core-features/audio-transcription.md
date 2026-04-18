---
layout: default
title: Audio Transcription
parent: Core Features
nav_order: 6
description: Convert speech to text using specialized models like Whisper or leverage multimodal models for native audio understanding and analysis.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.0.0+</span>
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Convert audio files to text using models like OpenAI's Whisper or Google's Gemini. `NodeLLM` supports both raw transcription and multimodal chat analysis.

---

## Basic Transcription

Use `NodeLLM.transcribe()` for direct speech-to-text conversion.

```ts
const text = await NodeLLM.transcribe("meeting.mp3", {
  model: "whisper-1"
});

console.log(text.toString());
```

---

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

### Diarization & Native Word Timestamps <span style="background-color: #0d47a1; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.16.0</span>

NodeLLM supports speaker identification (diarization) and word-level timestamps.

```ts
const response = await NodeLLM.transcribe("meeting.mp3", {
  model: "whisper-1", // or "gpt-4o-transcribe-diarize"
  timestamp_granularities: ["word", "segment"],
  speakerNames: ["Alice", "Bob"]
});
```

### Accessing Detailed Metadata

The `transcribe` method returns a `Transcription` object that provides rich metadata for analysis and persistence.

```ts
console.log(`Duration: ${response.duration}s`);

// 1. Iterating through segments
for (const segment of response.segments) {
  const speaker = segment.speaker ? `${segment.speaker}: ` : "";
  console.log(`[${segment.start}s - ${segment.end}s] ${speaker}${segment.text}`);
}

// 2. Word-level precision (if requested)
console.log(response.words[0]); 
// => { word: "Hello", start: 0.5, end: 0.8 }

// 3. Database Persistence
// Every transcription has a .meta property for easy storage
const record = {
  audio_id: "audio_123",
  transcript: response.text,
  metadata: response.meta // Full serializable object
};
```

---

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

---

## Error Handling

Audio files can be large and prone to timeouts.

```ts
try {
  await NodeLLM.transcribe("large-file.mp3");
} catch (error) {
  console.error("Transcription failed:", error.message);
}
```
