import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  });

  // Define a weather tool
  const weatherTool = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      }
    },
    handler: async ({ location, unit = 'celsius' }) => {
      console.log(`\n[Tool Executed] get_weather(${location}, ${unit})`);
      const temp = unit === 'celsius' ? 22 : 72;
      return JSON.stringify({
        location,
        temperature: temp,
        unit,
        condition: 'sunny'
      });
    }
  };

  // Example 1: Streaming with tool calling
  console.log("=== Example 1: DeepSeek Streaming with Tool Calling ===\n");
  const chat1 = NodeLLM.chat("deepseek-chat").withTool(weatherTool);
  
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
  
  const chat2 = NodeLLM.chat("deepseek-chat").withTool(weatherTool);
  
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
  
  const chat3 = NodeLLM.chat("deepseek-chat")
    .withTool(weatherTool)
    .onToolCall((toolCall) => {
      console.log(`\n[Event] Tool called: ${toolCall.function.name}`);
    })
    .onToolResult((result) => {
      console.log(`[Event] Tool result: ${result}\n`);
    });
  
  console.log("Question: What's the weather in Berlin?\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat3.stream("What's the weather in Berlin?")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  console.log("\n=== All DeepSeek streaming + tools examples completed ===");
}

main().catch(console.error);
