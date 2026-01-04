---
layout: default
title: Embeddings
parent: Core Features
nav_order: 3
---

# Embeddings

Embeddings are vector representations of text used for semantic search, clustering, and similarity comparisons. `NodeLLM` provides a unified interface for generating embeddings across different providers.

## Basic Usage

### Single Text
```ts
import { NodeLLM } from "@node-llm/core";

const embedding = await NodeLLM.embed("Ruby is a programmer's best friend");

console.log(embedding.vector);       // Float32Array[] (e.g., 1536 dimensions)
console.log(embedding.dimensions);   // 1536
console.log(embedding.model);        // "text-embedding-3-small" (default)
console.log(embedding.usage.total_tokens); // Token count
```

### Batch Embeddings
Always batch multiple texts in a single call when possible. This is much more efficient than calling `embed` in a loop.

```ts
const embeddings = await NodeLLM.embed([
  "First text",
  "Second text",
  "Third text"
]);

console.log(embeddings.vectors.length); // 3
console.log(embeddings.vectors[0]);     // Vector for "First text"
```

## Configuring Models

By default, `NodeLLM` uses `text-embedding-3-small`. You can change this globally or per request.

### Global Configuration
```ts
NodeLLM.configure({
  defaultEmbeddingModel: "text-embedding-3-large"
});
```

### Per-Request
```ts
const embedding = await NodeLLM.embed("Text", {
  model: "text-embedding-004" // Google Gemini model
});
```

### Custom Models
For models not in the registry (e.g., Azure deployments or new releases), use `assumeModelExists`.

```ts
const embedding = await NodeLLM.embed("Text", {
  model: "new-embedding-v2",
  provider: "openai",
  assumeModelExists: true
});
```

## Reducing Dimensions

Some models (like `text-embedding-3-large`) allow you to reduce the output dimensions to save on storage and compute, with minimal loss in accuracy.

```ts
const embedding = await NodeLLM.embed("Text", {
  model: "text-embedding-3-large",
  dimensions: 256
});

console.log(embedding.vector.length); // 256
```

## Best Practices

1.  **Batching**: Use `NodeLLM.embed(["text1", "text2"])` instead of serial calls.
2.  **Caching**: Embeddings are deterministic for a given model and text. Cache them in your database to save costs.
3.  **COSINE SIMILARITY**: To compare two vectors, calculate the cosine similarity. `NodeLLM` does not include math utilities to keep the core light, but you can implement it easily:

    ```ts
    function cosineSimilarity(A: number[], B: number[]) {
      const dotProduct = A.reduce((sum, a, i) => sum + a * B[i], 0);
      const magnitudeA = Math.sqrt(A.reduce((sum, a) => sum + a * a, 0));
      const magnitudeB = Math.sqrt(B.reduce((sum, b) => sum + b * b, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    }
    ```

## Error Handling

Wrap calls in try/catch blocks to handle API outages or rate limits.

```ts
try {
  await NodeLLM.embed("Text");
} catch (error) {
  console.error("Embedding failed:", error.message);
}
```
