---
layout: default
title: Tool Calling
nav_order: 5
parent: Core Features
permalink: /core-features/tools
description: Give your models the ability to interact with the real world using a clean class-based DSL, automatic execution loops, and built-in safety guards.
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

`NodeLLM` simplifies function calling (tool use) by handling the execution loop automatically. You define the tools, and the library invokes them when the model requests it.

```bash
npm install @node-llm/core
```

{: .highlight }

> **Looking for a real-world example?** Check out the [Brand Perception Checker](https://github.com/node-llm/node-llm/tree/main/examples/applications/brand-perception-checker), which uses the `SerpTool` to perform live Google searches and "read" the results to extract semantic signals.

---

## Class-Based Tools <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">New ✨</span>

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
const chat = llm.chat().withTool(WeatherTool);
await chat.ask("What is the weather in SF?");
```

### Benefits

- **No Boilerplate**: No need to write manual JSON schemas.
- **Type Safety**: `execute()` arguments are automatically typed from your schema.
- **Self-Documenting**: The Zod `.describe()` calls are automatically pulled into the tool's description for the LLM.

### Defining Parameters with Zod

`NodeLLM` uses `zod-to-json-schema` under the hood. Most standard Zod types work out of the box:

| Zod Type              | Description                                         |
| :-------------------- | :-------------------------------------------------- |
| **All Fields**        | **Required by default**.                            |
| `z.string()`          | Basic text string.                                  |
| `z.number()`          | Number (integer or float).                          |
| `z.boolean()`         | Boolean flag.                                       |
| `z.enum(["a", "b"])`  | String restricted to specific values.               |
| `z.object({...})`     | Nested object.                                      |
| `z.array(z.string())` | Array of items.                                     |
| `.describe("...")`    | **Crucial**: Adds a description for the LLM.        |
| `.optional()`         | Marks the field as not required.                    |
| `.default(val)`       | Sets a default value if the LLM doesn't provide it. |

---

## Using Tools in Chat

Use the fluent `.withTool()` or `.withTools()` API to register tools for a chat session. By default, tools are appended. You can use the `replace` option to clear previous tools.

```ts
// Append tools
const chat = llm.chat("gpt-4o").withTools([WeatherTool, CalculatorTool]);

// Replace all existing tools with a new list
chat.withTools([SearchTool], { replace: true });

const reply = await chat.ask("What is the weather in London?");
```

---

## Tools Work in Streaming Too! <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">New ✨</span>

Tools now work seamlessly with streaming! The same tool execution happens automatically during streaming:

```ts
const chat = llm.chat("gpt-4o").withTool(WeatherTool);

// Tool is automatically executed during streaming
for await (const chunk of chat.stream("What's the weather in Paris?")) {
  process.stdout.write(chunk.content || "");
}
```

See the [Streaming documentation](streaming.html#streaming-with-tools-) for more details.

---

## Parallel Tool Calling

If the provider supports it (like OpenAI and Anthropic), the model can call multiple tools in a single turn. `NodeLLM` handles the concurrent execution of these tools automatically.

See [examples/scripts/openai/chat/parallel-tools.mjs](https://github.com/node-llm/node-llm/blob/main/examples/scripts/openai/chat/parallel-tools.mjs) for a demo.

---

## Loop Protection (Loop Guard) 🛡️

To prevent infinite recursion and runaway costs (where a model keeps calling tools without reaching a conclusion), `NodeLLM` includes a built-in Loop Guard.

By default, `NodeLLM` will throw an error if a model performs more than **5 sequential tool execution turns** in a single request.

### Customizing the Limit

You can configure this limit globally or override it for a specific request:

```ts
// 1. Global Change
const llm = createLLM({ maxToolCalls: 10 });

await chat.ask("Perform a complex deep research task", {
  maxToolCalls: 15
});
```

---

## Tool Execution Policies (Security) <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.0+</span>

For sensitive operations, you can control the "autonomy" of the tool execution loop using `withToolExecution()`.

- **`auto`**: (Default) Tools are executed immediately as proposed by the LLM.
- **`confirm`**: Enables **Human-in-the-loop**. NodeLLM pauses before execution and awaits approval via the `onConfirmToolCall` hook.
- **`dry-run`**: Proposes the tool call structure but **never executes it**. Useful for UI previews or verification-only flows.

```ts
chat.withToolExecution("confirm").onConfirmToolCall(async (call) => {
  // Audit the call or ask the user
  console.log(`LLM wants to call ${call.function.name}`);
  return true; // Return true to execute, false to cancel
});
```

### Inspected Proposals

In `confirm` and `dry-run` modes, the `ChatResponseString` object returned by `.ask()` includes a `.tool_calls` property. This allows you to inspect exactly what the model _wanted_ to do.

```ts
const res = await chat.withToolExecution("dry-run").ask("Delete all users");
console.log(res.tool_calls); // [{ id: '...', function: { name: 'delete_users', ... } }]
```

---

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

---

## Error Handling & Flow Control <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.1+</span>

`NodeLLM` handles tool errors intelligently to prevent infinite retry loops through a combination of automatic infrastructure protection and manual flow control.

### Zero-Config Safety (Fatal Errors)

By default, the agent loop will **immediately stop and throw** if it encounters an unrecoverable "fatal" error. This prevents wasting tokens on retries that are guaranteed to fail.

Fatal errors include:

- **Authentication Errors**: HTTP 401 or 403 errors from LLM providers or external APIs.
- **Explicit Fatal Errors**: Any error thrown using the `ToolError` class with `fatal: true`.

```ts
import { Tool, ToolError } from "@node-llm/core";

class DatabaseTool extends Tool {
  async execute({ query }) {
    if (isMalicious(query)) {
      // Force the agent to stop immediately
      throw new ToolError("Security Violation", "db_tool", true);
    }
  }
}
```

### Hook-Based Flow Control (STOP | CONTINUE)

For granular control, you can use the `onToolCallError` hook to override internal logic. This allows you to differentiate between tools that are "mission-critical" and those that are "optional."

The hook can return one of two directives:

- **`"STOP"`**: Force the agent to crash and bubble the error up to your code.
- **`"CONTINUE"`**: Catch the error, log it, and tell the agent to ignore it and move to the next turn.

```ts
const chat = llm.chat("gpt-4o", {
  onToolCallError: (toolCall, error) => {
    // 1. Critical Tool: Stop everything
    if (toolCall.function.name === "process_payment") {
      return "STOP";
    }

    // 2. Optional Tool: Just ignore if it fails
    if (toolCall.function.name === "fetch_avatar") {
      console.warn("Avatar fetch failed, but continuing...");
      return "CONTINUE";
    }

    // 3. Default: Let NodeLLM decide (e.g. stop on 401/403)
  }
});
```

### Recoverable Errors (AI Self-Correction)

If you want the model to see the error and try to fix its own parameters, simply return a string or object from your handler. NodeLLM will feed this back to the model as a successful tool result containing error details.

```ts
async execute({ date }) {
  if (!isValid(date)) {
    return { error: "Invalid date format. Please use YYYY-MM-DD." };
  }
}
```

### ToolHalt — Early Loop Termination <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.11.0+</span>

Sometimes a tool needs to stop the agentic loop immediately without making another LLM call. Use `this.halt()` to return a message directly to the user and break the loop.

```ts
import { Tool, z } from "@node-llm/core";

class PaymentTool extends Tool {
  name = "process_payment";
  description = "Process a payment";
  schema = z.object({
    amount: z.number().describe("Amount in dollars"),
    recipient: z.string().describe("Recipient name")
  });

  async execute({ amount, recipient }) {
    // Halt on large amounts — requires human approval
    if (amount > 10000) {
      return this.halt(`Payment of $${amount} to ${recipient} requires manager approval.`);
    }

    // Halt on invalid amounts
    if (amount <= 0) {
      return this.halt(`Invalid payment amount: $${amount}. Must be positive.`);
    }

    // Normal execution continues
    return { success: true, transactionId: "TXN-123" };
  }
}
```

**When to use `halt()`:**
- **Security boundaries**: Block dangerous operations (delete, privileged access)
- **Approval workflows**: Pause for human review on high-stakes actions
- **Validation failures**: Stop immediately on invalid input instead of retrying
- **Resource limits**: Halt when quotas or rate limits are exceeded

**Difference from throwing errors:**
- `throw new ToolError(...)` — Stops the loop and bubbles an exception
- `return this.halt(...)` — Stops the loop gracefully and returns the message as the final response

---

## Advanced: Raw JSON Schema

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

---

## Function-Based Tools (Legacy)

For simply wrapping a function without a class, you can define a tool as a plain object with a `handler`.

```ts
const weatherTool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City and state" }
      },
      required: ["location"]
    }
  },
  handler: async ({ location }) => {
    return JSON.stringify({ location, temp: 22, unit: "celsius" });
  }
};

chat.withTool(weatherTool);
```

---

## Security Considerations

Treat arguments passed to your `execute` method as **untrusted user input**.

- **Validate**: Always validate parameter types and ranges using libraries like `zod` inside the handler if critical.
- **Sanitize**: Sanitize strings before using them in database queries or shell commands.
- **Avoid Eval**: Never use `eval()` on inputs provided by the model.

---

## Debugging Tools

To see exactly what the model is calling and what your tool is returning, enable debug mode:

```bash
export NODELLM_DEBUG=true
```

You will see logs like:
`[NodeLLM] Tool call: get_weather { location: "Paris" }`
`[NodeLLM] Tool result: { temp: 15 }`
