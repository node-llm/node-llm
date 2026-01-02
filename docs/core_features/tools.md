---
layout: default
title: Tool Calling
nav_order: 5
parent: Core Features
---

# Tool Calling

`node-llm` simplifies function calling (tool use) by handling the execution loop automatically. You define the tools, and the library invokes them when the model requests it.

## Defining a Tool

Tools are defined as standard objects with a `type`, `function` definition, and a `handler`.

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
    // This function is executed when the model calls the tool
    const weather = await fetchWeatherAPI(location); 
    // Return a string or serializable object
    return JSON.stringify({ location, temp: 22, unit: 'celsius', condition: 'Sunny' });
  }
};
```

## Using Tools in Chat

Use the fluent `.withTool()` API to register tools for a chat session.

```ts
const chat = LLM.chat("gpt-4o")
  .withTool(weatherTool);

const reply = await chat.ask("What is the weather in London?");

console.log(reply.content); 
// The model will use the info from the tool to answer:
// "The weather in London is currently 22°C and sunny."
```

## Parallel Tool Calling

If the provider supports it (like OpenAI and Anthropic), the model can call multiple tools in a single turn. `node-llm` handles the concurrent execution of these tools automatically.

See [examples/openai/chat/parallel-tools.mjs](../../examples/openai/chat/parallel-tools.mjs) for a demo.

## Advanced Tool Metadata

Some providers support additional metadata in tool definitions, such as Anthropic's **Prompt Caching**. You can include these fields in your tool definition, and `node-llm` will pass them through.

```ts
const cachedTool = {
  type: 'function',
  function: {
    name: 'get_history',
    // ... params ...
  },
  // Provider-specific metadata key (like 'cache_control' for Anthropic)
  cache_control: { type: 'ephemeral' },
  handler: async () => { ... }
};
```

## Error Handling in Tools

How you handle errors in your `handler` affects the conversation flow:

1.  **Recoverable Errors**: Return a JSON string describing the error. The model can often see this error and try to correct itself (e.g., retrying with different parameters).
    ```ts
    handler: async ({ id }) => {
      if (!id) return JSON.stringify({ error: "Missing ID" });
      // ...
    }
    ```

2.  **Fatal Errors**: If you throw an exception inside a tool handler, `node-llm` catches it and feeds the error message back to the model as a "Tool Error". This allows the model to apologize to the user or attempt a different strategy.

## Security Considerations

Treat arguments passed to your `handler` as **untrusted user input**.

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
