import "dotenv/config";
import { createLLM, Tool, z } from "../../../../packages/core/dist/index.js";

// 1. Define Tools as Classes
class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a location";
  schema = z.object({
    location: z.string().describe("City name"),
    unit: z.enum(["celsius", "fahrenheit"]).default("celsius").describe("Temperature unit")
  });

  async execute({ location, unit }) {
    console.log(`[Tool Called] get_weather(${location}, ${unit})`);
    const temp = unit === "celsius" ? 22 : 72;
    return {
      location,
      temperature: temp,
      unit,
      condition: "sunny"
    };
  }
}

class TimeTool extends Tool {
  name = "get_current_time";
  description = "Get the current time in a specific timezone";
  schema = z.object({
    timezone: z.string().describe("Timezone (e.g., America/New_York)")
  });

  async execute({ timezone }) {
    console.log(`[Tool Called] get_current_time(${timezone})`);
    const now = new Date();
    return {
      timezone,
      time: now.toLocaleTimeString("en-US", { timeZone: timezone }),
      date: now.toLocaleDateString("en-US", { timeZone: timezone })
    };
  }
}

async function main() {
  const llm = createLLM({ provider: "bedrock" });

  // Example 1: Single tool
  console.log("=== Example 1: Single Tool ===");
  const chat1 = llm.chat("amazon.nova-lite-v1:0").withTool(WeatherTool);
  const response1 = await chat1.ask("What's the weather in Paris?");
  console.log("\nFinal Answer:", response1.content);
  console.log("\n");

  // Example 2: Multiple tools
  console.log("=== Example 2: Multiple Tools ===");
  const chat2 = llm.chat("amazon.nova-lite-v1:0").withTools([WeatherTool, TimeTool]);
  const response2 = await chat2.ask("What's the weather and current time in Tokyo?");
  console.log("\nFinal Answer:", response2.content);
  console.log("\n");

  // Example 3: Tool with different parameters
  console.log("=== Example 3: Tool with Unit Parameter ===");
  const chat3 = llm.chat("amazon.nova-lite-v1:0").withTool(WeatherTool);
  const response3 = await chat3.ask("What's the weather in New York in Fahrenheit?");
  console.log("\nFinal Answer:", response3.content);
  console.log("\n");

  // Example 4: Sequential Tool Calls
  console.log("=== Example 4: Sequential Tool Calls ===");
  const chat4 = llm.chat("amazon.nova-lite-v1:0").withTools([WeatherTool, TimeTool]);
  const response4 = await chat4.ask(
    "Compare the weather in London and Berlin, and tell me the time in both cities."
  );
  console.log("\nFinal Answer:", response4.content);
  console.log("\n");

  // Example 5: Tool with conversation context
  console.log("=== Example 5: Tool with Conversation Context ===");
  const chat5 = llm.chat("amazon.nova-lite-v1:0").withTool(WeatherTool);

  await chat5.ask("I'm planning a trip to Rome.");
  const response5 = await chat5.ask("What's the weather like there?");
  console.log("\nFinal Answer:", response5.content);
  console.log("\n");

  console.log("=== All tool examples completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
