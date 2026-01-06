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
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY,
  });

  // Example 1: Streaming with tool calling
  console.log("=== Example 1: Gemini Streaming with Tool Calling ===\n");
  const chat1 = NodeLLM.chat("gemini-2.0-flash").withTool(WeatherTool);
  
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
  const chat2 = NodeLLM.chat("gemini-2.0-flash").withTool(WeatherTool);
  
  console.log("Question: Compare weather in London and Tokyo\n");
  console.log("Streaming response:");
  
  for await (const chunk of chat2.stream("Compare the weather in London and Tokyo")) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  console.log("\n");

  console.log("\n=== All Gemini streaming + tools examples completed ===");
}

main().catch(console.error);
