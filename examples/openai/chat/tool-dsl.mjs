import "dotenv/config";
import { NodeLLM, z, Tool } from "../../../packages/core/dist/index.js";

// Define a tool using the class-based DSL
class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a specific location";
  
  // Define schema using Zod
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    unit: z.enum(["celsius", "fahrenheit"]).default("celsius").describe("The temperature unit")
  });

  async execute({ location, unit }) {
    console.log(`[Tool] Fetching weather for ${location} in ${unit}...`);
    
    // Simulate API call
    return {
      location,
      temperature: 22,
      unit,
      condition: "Sunny"
    };
  }
}

async function main() {
  // Configure the default provider
  NodeLLM.configure({
    provider: "openai",
    defaultChatModel: "gpt-4o"
  });

  const chat = NodeLLM.chat();

  // Register the tool class
  chat.withTools([WeatherTool]);

  console.log("Asking: What is the weather in Paris?");
  
  const response = await chat.ask("What is the weather in Paris?");
  
  console.log("\nResponse:", response.content);
  console.log("\nUsage:", response.usage);
}

main().catch(console.error);
