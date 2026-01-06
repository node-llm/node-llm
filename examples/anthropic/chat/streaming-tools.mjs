import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../packages/core/dist/index.js";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a location";
  schema = z.object({
    location: z.string().describe("City name"),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius')
  });

  async execute({ location, unit }) {
    console.log(`\n[Tool Executed] get_weather(${location}, ${unit})`);
    const temp = unit === 'celsius' ? 22 : 72;
    return {
      location,
      temperature: temp,
      unit,
      condition: 'sunny'
    };
  }
}

async function main() {
  NodeLLM.configure({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Example 1: Streaming with tool calling
  console.log("=== Example 1: Anthropic Streaming with Tool Calling ===\n");
  const chat1 = NodeLLM.chat("claude-3-haiku-20240307").withTool(WeatherTool);
  
  console.log("Question: What's the weather in Paris?\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat1.stream("What's the weather in Paris?")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  // Example 2: Streaming with multiple tool calls
  console.log("\n=== Example 2: Streaming with Multiple Cities ===\n");
  const chat2 = NodeLLM.chat("claude-3-haiku-20240307").withTool(WeatherTool);
  
  console.log("Question: Compare weather in London and Tokyo\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat2.stream("Compare the weather in London and Tokyo")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  // Example 3: Streaming with tool events
  console.log("\n=== Example 3: Streaming with Tool Event Handlers ===\n");
  const chat3 = NodeLLM.chat("claude-3-haiku-20240307")
    .withTool(WeatherTool)
    .onToolCall((toolCall) => {
      console.log(`\n[Event] Tool called: ${toolCall.function.name}`);
    })
    .onToolResult((result) => {
      console.log(`[Event] Tool result: ${JSON.stringify(result)}\n`);
    });
  
  console.log("Question: What's the weather in Berlin?\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat3.stream("What's the weather in Berlin?")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  console.log("\n=== All Anthropic streaming + tools examples completed ===");
}

main().catch(console.error);
