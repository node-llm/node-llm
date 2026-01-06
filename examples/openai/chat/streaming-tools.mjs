import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../packages/core/dist/index.js";

// 1. Define Tools as Classes
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

class TimeTool extends Tool {
  name = "get_time";
  description = "Get current time in a timezone";
  schema = z.object({
    timezone: z.string().describe("Timezone (e.g., UTC, Asia/Tokyo)")
  });

  async execute({ timezone }) {
    console.log(`\n[Tool Executed] get_time(${timezone})`);
    return {
      timezone,
      time: new Date().toLocaleTimeString('en-US', { timeZone: timezone })
    };
  }
}

async function main() {
  NodeLLM.configure({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
  });

  // Example 1: Streaming with tool calling
  console.log("=== Example 1: Streaming with Tool Calling ===\n");
  const chat1 = NodeLLM.chat("gpt-4o-mini").withTool(WeatherTool);
  
  console.log("Question: What's the weather in Paris?\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat1.stream("What's the weather in Paris?")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  // Example 2: Streaming with multiple tool calls
  console.log("\n=== Example 2: Streaming with Multiple Tool Calls ===\n");
  const chat2 = NodeLLM.chat("gpt-4o-mini").withTools([WeatherTool, TimeTool]);
  
  console.log("Question: What's the weather and time in Tokyo?\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat2.stream("What's the weather and time in Tokyo?")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  // Example 3: Streaming with tool events
  console.log("\n=== Example 3: Streaming with Tool Event Handlers ===\n");
  const chat3 = NodeLLM.chat("gpt-4o-mini")
    .withTool(WeatherTool)
    .onToolCall((toolCall) => {
      console.log(`\n[Event] Tool called: ${toolCall.function.name}`);
      console.log(`[Event] Arguments: ${toolCall.function.arguments}`);
    })
    .onToolResult((result) => {
      console.log(`[Event] Tool result: ${JSON.stringify(result)}\n`);
    });
  
  console.log("Question: Compare weather in London and Berlin\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat3.stream("Compare the weather in London and Berlin")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  // Example 4: Streaming with conversation history and tools
  console.log("\n=== Example 4: Streaming with History + Tools ===\n");
  const chat4 = NodeLLM.chat("gpt-4o-mini").withTool(WeatherTool);
  
  // First message
  await chat4.ask("I'm planning a trip to Rome.");
  
  // Stream second message with tool
  console.log("Question: What's the weather like there?\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat4.stream("What's the weather like there?")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  console.log("\n=== All streaming + tools examples completed ===");
}

main().catch(console.error);
