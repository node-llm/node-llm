import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a location";
  schema = z.object({
    location: z.string().describe("City name"),
    unit: z.enum(["celsius", "fahrenheit"]).default("celsius")
  });

  async execute({ location, unit }) {
    console.log(`[Tool Called] get_weather(${location}, ${unit})`);
    const temp = unit === "celsius" ? 22 : 72;
    return { location, temperature: temp, unit, condition: "sunny" };
  }
}

class CapitalTool extends Tool {
  name = "get_capital";
  description = "Get the capital city of a country";
  schema = z.object({ country: z.string() });

  async execute({ country }) {
    console.log(`[Tool Called] get_capital(${country})`);
    const capitals = { France: "Paris", Germany: "Berlin", Japan: "Tokyo" };
    return { country, capital: capitals[country] ?? "Unknown" };
  }
}

async function main() {
  const llm = NodeLLM.withProvider("xai");

  // Example 1: Single tool
  console.log("=== Example 1: Single Tool ===");
  const chat1 = llm.chat("grok-3").withTool(WeatherTool);
  const response1 = await chat1.ask("What's the weather in Paris?");
  console.log("\nFinal Answer:", response1.content);
  console.log();

  // Example 2: Multiple tools
  console.log("=== Example 2: Multiple Tools ===");
  const chat2 = llm.chat("grok-3").withTools([WeatherTool, CapitalTool]);
  const response2 = await chat2.ask("What is the capital of Germany and what's the weather there?");
  console.log("\nFinal Answer:", response2.content);
  console.log();

  // Example 3: Tool with conversation context
  console.log("=== Example 3: Conversational Tool Use ===");
  const chat3 = llm.chat("grok-3").withTool(WeatherTool);
  await chat3.ask("I'm planning a trip to Tokyo.");
  const response3 = await chat3.ask("What's the weather like there?");
  console.log("\nFinal Answer:", response3.content);
  console.log();

  console.log("=== All tool examples completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
