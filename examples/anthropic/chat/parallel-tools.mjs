import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../packages/core/dist/index.js";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather in a given location";
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  });

  async execute({ location }) {
    console.log(`[WeatherTool] Fetching weather for ${location}...`);
    return { location, temperature: 72, condition: "sunny" };
  }
}

async function main() {
  NodeLLM.configure({
    provider: "anthropic",
  });

  const chat = NodeLLM.chat("claude-3-haiku-20240307")
    .withTool(WeatherTool);

  console.log("Asking about weather in two cities...");

  const response = await chat.ask("What is the weather like in San Francisco and New York?");

  console.log("\nFinal Response:", response.content);
  console.log("\nUsage:", response.usage);
}

main().catch(console.error);
