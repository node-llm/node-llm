---
layout: default
title: Image Generation
nav_order: 7
parent: Core Features
---

# Image Generation

Generate images from text descriptions using models like DALL-E, Imagen, and others.

## Basic Usage

The simplest way is using `LLM.paint(prompt)`.

```ts
// Uses default model (e.g. dall-e-3)
const image = await LLM.paint("A red panda coding");

console.log(`Image URL: ${image}`); // Acts as a string URL
```

## Choosing Models & Sizes

Customize the model and dimensions.

```ts
const image = await LLM.paint("A red panda coding", {
  model: "dall-e-3",
  size: "1024x1792", // Portrait
  quality: "hd"      // DALL-E 3 specific
});
```

Supported sizes vary by model. Check your provider's documentation.

## Working with the Image Object

The return value is a `GeneratedImage` object which behaves like a URL string but contains rich metadata and helper methods.

```ts
const image = await LLM.paint("A landscape");

// Metadata
console.log(image.url);           // "https://..."
console.log(image.revisedPrompt); // "A photorealistic landscape..." (DALL-E 3)
console.log(image.mimeType);      // "image/png"

// Check if it's base64 (some providers return data, not URLs)
if (image.isBase64) {
  console.log("Image data received directly.");
}
```

## Saving & Processing

You can easily save the image or get its raw buffer for further processing (e.g., uploading to S3).

```ts
// Save to disk
await image.save("./output.png");

// Get raw buffer (works for both URL and Base64 source)
const buffer = await image.toBuffer();
console.log(`Size: ${buffer.length} bytes`);

// Stream it (e.g. to HTTP response)
const stream = await image.toStream();
stream.pipe(process.stdout);
```
