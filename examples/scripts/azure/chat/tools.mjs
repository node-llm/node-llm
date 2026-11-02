import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

const deployment = process.env.AZURE_MODEL || "gpt-4o";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a location";
  schema = z.object({
    location: z.string().describe("City name"),
    unit: z.enum(["celsius", "fahrenheit"]).default("celsius").describe("Temperature unit")
  });

  async execute({ location, unit }) {
    console.log(`[Tool Called] get_weather(${location}, ${unit})`);
    return { location, temperature: unit === "celsius" ? 22 : 72, unit, condition: "sunny" };
  }
}

class TimeTool extends Tool {
  name = "get_current_time";
  description = "Get the current time in a specific timezone";
  schema = z.object({ timezone: z.string().describe("Timezone (e.g., Asia/Kolkata)") });

  async execute({ timezone }) {
    console.log(`[Tool Called] get_current_time(${timezone})`);
    return { timezone, time: new Date().toLocaleTimeString("en-US", { timeZone: timezone }) };
  }
}

async function main() {
  const llm = NodeLLM.withProvider("azure");

  console.log("=== Single tool ===");
  const weather = await llm.chat(deployment).withTool(WeatherTool).ask("What's the weather in Paris?");
  console.log("Final answer:", weather.content);

  console.log("\n=== Several tools ===");
  const both = await llm
    .chat(deployment)
    .withTools([WeatherTool, TimeTool])
    .ask("What's the weather and the current time in Tokyo?");
  console.log("Final answer:", both.content);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
