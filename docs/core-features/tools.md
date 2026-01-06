---
layout: default
title: Tool Calling
nav_order: 5
parent: Core Features
---

# Tool Calling

`NodeLLM` simplifies function calling (tool use) by handling the execution loop automatically. You define the tools, and the library invokes them when the model requests it.

## Class-Based Tools ✨

The recommended way to define tools is by using the `Tool` class. This provides auto-generated JSON schemas and full type safety using `zod`.

```ts
import { NodeLLM, Tool, z } from "@node-llm/core";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a location";
  
  // Auto-generates JSON Schema
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    unit: z.enum(["celsius", "fahrenheit"]).default("celsius")
  });

  async execute({ location, unit }) {
    // Your business logic
    const weather = await fetchWeather(location);
    return { temp: 22, unit, condition: "Sunny" };
  }
}

// Register as a class (instantiated automatically) or instance
const chat = NodeLLM.chat().withTool(WeatherTool);
await chat.ask("What is the weather in SF?");
```

### Benefits:
*   **No Boilerplate**: No need to write manual JSON schemas.
*   **Type Safety**: `execute()` arguments are automatically typed from your schema.
*   **Self-Documenting**: The Zod `.describe()` calls are automatically pulled into the tool's description for the LLM.

### Defining Parameters with Zod

`NodeLLM` uses `zod-to-json-schema` under the hood. Most standard Zod types work out of the box:

| Zod Type | Description |
| :--- | :--- |
| **All Fields** | **Required by default**. |
| `z.string()` | Basic text string. |
| `z.number()` | Number (integer or float). |
| `z.boolean()` | Boolean flag. |
| `z.enum(["a", "b"])` | String restricted to specific values. |
| `z.object({...})` | Nested object. |
| `z.array(z.string())` | Array of items. |
| `.describe("...")` | **Crucial**: Adds a description for the LLM. |
| `.optional()` | Marks the field as not required. |
| `.default(val)` | Sets a default value if the LLM doesn't provide it. |

## Using Tools in Chat

Use the fluent `.withTool()` or `.withTools()` API to register tools for a chat session. By default, tools are appended. You can use the `replace` option to clear previous tools.

```ts
// Append tools
const chat = NodeLLM.chat("gpt-4o")
  .withTools([WeatherTool, CalculatorTool]);

// Replace all existing tools with a new list
chat.withTools([SearchTool], { replace: true });

const reply = await chat.ask("What is the weather in London?");
```

## Tools Work in Streaming Too! ✨

Tools now work seamlessly with streaming! The same tool execution happens automatically during streaming:

```ts
const chat = NodeLLM.chat("gpt-4o").withTool(WeatherTool);

// Tool is automatically executed during streaming
for await (const chunk of chat.stream("What's the weather in Paris?")) {
  process.stdout.write(chunk.content || "");
}
```

See the [Streaming documentation](streaming.html#streaming-with-tools-) for more details.

## Parallel Tool Calling

If the provider supports it (like OpenAI and Anthropic), the model can call multiple tools in a single turn. `NodeLLM` handles the concurrent execution of these tools automatically.

See [examples/openai/chat/parallel-tools.mjs](https://github.com/eshaiju/node-llm/blob/main/examples/openai/chat/parallel-tools.mjs) for a demo.

## Advanced Tool Metadata

Some providers support additional metadata in tool definitions, such as Anthropic's **Prompt Caching**. You can include these fields in your tool class, and `NodeLLM` will pass them through.

```ts
class HistoryTool extends Tool {
  name = "get_history";
  description = "Get chat history";
  schema = z.object({ limit: z.number().default(10) });

  // Add provider-specific metadata
  cache_control = { type: 'ephemeral' };

  async execute({ limit }) {
    return [...];
  }

  // Override toLLMTool to include custom metadata if needed
  toLLMTool() {
    const def = super.toLLMTool();
    return {
      ...def,
      cache_control: this.cache_control
    };
  }
}
```

## Error Handling in Tools

How you handle errors in your `execute` method affects the conversation flow:

1.  **Recoverable Errors**: Return a JSON string describing the error. The model can often see this error and try to correct itself (e.g., retrying with different parameters).
    ```ts
    async execute({ id }) {
      if (!id) return JSON.stringify({ error: "Missing ID" });
      // ...
    }
    ```

2.  **Fatal Errors**: If you throw an exception inside a tool handler, `NodeLLM` catches it and feeds the error message back to the model as a "Tool Error". This allows the model to apologize to the user or attempt a different strategy.

### Advanced: Raw JSON Schema

If you prefer to define your parameters using standard JSON Schema instead of Zod, you can pass a schema object directly to the `schema` property in your `Tool` class. This is useful for migrating existing tools or when you already have schema definitions.

```ts
class CustomTool extends Tool {
  name = "custom_lookup";
  description = "Lookup items in a legacy system";

  // Use Raw JSON Schema instead of Zod
  schema = {
    type: "object",
    properties: {
      sku: { type: "string", description: "Product SKU" },
      limit: { type: "integer", minimum: 1, maximum: 100 }
    },
    required: ["sku"]
  };

  async execute({ sku, limit }) {
    // Arguments are still passed as a single object
    return { status: "found" };
  }
}
```

### Function-Based Tools (Legacy)

For simply wrapping a function without a class, you can define a tool as a plain object with a `handler`.

```ts
const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: { 
        location: { type: 'string', description: 'City and state' } 
      },
      required: ['location']
    }
  },
  handler: async ({ location }) => {
    return JSON.stringify({ location, temp: 22, unit: 'celsius' });
  }
};

chat.withTool(weatherTool);
```

## Security Considerations

Treat arguments passed to your `execute` method as **untrusted user input**.

*   **Validate**: Always validate parameter types and ranges using libraries like `zod` inside the handler if critical.
*   **Sanitize**: Sanitize strings before using them in database queries or shell commands.
*   **Avoid Eval**: Never use `eval()` on inputs provided by the model.

## Debugging Tools

To see exactly what the model is calling and what your tool is returning, enable debug mode:

```bash
export NODELLM_DEBUG=true
```

You will see logs like:
`[NodeLLM] Tool call: get_weather { location: "Paris" }`
`[NodeLLM] Tool result: { temp: 15 }`
