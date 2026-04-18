import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

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
      conditions: "Sunny"
    };
  }
}

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("Creating chat with Class-Based Tools...");

  const chat = llm.chat("claude-3-haiku-20240307").withTool(WeatherTool);

  console.log("User: What is the weather in Paris?");
  const response = await chat.ask("What is the weather in Paris?");

  console.log("\nResponse:");
  console.log(response.content);
  console.log("\n");

  // Example 2: Forced Tool Choice
  console.log("=== Example 2: Forced Specific Tool (choice: 'get_weather') ===");
  const response2 = await chat
    .withToolChoice("get_weather")
    .ask("I'm visiting a new city, tell me about it.");

  console.log("Tool Calls:", response2.tool_calls?.map((tc) => tc.function.name));
  console.log("Assistant:", response2.content);
}

main().catch(e => { console.error(e); process.exit(1); });
