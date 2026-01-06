import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../packages/core/dist/index.js";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a location";
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    unit: z.enum(["celsius", "fahrenheit"]).optional().describe("Temperature unit")
  });

  async execute({ location, unit }) {
    console.log(`[WeatherTool] Fetching weather for ${location}...`);
    return {
      location,
      temperature: 22,
      unit: unit || "celsius",
      conditions: "Sunny",
    };
  }
}

async function main() {
  NodeLLM.configure({
    provider: "anthropic",
  });

  console.log("Creating chat with Class-Based Tools...");
  
  const chat = NodeLLM.chat("claude-3-haiku-20240307")
    .withTool(WeatherTool);

  console.log("User: What is the weather in Paris?");
  const response = await chat.ask("What is the weather in Paris?");

  console.log("\nResponse:");
  console.log(response.content);
}

main().catch(console.error);
