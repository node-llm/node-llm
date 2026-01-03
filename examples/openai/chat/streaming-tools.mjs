import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
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
  console.log("=== Example 1: Streaming with Tool Calling ===\n");
  const chat1 = NodeLLM.chat("gpt-4o-mini").withTool(weatherTool);
  
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
  
  const timeTool = {
    type: 'function',
    function: {
      name: 'get_time',
      description: 'Get current time in a timezone',
      parameters: {
        type: 'object',
        properties: {
          timezone: { type: 'string' }
        },
        required: ['timezone']
      }
    },
    handler: async ({ timezone }) => {
      console.log(`\n[Tool Executed] get_time(${timezone})`);
      return JSON.stringify({
        timezone,
        time: new Date().toLocaleTimeString('en-US', { timeZone: timezone })
      });
    }
  };

  const chat2 = NodeLLM.chat("gpt-4o-mini").withTools([weatherTool, timeTool]);
  
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
    .withTool(weatherTool)
    .onToolCall((toolCall) => {
      console.log(`\n[Event] Tool called: ${toolCall.function.name}`);
      console.log(`[Event] Arguments: ${toolCall.function.arguments}`);
    })
    .onToolResult((result) => {
      console.log(`[Event] Tool result: ${result}\n`);
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
  
  const chat4 = NodeLLM.chat("gpt-4o-mini").withTool(weatherTool);
  
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
