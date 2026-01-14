---
layout: default
title: Custom Providers
parent: Advanced
nav_order: 3
description: Extend NodeLLM with support for proprietary models, internal APIs, or legacy systems using our clean BaseProvider architecture.
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

One of the core design goals of \`NodeLLM\` is provider-agnosticism. While we ship with support for major providers, you can easily add your own custom provider for internal APIs, proprietary models, or legacy systems.

The **recommended** way to create a custom provider is by extending the `BaseProvider` class.

## Why BaseProvider?

Extending `BaseProvider` instead of implementing the raw `Provider` interface gives you several advantages:
1.  **Safety**: It provides default implementations for features you might not support (like tools, embeddings, or vision), which will throw clean `UnsupportedFeatureError`s instead of failing with undefined errors.
2.  **Consistency**: It ensures your provider follows the project's internal mapping and logging standards.
3.  **Less Boilerplate**: You only need to implement the methods your service actually provides.

## Creating a Provider

To create a new provider, extend `BaseProvider` and implement the abstract methods.

> **Note**: The examples below use TypeScript. If you are using plain JavaScript (`.js` or `.mjs`), remember to remove access modifiers like `public` and `protected`.

```ts
import { NodeLLM, BaseProvider, ChatRequest, ChatResponse } from "@node-llm/core";

class MyCustomProvider extends BaseProvider {
  constructor(config: { apiKey: string, region: string }) {
    super();
    this.apiKey = config.apiKey;
    this.region = config.region;
  }

  // Required: A unique string identifier for your provider
  protected providerName() {
    return "my-custom-service";
  }

  // Required: The base URL for your API
  public apiBase() {
    return `https://api.${this.region}.my-service.com/v1`;
  }

  // Required: Any headers needed for authentication
  public headers() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };
  }

  // Required: Define the main chat implementation
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return {
      content: "Hello from my custom provider!",
      usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 }
    };
  }

  // Required: Provide a default model ID
  public defaultModel(feature?: string): string {
    return "my-model-v1";
  }
}
```

## Defining Capabilities

Capabilities tell NodeLLM what your provider is actually capable of. By default, `BaseProvider` assumes most advanced features are disabled. You can override these to opt-in to specific framework behaviors.

```ts
class MyCustomProvider extends BaseProvider {
  // ... rest of implementation

  public capabilities = {
    ...this.defaultCapabilities(), // Start with defaults
    
    // Enable support for OpenAI-style 'developer' roles
    supportsDeveloperRole: (modelId: string) => true,
    
    // Declare vision support
    supportsVision: (modelId: string) => modelId.includes("vision"),
    
    // Declare the context window size
    getContextWindow: (modelId: string) => 128000
  };
}
```

Notably, if `supportsDeveloperRole` is true, NodeLLM will automatically map isolated system instructions to the `developer` role. If false (the default), it will keep them as the standard `system` role.

## Registering Your Provider

Register your provider with `NodeLLM` during your application's initialization.

```ts
// 1. Register the factory function
NodeLLM.registerProvider("my-service", () => new MyCustomProvider());

// 2. Use it globally
NodeLLM.configure({ provider: "my-service" });

const response = await NodeLLM.chat().ask("Hi!");
```

## Advanced Implementation

### Supporting Streaming
If your provider supports streaming, override the `stream` generator:

```ts
async *stream(request: ChatRequest) {
  // Simulated streaming
  const words = ["This", "is", "a", "stream"];
  for (const word of words) {
    yield { content: word + " " };
  }
}
```

### Handling Scoped Credentials
It's best to pull configuration from environment variables or the `NodeLLM.configure` block within your factory function:

```ts
NodeLLM.registerProvider("internal-llm", () => {
  return new MyCustomProvider({
    apiKey: process.env.INTERNAL_LLM_KEY,
    region: "us-east-1"
  });
});
```

### 3. Handling Extra Fields
End-users might want to pass provider-specific parameters that aren't part of the standard `NodeLLM` API. These can be sent using `.withParams()` and will be available in the `request` object passed to your `chat` method.

```ts
async chat(request) {
  // Destructure to separate standard fields from custom ones
  const { model, messages, ...customParams } = request;
  
  if (customParams.internal_routing_id) {
    // Handle custom logic...
  }
}
```

### Handling Request Timeouts

NodeLLM passes `requestTimeout` (in milliseconds) through all request interfaces. Your custom provider should respect this timeout to ensure consistent security behavior across all providers.

Use the built-in `fetchWithTimeout` utility:

```ts
import { fetchWithTimeout } from "@node-llm/core/utils/fetch";

async chat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetchWithTimeout(
    `${this.apiBase()}/chat`,
    {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages
      })
    },
    request.requestTimeout  // Pass through the timeout
  );

  const json = await response.json();
  return {
    content: json.response,
    usage: json.usage
  };
}
```

**Note**: The `requestTimeout` parameter is available in all provider methods:
- `chat(request)`, `stream(request)`, `paint(request)`, `transcribe(request)`, `moderate(request)`, `embed(request)`



## Example Implementation

See the [Custom Provider Example](https://github.com/node-llm/node-llm/blob/main/examples/custom-provider.mjs) in the repository for a complete working implementation including error handling, streaming, and extra field support.
